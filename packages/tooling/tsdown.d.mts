import type { UserConfig } from "tsdown";

export function library(options: {
  entry: string[];
  format?: ("esm" | "cjs")[];
  css?: boolean;
  jsdoc?: boolean;
}): UserConfig;
