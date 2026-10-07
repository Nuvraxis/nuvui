import { defineConfig } from "tsdown";

/**
 * The build of a published package. A package's own tsdown.config.ts only
 * says where its entry points are.
 *
 * @param {{ entry: string[] }} options
 */
export function library({ entry }) {
  return defineConfig({
    entry,
    format: ["esm", "cjs"],
    platform: "neutral",
    target: "es2022",
    dts: true,
    // One output file per source file. A bundled chunk can't carry a
    // per-file "use client" directive, so this is what keeps them intact.
    unbundle: true,
    clean: true,
    // CSS is built here rather than as a separate script step so that watch
    // mode rebuilds it too, after tsdown has emptied dist.
    onSuccess: "node scripts/build-css.mjs",
    inputOptions: {
      // Rolldown warns that "use client" may not survive bundling. With
      // unbundle it does, and check-dist fails the build if not.
      onLog(level, log, defaultHandler) {
        if (log.code === "MODULE_LEVEL_DIRECTIVE") return;
        defaultHandler(level, log);
      },
    },
  });
}
