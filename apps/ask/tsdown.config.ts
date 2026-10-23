import { defineConfig } from "tsdown";

export default defineConfig({
  // The server, and the step that writes the docs it answers from. The
  // second reads the docs the way the MCP server does, with its code.
  entry: ["src/main.ts", "src/build-data.ts"],
  format: ["esm"],
  platform: "node",
  target: "node24",
  dts: false,
});
