import { defineConfig } from "tsdown";

const watch = process.argv.some((arg) => arg === "--watch" || arg === "-w");

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "neutral",
  target: "es2022",
  dts: true,
  // The other packages' CSS build imports this one's dist. Emptying it in
  // watch mode, as their watchers start, breaks them.
  clean: !watch,
});
