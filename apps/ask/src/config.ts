/** What the service is told by its environment. */
export interface Config {
  /** Where the questions come in. */
  port: number;
  /** Where Prometheus reads the counts, away from the public path. */
  metricsPort: number;
  /**
   * How many proxies in front add to `X-Forwarded-For`. Behind Cloudflare
   * and the Gateway's nginx it's 2. With 0, every visitor is the proxy.
   */
  trustedProxies: number;
  /** Questions one visitor may ask in a minute, on one pod. */
  perMinute: number;
  /** Questions answered at once, on one pod. One more gets a 503. */
  maxConcurrent: number;
  maxQuestionChars: number;
  maxAnswerTokens: number;
  /** How long an answer may take from start to end. */
  timeoutMs: number;
  /** How often a comment is sent while nothing else is. */
  keepAliveMs: number;
  azure: {
    /** Such as `https://name.openai.azure.com`. */
    endpoint: string;
    deployment: string;
    apiVersion: string;
  };
  /** Without it, Turnstile isn't checked: for a run on one machine. */
  turnstileSecret?: string;
  /** The collector's address, without `/v1/traces`. Without it, no traces. */
  otlpEndpoint?: string;
  serviceName: string;
  serviceVersion?: string;
}

type Env = Readonly<Record<string, string | undefined>>;

function whole(env: Env, name: string, fallback: number, min: number) {
  const raw = env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min) {
    throw new Error(
      `${name} has to be a whole number of at least ${min}, not "${raw}"`,
    );
  }
  return value;
}

function required(env: Env, name: string) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} has to be set`);
  return value;
}

const optional = (env: Env, name: string) => env[name]?.trim() || undefined;

/** The service's settings, or an error that names what's missing. */
export function readConfig(env: Env = process.env): Config {
  return {
    port: whole(env, "PORT", 8080, 1),
    metricsPort: whole(env, "METRICS_PORT", 9464, 1),
    trustedProxies: whole(env, "TRUSTED_PROXIES", 0, 0),
    perMinute: whole(env, "RATE_LIMIT_PER_MINUTE", 6, 1),
    maxConcurrent: whole(env, "MAX_CONCURRENT", 8, 1),
    maxQuestionChars: whole(env, "MAX_QUESTION_CHARS", 1000, 1),
    maxAnswerTokens: whole(env, "MAX_ANSWER_TOKENS", 800, 1),
    timeoutMs: whole(env, "ANSWER_TIMEOUT_MS", 60_000, 1000),
    keepAliveMs: whole(env, "KEEP_ALIVE_MS", 15_000, 1000),
    azure: {
      endpoint: required(env, "AZURE_OPENAI_ENDPOINT").replace(/\/+$/, ""),
      deployment: required(env, "AZURE_OPENAI_DEPLOYMENT"),
      apiVersion: required(env, "AZURE_OPENAI_API_VERSION"),
    },
    turnstileSecret: optional(env, "TURNSTILE_SECRET"),
    otlpEndpoint: optional(env, "OTEL_EXPORTER_OTLP_ENDPOINT")?.replace(
      /\/+$/,
      "",
    ),
    serviceName: optional(env, "OTEL_SERVICE_NAME") ?? "nuvui-ask",
    serviceVersion: optional(env, "SERVICE_VERSION"),
  };
}
