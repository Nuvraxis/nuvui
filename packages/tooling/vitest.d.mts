import type { ViteUserConfig } from "vitest/config";

export function browserTests(options: {
  dependencies: string[];
}): ViteUserConfig;
