import path from "node:path";

// The docs read the library's source and build output directly, so the
// reference tables are generated from the real thing. Next runs with the app
// folder as the working directory, in dev and in a build.
const libraryDir = path.join(process.cwd(), "..", "..", "packages", "ui");

export const library = {
  dir: libraryDir,
  tsconfig: path.join(libraryDir, "tsconfig.json"),
  source: (component: string) =>
    path.join(libraryDir, "src", "components", component, `${component}.tsx`),
  css: (component: string) =>
    path.join(libraryDir, "dist", "css", `${component}.css`),
};
