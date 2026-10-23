/** What a model is told: a rule, or a turn of the conversation. */
export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export type ChatEvent =
  | { type: "text"; text: string }
  | { type: "usage"; promptTokens: number; completionTokens: number }
  /** Azure's content filter stopped the answer partway. */
  | { type: "filtered" }
  | { type: "end"; finishReason: string | null };

/** Why a question got no answer from the model. */
export class ModelError extends Error {
  readonly code: "filtered" | "busy" | "upstream";
  /** For `busy`, how many seconds Azure asked to wait. */
  readonly retryAfter?: number;

  constructor(code: ModelError["code"], message: string, retryAfter?: number) {
    super(message);
    this.name = "ModelError";
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

/** The part of `@azure/identity`'s credentials this uses. */
export interface TokenSource {
  getToken(
    scope: string,
  ): Promise<{ token: string; expiresOnTimestamp: number } | null>;
}

const scope = "https://cognitiveservices.azure.com/.default";

/**
 * A bearer token for Azure OpenAI, asked for again only when the one kept
 * has under five minutes left. With workload identity, `DefaultAzureCredential`
 * trades the pod's service account token for it, so there's no key.
 */
export function createTokenProvider(
  credential: TokenSource,
  now: () => number = Date.now,
) {
  let kept: { token: string; expiresOnTimestamp: number } | null = null;
  return async () => {
    if (!kept || kept.expiresOnTimestamp - now() < 5 * 60_000) {
      kept = await credential.getToken(scope);
      if (!kept) throw new ModelError("upstream", "No token for Azure OpenAI");
    }
    return kept.token;
  };
}

export interface AzureChatOptions {
  endpoint: string;
  deployment: string;
  apiVersion: string;
  getToken: () => Promise<string>;
  fetch?: typeof globalThis.fetch;
}

interface Chunk {
  choices?: {
    delta?: { content?: string | null };
    finish_reason?: string | null;
  }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number } | null;
}

/** The lines of a server-sent event stream, as each one arrives. */
async function* linesOf(body: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder();
  let buffer = "";
  for await (const piece of body) {
    buffer += decoder.decode(piece, { stream: true });
    let end = buffer.indexOf("\n");
    while (end >= 0) {
      yield buffer.slice(0, end).replace(/\r$/, "");
      buffer = buffer.slice(end + 1);
      end = buffer.indexOf("\n");
    }
  }
  if (buffer) yield buffer;
}

async function errorOf(response: Response): Promise<ModelError> {
  let code: string | undefined;
  try {
    const body = (await response.json()) as {
      error?: { code?: string; innererror?: { code?: string } };
    };
    code = body.error?.code ?? body.error?.innererror?.code;
  } catch {}
  // Azure turns a question its filter won't take away with a 400 that
  // says why, before anything is written.
  if (code === "content_filter" || code === "ResponsibleAIPolicyViolation") {
    return new ModelError("filtered", "The question was filtered");
  }
  if (response.status === 429) {
    const wait = Number(response.headers.get("retry-after"));
    return new ModelError(
      "busy",
      "Azure OpenAI asked to wait",
      Number.isFinite(wait) && wait > 0 ? wait : undefined,
    );
  }
  return new ModelError(
    "upstream",
    `Azure OpenAI answered ${response.status}${code ? ` (${code})` : ""}`,
  );
}

/**
 * Asks the deployment for an answer and gives it back as it's written, a
 * piece of text at a time, then what it cost in tokens.
 */
export async function* streamChat(
  options: AzureChatOptions,
  messages: ChatMessage[],
  { maxTokens, signal }: { maxTokens: number; signal?: AbortSignal },
): AsyncGenerator<ChatEvent> {
  const fetch = options.fetch ?? globalThis.fetch;
  const url = `${options.endpoint}/openai/deployments/${encodeURIComponent(
    options.deployment,
  )}/chat/completions?api-version=${encodeURIComponent(options.apiVersion)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await options.getToken()}`,
    },
    body: JSON.stringify({
      messages,
      stream: true,
      // The last chunk says how many tokens the question and the answer
      // took, for the counts.
      stream_options: { include_usage: true },
      max_tokens: maxTokens,
      temperature: 0.2,
    }),
    signal,
  });
  if (!response.ok || !response.body) throw await errorOf(response);

  let finishReason: string | null = null;
  for await (const line of linesOf(response.body)) {
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trim();
    if (data === "[DONE]") break;
    let chunk: Chunk;
    try {
      chunk = JSON.parse(data) as Chunk;
    } catch {
      continue;
    }
    // The first chunks only say what the filter thought of the question,
    // with no choices in them.
    for (const choice of chunk.choices ?? []) {
      const text = choice.delta?.content;
      if (text) yield { type: "text", text };
      if (choice.finish_reason) finishReason = choice.finish_reason;
    }
    if (chunk.usage) {
      yield {
        type: "usage",
        promptTokens: chunk.usage.prompt_tokens ?? 0,
        completionTokens: chunk.usage.completion_tokens ?? 0,
      };
    }
  }
  if (finishReason === "content_filter") yield { type: "filtered" };
  yield { type: "end", finishReason };
}
