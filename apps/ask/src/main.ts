import { DefaultAzureCredential } from "@azure/identity";
import { serve } from "@hono/node-server";
import { createApp } from "./app.ts";
import { createTokenProvider, streamChat } from "./azure.ts";
import { readConfig } from "./config.ts";
import { createGate, createLimiter } from "./limit.ts";
import { createLogger } from "./log.ts";
import { createMetrics } from "./metrics.ts";
import { loadPages } from "./pages.ts";
import { createTracer } from "./trace.ts";
import { verifyTurnstile } from "./turnstile.ts";

const log = createLogger();
const config = readConfig();
const { version, pages } = loadPages();

// With workload identity, the pod's service account is traded for a token
// for Azure OpenAI. Nothing here holds a key.
const getToken = createTokenProvider(new DefaultAzureCredential());
const azure = { ...config.azure, getToken };

const tracer = createTracer({
  endpoint: config.otlpEndpoint,
  resource: {
    "service.name": config.serviceName,
    "service.version": config.serviceVersion ?? version,
  },
});
const metrics = createMetrics();
const secret = config.turnstileSecret;

const app = createApp({
  pages,
  trustedProxies: config.trustedProxies,
  maxQuestionChars: config.maxQuestionChars,
  maxAnswerTokens: config.maxAnswerTokens,
  timeoutMs: config.timeoutMs,
  keepAliveMs: config.keepAliveMs,
  model: config.azure.deployment,
  limit: createLimiter({ perMinute: config.perMinute }),
  gate: createGate(config.maxConcurrent),
  verify: secret
    ? (token, remoteIp, signal) =>
        verifyTurnstile({ secret, token, remoteIp, signal })
    : undefined,
  chat: (messages, options) => streamChat(azure, messages, options),
  tracer,
  metrics,
  log,
});

const api = serve({ fetch: app.fetch, port: config.port, hostname: "0.0.0.0" });

// Prometheus reads this one, from inside the cluster. It's on a port the
// public route doesn't lead to.
const metricsServer = serve({
  fetch: (request) =>
    new URL(request.url).pathname === "/metrics"
      ? new Response(metrics.render(), {
          headers: { "Content-Type": "text/plain; version=0.0.4" },
        })
      : new Response("Not found\n", { status: 404 }),
  port: config.metricsPort,
  hostname: "0.0.0.0",
});

log.info("listening", {
  port: config.port,
  metrics_port: config.metricsPort,
  pages: pages.length,
  docs_version: version,
  turnstile: secret ? "on" : "off",
  traces: config.otlpEndpoint ? "on" : "off",
});
if (!secret) log.warn("TURNSTILE_SECRET isn't set, so nothing is checked");

// Kubernetes sends this before it stops a pod. Answers being written are
// finished, and the last spans are sent.
const stop = () => {
  api.close(() => {
    metricsServer.close();
    void tracer.stop().then(() => process.exit(0));
  });
};
process.once("SIGTERM", stop);
process.once("SIGINT", stop);
