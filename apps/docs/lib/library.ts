import path from "node:path";

// The docs read the library's source and build output directly, so the
// reference tables are generated from the real thing. Next runs with the app
// folder as the working directory, in dev and in a build.
const repoDir = path.join(process.cwd(), "..", "..");
const libraryDir = path.join(repoDir, "packages", "ui");

export const library = {
  dir: libraryDir,
  tsconfig: path.join(libraryDir, "tsconfig.json"),
  source: (component: string) =>
    path.join(libraryDir, "src", "components", component, `${component}.tsx`),
  css: (component: string) =>
    path.join(libraryDir, "dist", "css", `${component}.css`),
  styles: path.join(libraryDir, "dist", "styles.css"),
  tokens: path.join(libraryDir, "dist", "tokens.css"),
  mixins: path.join(libraryDir, "dist", "scss", "styles", "_mixins.scss"),
  // Changesets writes this when a version is cut. Until then it isn't there.
  changelog: path.join(libraryDir, "CHANGELOG.md"),
  changesets: path.join(repoDir, ".changeset"),
};
