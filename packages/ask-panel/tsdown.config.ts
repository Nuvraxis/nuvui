import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "browser",
  target: "es2022",
  dts: true,
  // A file for each source file, so the panel keeps its "use client".
  unbundle: true,
  inputOptions: {
    onLog(level, log, defaultHandler) {
      if (log.code === "MODULE_LEVEL_DIRECTIVE") return;
      defaultHandler(level, log);
    },
  },
});
