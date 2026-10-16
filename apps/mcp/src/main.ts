import { loadData } from "./data";
import { createLimiter } from "./limit";
import { createCounts } from "./metrics";
import { createServer } from "./server";

// A whole number from the environment, or the default when it isn't set.
function whole(name: string, fallback: number, min: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min) {
    throw new Error(
      `${name} has to be a whole number of at least ${min}, not "${raw}"`,
    );
  }
  return value;
}

const data = loadData();

if (process.argv.includes("--stdio")) {
  // On one machine, for one agent: nothing to limit and nothing to count.
  // Standard output is the protocol's, so nothing else is written to it.
  const server = createServer(data);
  await server.start({ transportType: "stdio" });
} else {
  const endpoint = process.env.OTLP_ENDPOINT?.trim();
  const counts = endpoint
    ? createCounts({
        endpoint,
        resource: {
          "service.name": "nuvui-mcp",
          "service.version":
            process.env.SERVICE_VERSION?.trim() || data.version,
        },
      })
    : undefined;

  const server = createServer(data, {
    record: counts?.call,
    authenticate: createLimiter({
      perMinute: whole("RATE_LIMIT_PER_MINUTE", 120, 1),
      trustedProxies: whole("TRUSTED_PROXIES", 0, 0),
      onLimited: counts?.limited,
    }),
  });

  await server.start({
    transportType: "httpStream",
    httpStream: {
      port: whole("PORT", 8080, 1),
      // FastMCP listens on localhost unless told otherwise, which nothing
      // outside a container can reach.
      host: process.env.HOST?.trim() || "0.0.0.0",
      endpoint: "/mcp",
      // Every tool only reads, so no request needs one before it. Any
      // replica can answer any request, with nothing kept between them.
      stateless: true,
      // Everything it serves is public, and it takes no credentials.
      cors: true,
    },
  });

  // Kubernetes sends this before it stops a pod. What's being answered is
  // finished, and the last counts are sent.
  const stop = async () => {
    await server.stop();
    await counts?.stop();
    process.exit(0);
  };
  process.once("SIGTERM", () => void stop());
  process.once("SIGINT", () => void stop());
}
