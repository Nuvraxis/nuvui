type Field = string | number | boolean | undefined;

/**
 * One JSON object a line on standard output, which Alloy sends to Loki.
 * What a visitor typed is never a field: a question is logged by its
 * length, how it ended, how long it took and what it cost.
 */
export function createLogger(
  write: (line: string) => void = (line) => process.stdout.write(line),
  now: () => Date = () => new Date(),
) {
  const log =
    (level: "info" | "warn" | "error") =>
    (message: string, fields: Record<string, Field> = {}) => {
      const entry: Record<string, Field> = {
        time: now().toISOString(),
        level,
        msg: message,
      };
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) entry[key] = value;
      }
      write(`${JSON.stringify(entry)}\n`);
    };
  return { info: log("info"), warn: log("warn"), error: log("error") };
}

export type Logger = ReturnType<typeof createLogger>;
