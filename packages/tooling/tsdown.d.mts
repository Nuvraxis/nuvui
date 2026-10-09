import type { UserConfig } from "tsdown";

export function library(options: {
  entry: string[];
  format?: ("esm" | "cjs")[];
}): UserConfig;
