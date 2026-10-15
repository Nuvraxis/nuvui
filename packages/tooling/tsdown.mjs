import { defineConfig } from "tsdown";

/**
 * The build of a published package. A package's own tsdown.config.ts only
 * says where its entry points are.
 *
 * @param {object} options
 * @param {string[]} options.entry
 * @param {("esm" | "cjs")[]} [options.format] Both by default. A package
 *   whose peer dependency is ESM only has nothing to gain from a CommonJS
 *   build: `require` of it works exactly where `require` of the peer does.
 * @param {boolean} [options.css] The package has a stylesheet to build.
 * @param {boolean} [options.jsdoc] Doc comments are kept in the scripts as
 *   well as in the types. They're always in the types, where an editor
 *   reads them.
 */
export function library({
  entry,
  format = ["esm", "cjs"],
  css = true,
  jsdoc = true,
}) {
  const watch = process.argv.some((arg) => arg === "--watch" || arg === "-w");
  return defineConfig({
    entry,
    format,
    platform: "neutral",
    target: "es2022",
    dts: true,
    // One output file per source file. A bundled chunk can't carry a
    // per-file "use client" directive, so this is what keeps them intact.
    unbundle: true,
    // Not in watch mode. `pnpm dev` starts every package's watcher at once,
    // and an add-on's stylesheet is compiled against the core's dist/scss:
    // emptying that as the others start leaves them without their CSS.
    clean: !watch,
    // CSS is built here rather than as a separate script step so that watch
    // mode rebuilds it too.
    onSuccess: !css
      ? undefined
      : watch
        ? "node scripts/build-css.mjs --watch"
        : "node scripts/build-css.mjs",
    outputOptions: jsdoc
      ? undefined
      : { comments: { legal: true, annotation: true, jsdoc: false } },
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
