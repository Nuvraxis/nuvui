import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { readConfig } from "./config.ts";

const azure = {
  AZURE_OPENAI_ENDPOINT: "https://example.openai.azure.com/",
  AZURE_OPENAI_DEPLOYMENT: "gpt-4.1-mini",
  AZURE_OPENAI_API_VERSION: "2024-10-21",
};

describe("readConfig", () => {
  test("has a default for everything but Azure, and no Turnstile or traces unless asked", () => {
    const config = readConfig(azure);
    assert.equal(config.port, 8080);
    assert.equal(config.metricsPort, 9464);
    assert.equal(config.trustedProxies, 0);
    assert.equal(config.azure.endpoint, "https://example.openai.azure.com");
    assert.equal(config.turnstileSecret, undefined);
    assert.equal(config.otlpEndpoint, undefined);
    assert.equal(config.serviceName, "nuvui-ask");
  });

  test("names what's missing", () => {
    assert.throws(
      () => readConfig({ ...azure, AZURE_OPENAI_DEPLOYMENT: " " }),
      /AZURE_OPENAI_DEPLOYMENT has to be set/,
    );
  });

  test("takes whole numbers and says when one isn't", () => {
    assert.equal(
      readConfig({ ...azure, TRUSTED_PROXIES: "2" }).trustedProxies,
      2,
    );
    assert.throws(
      () => readConfig({ ...azure, RATE_LIMIT_PER_MINUTE: "0" }),
      /RATE_LIMIT_PER_MINUTE has to be a whole number of at least 1/,
    );
  });

  test("reads the collector's address without a slash at the end", () => {
    const config = readConfig({
      ...azure,
      OTEL_EXPORTER_OTLP_ENDPOINT: "http://alloy.monitoring:4318/",
    });
    assert.equal(config.otlpEndpoint, "http://alloy.monitoring:4318");
  });
});
