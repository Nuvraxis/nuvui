# @nuvui/ask

The service behind the Ask AI panel on the website and the docs. It takes a visitor's question, with the conversation before it, and has a model on Azure OpenAI look the answer up in the docs with the MCP server's tools, then streams the answer with links to the pages it read.

The tools are the MCP server's own, from `apps/mcp/src/tools.ts`, run in this service on the same data, which the build reads with the MCP server's code. So they answer exactly as the MCP server does, and the service doesn't call it. The data also has the two pages the skill leaves out, about using nuvui with agents and about the MCP server, since visitors ask about both.

## How a question is answered

`POST /api/ask` with `{ "question": "...", "history": [{ "role": "user" | "assistant", "text": "..." }], "turnstile": "<token>" }`, in this order:

1. The question is 1 to `MAX_QUESTION_CHARS` characters, and the history at most 8 turns of 4,000 characters and 12,000 in all, or a 400.
2. The visitor has asked fewer than `RATE_LIMIT_PER_MINUTE` questions this minute on this pod, or a 429 with `Retry-After`. The visitor is told apart by `X-Forwarded-For`, read through `TRUSTED_PROXIES`.
3. With `TURNSTILE_SECRET` set, the token passes Cloudflare's check, or a 403.
4. Fewer than `MAX_CONCURRENT` questions are being answered on this pod, or a 503 with `Retry-After`.
5. The model is asked, with the tools. It can search, read pages and list what there is, as many times as it asks in up to `MAX_TOOL_ROUNDS` rounds, each a call to Azure OpenAI. After the last round it's asked once more without the tools, and has to answer with what it found.
6. All of it goes back as server-sent events: `status` with `{ "text": "Reading Theming and tokens" }` for each tool it runs, `sources` with every page it has read so far each time it reads another, `text` (the answer, a piece at a time), then `done`, or `error` with `{ "error": "filtered" | "busy" | "timeout" | "failed" }`.

The conversation is sent to the model inside the visitor's turn, between `<conversation>` tags, and never as turns of its own: the browser sends it, so anything can be written into it, and the model is told to take none of it as an instruction.

What one question can cost is bounded. The model runs at most 4 tools a round. A tool's result is cut at 16,000 characters, with a note that asks the model for one section of the page instead. Once the results come to 48,000 characters, it's offered no more tools and has to answer. A tool name it makes up is counted, and named in the spans, as `unknown`.

A comment line goes out every `KEEP_ALIVE_MS` while nothing else does, so Cloudflare doesn't close a response that's waiting on the model. The stream has `X-Accel-Buffering: no`, so the Gateway's nginx passes each piece on as it comes.

## Settings

| Variable | Default | |
| --- | --- | --- |
| `AZURE_OPENAI_ENDPOINT` | required | The resource, such as `https://name.openai.azure.com` |
| `AZURE_OPENAI_DEPLOYMENT` | required | The deployment's name |
| `AZURE_OPENAI_API_VERSION` | required | Such as `2024-10-21` |
| `TRUSTED_PROXIES` | `0` | `2` behind Cloudflare and the Gateway. With `0`, every visitor shares one limit |
| `TURNSTILE_SECRET` | unset | Turnstile's secret key. Unset, nothing is checked, and the log says so at start |
| `RATE_LIMIT_PER_MINUTE` | `6` | Questions per visitor per minute, per pod |
| `MAX_CONCURRENT` | `8` | Questions answered at once, per pod |
| `MAX_QUESTION_CHARS` | `1000` | |
| `MAX_ANSWER_TOKENS` | `800` | The most the model writes in one call |
| `MAX_TOOL_ROUNDS` | `4` | How many times the model may ask for tools before it has to answer |
| `ANSWER_TIMEOUT_MS` | `60000` | |
| `KEEP_ALIVE_MS` | `15000` | |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | unset | The collector, without `/v1/traces`. Unset, no traces are sent |
| `OTEL_SERVICE_NAME` | `nuvui-ask` | |
| `SERVICE_VERSION` | the docs' version | The image sets it to the commit |
| `PORT` | `8080` | The API and the probes |
| `METRICS_PORT` | `9464` | `/metrics`, for Prometheus |

