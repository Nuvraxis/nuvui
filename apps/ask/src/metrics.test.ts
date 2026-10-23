import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createMetrics } from "./metrics.ts";

describe("createMetrics", () => {
  test("counts questions by how they ended, tokens, and how long they took, in Prometheus's format", () => {
    const metrics = createMetrics();
    metrics.question("answered", 3);
    metrics.question("answered", 0.4);
    metrics.question("limited", 0.01);
    metrics.tokens(900, 40);
    metrics.started();
    const text = metrics.render();

    assert.match(text, /^nuvui_ask_questions_total\{outcome="answered"\} 2$/m);
    assert.match(text, /^nuvui_ask_questions_total\{outcome="limited"\} 1$/m);
    assert.match(text, /^nuvui_ask_tokens_total\{kind="prompt"\} 900$/m);
    assert.match(text, /^nuvui_ask_tokens_total\{kind="completion"\} 40$/m);
    // Buckets count every question up to their bound.
    assert.match(
      text,
      /^nuvui_ask_question_duration_seconds_bucket\{le="0.5"\} 2$/m,
    );
    assert.match(
      text,
      /^nuvui_ask_question_duration_seconds_bucket\{le="4"\} 3$/m,
    );
    assert.match(
      text,
      /^nuvui_ask_question_duration_seconds_bucket\{le="\+Inf"\} 3$/m,
    );
    assert.match(text, /^nuvui_ask_question_duration_seconds_count 3$/m);
    assert.match(text, /^nuvui_ask_in_flight 1$/m);
    assert.ok(text.endsWith("\n"));
  });
});
