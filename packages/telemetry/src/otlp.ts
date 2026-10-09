import type { Instrument } from "./instruments";

/** One measured value. */
export interface Sample {
  instrument: Instrument;
  value: number;
  attributes: Readonly<Record<string, string>>;
  /** When what was measured began, in milliseconds since 1970. */
  startTime: number;
  /** When it was measured, in milliseconds since 1970. */
  time: number;
}

// AGGREGATION_TEMPORALITY_DELTA in the protocol. Each browser reports what
// it saw and nothing about the browsers before it, and adding those up is
// the collector's job. The other choice, cumulative, would have every
// visitor claim a running total that starts again at one.
const delta = 1;

const scope = "@nuvui/telemetry";

const keyValues = (attributes: Readonly<Record<string, string>>) =>
  Object.entries(attributes).map(([key, value]) => ({
    key,
    value: { stringValue: value },
  }));

// The protocol's JSON writes a 64-bit integer as a string. A time in
// nanoseconds doesn't fit in a JavaScript number.
const nanoseconds = (milliseconds: number) =>
  `${Math.max(0, Math.round(milliseconds))}000000`;

/** Which bucket a value is in: the first whose upper edge it doesn't pass. */
export function bucketOf(bounds: readonly number[], value: number): number {
  const index = bounds.findIndex((bound) => value <= bound);
  return index < 0 ? bounds.length : index;
}

function dataPoint({ instrument, value, attributes, startTime, time }: Sample) {
  const bucketCounts = Array.from(
    { length: instrument.bounds.length + 1 },
    () => "0",
  );
  bucketCounts[bucketOf(instrument.bounds, value)] = "1";
  return {
    attributes: keyValues(attributes),
    // A point that starts after it ends is refused.
    startTimeUnixNano: nanoseconds(Math.min(startTime, time)),
    timeUnixNano: nanoseconds(time),
    count: "1",
    sum: value,
    min: value,
    max: value,
    bucketCounts,
    explicitBounds: [...instrument.bounds],
  };
}

/**
 * The body of a POST to a collector's `/v1/metrics`, in the JSON form of
 * the OpenTelemetry protocol: every sample as a histogram of one value.
 */
export function metricsPayload(
  resource: Readonly<Record<string, string>>,
  samples: readonly Sample[],
) {
  const byInstrument = new Map<Instrument, Sample[]>();
  for (const sample of samples) {
    const of = byInstrument.get(sample.instrument);
    if (of) of.push(sample);
    else byInstrument.set(sample.instrument, [sample]);
  }

  return {
    resourceMetrics: [
      {
        resource: { attributes: keyValues(resource) },
        scopeMetrics: [
          {
            scope: { name: scope },
            metrics: [...byInstrument].map(([instrument, of]) => ({
              name: instrument.name,
              unit: instrument.unit,
              description: instrument.description,
              histogram: {
                aggregationTemporality: delta,
                dataPoints: of.map(dataPoint),
              },
            })),
          },
        ],
      },
    ],
  };
}
