import path from "node:path";

// The docs read each package's source and build output directly, so the
// reference tables are generated from the real thing. Next runs with the app
// folder as the working directory, in dev and in a build.
const repoDir = path.join(process.cwd(), "..", "..");

// What every published package has, by the folder it's in.
function pkg(folder: string, name: string) {
  const dir = path.join(repoDir, "packages", folder);
  return {
    name,
    dir,
    tsconfig: path.join(dir, "tsconfig.json"),
    source: (component: string) =>
      path.join(dir, "src", "components", component, `${component}.tsx`),
    css: (component: string) =>
      path.join(dir, "dist", "css", `${component}.css`),
    styles: path.join(dir, "dist", "styles.css"),
    // Changesets writes this when a version is cut. Until then it isn't
    // there.
    changelog: path.join(dir, "CHANGELOG.md"),
  };
}

const core = pkg("ui", "@nuvui/react");

export const library = {
  ...core,
  tokens: path.join(core.dir, "dist", "tokens.css"),
  mixins: path.join(core.dir, "dist", "scss", "styles", "_mixins.scss"),
  changesets: path.join(repoDir, ".changeset"),
};

// The packages that add to the core, by the name a page gives in its
// `package` prop.
export const addons = {
  "date-picker": pkg("date-picker", "@nuvui/date-picker"),
};

export type Addon = keyof typeof addons;

/** The package a reference table reads: an add-on, or the core. */
export function packageOf(addon: Addon | undefined) {
  return addon ? addons[addon] : library;
}
