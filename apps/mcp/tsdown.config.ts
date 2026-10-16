import { defineConfig } from "tsdown";

export default defineConfig({
  // The server, and the step that writes its data. The charts' list is
  // read from the website's source and goes into the second.
  entry: ["src/main.ts", "src/build-data.ts"],
  format: ["esm"],
  platform: "node",
  target: "node24",
  dts: false,
});
