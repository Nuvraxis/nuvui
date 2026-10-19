import { defineConfig } from "tsdown";

export default defineConfig({
  // The server, the step that writes its data, and the one that keeps a
  // release's docs. The charts' list is read from the website's source and
  // goes into the second.
  entry: ["src/main.ts", "src/build-data.ts", "src/snapshot.ts"],
  format: ["esm"],
  platform: "node",
  target: "node24",
  dts: false,
});