There's no key. The service signs in to Azure OpenAI with `DefaultAzureCredential`, which uses workload identity in the cluster.

## What it reports

- **Traces:** OTLP over HTTP as JSON, to `$OTEL_EXPORTER_OTLP_ENDPOINT/v1/traces`. A span for each request, continuing a `traceparent` it's sent, with spans under it for the Turnstile check, each call to the model, and each tool it ran. A model's span has the deployment and the tokens used. A tool's span has its name and how it ended, and not what it was asked.
- **Logs:** one JSON object a line on standard output. One line for each question, with `outcome`, `status`, `duration_ms`, `question_length`, `history_turns`, `rounds`, `tool_calls`, `pages`, the tokens over every call, `trace_id` and `span_id`, and for a failure the error's own message. What a visitor typed is never logged, nor what the model searched for, and neither is in the traces.
- **Metrics:** Prometheus's text format at `:9464/metrics`:
  - `nuvui_ask_questions_total{outcome}` (counter)
  - `nuvui_ask_tool_calls_total{tool, outcome}` (counter)
  - `nuvui_ask_tokens_total{kind="prompt"|"completion"}` (counter, for the daily alert on spend). A question is several calls to the model, each sent the conversation and every tool result so far, so it costs more than one call would.
  - `nuvui_ask_question_duration_seconds` (histogram)
  - `nuvui_ask_in_flight` (gauge)

  Each pod counts from its own start.

## In the cluster

What the manifests need to match. They live with the rest of the cluster's configuration.

- **Route:** an HTTPRoute on `nuvui.nuvraxis.com` that sends the path `/api/ask` to the Service's API port, as the web vitals route sends `/otlp/v1/metrics`. Nothing else of the service is public.
- **Service:** port 80 to the container's 8080 for the API, and a port named for the ServiceMonitor to 9464.
- **ServiceMonitor:** on the metrics port, path `/metrics`.
- **Probes:** `GET /healthz` for liveness and `GET /readyz` for readiness, on 8080. Neither calls Azure.
- **Pod security:** runs as uid 1000, writes nothing, so `readOnlyRootFilesystem: true`, `runAsNonRoot: true`, and all capabilities dropped.
- **Workload identity:** the pod has the label `azure.workload.identity/use: "true"`, and its ServiceAccount the annotation `azure.workload.identity/client-id` with the user-assigned identity's client id. The identity has a federated credential for `system:serviceaccount:nuvui:<the ServiceAccount>`, and the role `Cognitive Services OpenAI User` on the OpenAI resource.
- **Secrets:** `TURNSTILE_SECRET` from the `turnstile-secret` in Key Vault.
- **NetworkPolicy:**
  - In: from the Gateway's nginx pods on 8080, and from Prometheus on 9464.
  - Out: DNS; `alloy.monitoring` on 4318; HTTPS to the Azure OpenAI endpoint; HTTPS to `login.microsoftonline.com`, which workload identity trades the pod's token with; and HTTPS to `challenges.cloudflare.com`, for Turnstile. A plain NetworkPolicy can't name hosts, so the last three are by address range, or by name with a CNI that supports it.
- **At the edge:** a Cloudflare rate-limiting rule on `/api/ask` stops a flood before it reaches the cluster. The per-pod limits here are a second line.

## Working on it

```sh
pnpm --filter @nuvui/ask build      # the server, and dist/data.json from the docs
pnpm --filter @nuvui/ask test       # node --test, with no network
pnpm --filter @nuvui/ask typecheck
```

The tests run the sources as they are, with Node's own test runner, so an import names its `.ts` file. Traces and metrics are written by hand rather than with the OpenTelemetry SDK and prom-client: both bring in `@opentelemetry/api`, and with it in the workspace, pnpm resolves Vitest's optional peers differently for some packages and not others, which breaks the browser tests' types.
