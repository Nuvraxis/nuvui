// Writes src/palette.ts from the theme file of the installed Tailwind CSS.
// Run it after upgrading Tailwind: `pnpm --filter @nuvui/theme sync:palette`.
// A test compares the two, so a palette that has fallen behind fails there.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const themeCss = readFileSync(require.resolve("tailwindcss/theme.css"), "utf8");
const { version } = require("tailwindcss/package.json");

const scales = new Map();
for (const [, scale, step, value] of themeCss.matchAll(
  /--color-([a-z]+)-(\d+):\s*([^;]+);/g,
)) {
  scales.set(scale, { ...scales.get(scale), [step]: value.trim() });
}

const lines = [...scales].map(([scale, steps]) => {
  const entries = Object.entries(steps)
    .map(([step, value]) => `    ${step}: "${value}",`)
    .join("\n");
  return `  ${scale}: {\n${entries}\n  },`;
});

const source = `// Written by scripts/sync-palette.mjs. Don't edit it by hand.
// Color scales from Tailwind CSS ${version}'s default theme. MIT License, Copyright (c) Tailwind Labs, Inc.

export const steps = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;
export type Step = (typeof steps)[number];

export const palette = {
${lines.join("\n")}
} as const satisfies Record<string, Record<Step, string>>;

export type Scale = keyof typeof palette;
`;

writeFileSync(
  fileURLToPath(new URL("../src/palette.ts", import.meta.url)),
  source,
);
console.log(`sync-palette: ${scales.size} scales from Tailwind CSS ${version}`);
