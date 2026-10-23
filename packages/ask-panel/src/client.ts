/** A page an answer was written from. */
export interface AskSource {
  title: string;
  url: string;
}

/** Why a question got no answer, as the service says it. */
export type AskErrorCode =
  | "invalid"
  | "limited"
  | "denied"
  | "busy"
  | "filtered"
  | "timeout"
  | "failed";

export class AskError extends Error {
  readonly code: AskErrorCode;
  /** For `limited` and `busy`, how many seconds to wait. */
  readonly retryAfter?: number;

  constructor(code: AskErrorCode, retryAfter?: number) {
    super(code);
    this.name = "AskError";
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

const codes = new Set<string>([
  "invalid",
  "limited",
  "denied",
  "busy",
  "filtered",
  "timeout",
  "failed",
]);
const codeOf = (value: unknown): AskErrorCode =>
  typeof value === "string" && codes.has(value)
    ? (value as AskErrorCode)
    : "failed";

export interface AskOptions {
  /** The service, such as `/api/ask`. */
  endpoint: string;
  question: string;
  /** Turnstile's token for this question, when the site checks. */
  turnstile?: string;
  signal?: AbortSignal;
  /** The pages the answer is written from, before any of it. */
  onSources?: (sources: AskSource[]) => void;
  /** Each piece of the answer as it arrives. */
  onText?: (text: string) => void;
  fetch?: typeof globalThis.fetch;
}

/** The events of a server-sent event stream, as each one is whole. */
async function* eventsOf(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: true });
    buffer = buffer.replace(/\r\n/g, "\n");
    let end = buffer.indexOf("\n\n");
    while (end >= 0) {
      const block = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      let event = "message";
      const data: string[] = [];
      for (const line of block.split("\n")) {
        // A line that starts with a colon is a comment, sent to keep the
        // connection open.
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
      }
      if (data.length > 0) yield { event, data: data.join("\n") };
      end = buffer.indexOf("\n\n");
    }
    if (done) return;
  }
}

/**
 * Asks the service a question, and hands the answer over as it's written.
 * Resolves once it's whole, and rejects with an {@link AskError} when the
 * service turns the question away or can't finish it.
 */
export async function askQuestion({
  endpoint,
  question,
  turnstile,
  signal,
  onSources,
  onText,
  fetch = globalThis.fetch,
}: AskOptions): Promise<void> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ question, turnstile }),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new AskError("failed");
  }

  if (!response.ok || !response.body) {
    let code: AskErrorCode = "failed";
    try {
      code = codeOf(((await response.json()) as { error?: unknown }).error);
    } catch {}
    const wait = Number(response.headers.get("retry-after"));
    throw new AskError(
      code,
      Number.isFinite(wait) && wait > 0 ? wait : undefined,
    );
  }

  for await (const { event, data } of eventsOf(response.body)) {
    if (event === "sources") onSources?.(JSON.parse(data) as AskSource[]);
    else if (event === "text")
      onText?.((JSON.parse(data) as { text: string }).text);
    else if (event === "error") {
      throw new AskError(
        codeOf((JSON.parse(data) as { error?: unknown }).error),
      );
    } else if (event === "done") return;
  }
  // The stream ended without saying it was done: the connection was lost.
  if (!signal?.aborted) throw new AskError("failed");
}
