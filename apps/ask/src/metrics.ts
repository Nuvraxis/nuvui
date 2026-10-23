// The counts Prometheus reads from /metrics, in its text format, on a port
// of their own. Written by hand for the same reason as trace.ts: four
// metrics don't need a client library, and prom-client brings
// @opentelemetry/api with it.

/** How a question ended. */
export type Outcome =
  | "answered"
  | "no_match"
  | "filtered"
  | "invalid"
  | "denied"
  | "limited"
  | "busy"
  | "timeout"
  | "aborted"
  | "failed";

// Seconds. An answer takes a few seconds, and the timeout is a minute.
const buckets = [0.5, 1, 2, 4, 8, 15, 30, 60];

const escapeLabel = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");

export function createMetrics() {
  const questions = new Map<Outcome, number>();
  const tokens = { prompt: 0, completion: 0 };
  const durations = { counts: buckets.map(() => 0), sum: 0, count: 0 };
  let inFlight = 0;

  return {
    question(outcome: Outcome, seconds: number) {
      questions.set(outcome, (questions.get(outcome) ?? 0) + 1);
      durations.sum += seconds;
      durations.count += 1;
      buckets.forEach((bound, index) => {
        if (seconds <= bound)
          durations.counts[index] = (durations.counts[index] ?? 0) + 1;
      });
    },
    tokens(prompt: number, completion: number) {
      tokens.prompt += prompt;
      tokens.completion += completion;
    },
    started() {
      inFlight += 1;
    },
    finished() {
      inFlight = Math.max(0, inFlight - 1);
    },
    /** What Prometheus is sent. Nothing in it says who asked, or what. */
    render() {
      const lines = [
        "# HELP nuvui_ask_questions_total Questions, by how they ended.",
        "# TYPE nuvui_ask_questions_total counter",
        ...[...questions].map(
          ([outcome, count]) =>
            `nuvui_ask_questions_total{outcome="${escapeLabel(outcome)}"} ${count}`,
        ),
        "# HELP nuvui_ask_tokens_total Tokens Azure OpenAI counted, for the question with its pages and for the answer.",
        "# TYPE nuvui_ask_tokens_total counter",
        `nuvui_ask_tokens_total{kind="prompt"} ${tokens.prompt}`,
        `nuvui_ask_tokens_total{kind="completion"} ${tokens.completion}`,
        "# HELP nuvui_ask_question_duration_seconds How long a question took, from arriving to its last word.",
        "# TYPE nuvui_ask_question_duration_seconds histogram",
        ...buckets.map(
          (bound, index) =>
            `nuvui_ask_question_duration_seconds_bucket{le="${bound}"} ${durations.counts[index]}`,
        ),
        `nuvui_ask_question_duration_seconds_bucket{le="+Inf"} ${durations.count}`,
        `nuvui_ask_question_duration_seconds_sum ${durations.sum}`,
        `nuvui_ask_question_duration_seconds_count ${durations.count}`,
        "# HELP nuvui_ask_in_flight Questions being answered now.",
        "# TYPE nuvui_ask_in_flight gauge",
        `nuvui_ask_in_flight ${inFlight}`,
      ];
      return `${lines.join("\n")}\n`;
    },
  };
}

export type Metrics = ReturnType<typeof createMetrics>;
