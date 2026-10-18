import { readFile } from "node:fs/promises";
import { type Addon, packageOf } from "@/lib/library";

// Both tables are read out of the component's compiled CSS, so they list
// exactly what ships. The descriptions are written by hand in the MDX, and
// the build fails if one is missing or describes something that's gone.

export function checkDescriptions(
  kind: string,
  component: string,
  found: string[],
  descriptions: Record<string, string>,
) {
  const missing = found.filter((name) => !(name in descriptions));
  const stale = Object.keys(descriptions).filter(
    (name) => !found.includes(name),
  );
  if (missing.length === 0 && stale.length === 0) return;

  throw new Error(
    [
      `The ${kind} documented for "${component}" don't match the library.`,
      missing.length > 0 && `Not described: ${missing.join(", ")}`,
      stale.length > 0 &&
        `Described but not in the library: ${stale.join(", ")}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

function findVariables(css: string, component: string) {
  // A long value is written across lines, with the name on the line
  // after "var(".
  const start = new RegExp(String.raw`var\(\s*--nuv-${component}-`, "g");
  const variables = new Map<string, Set<string>>();

  for (let found = start.exec(css); found; found = start.exec(css)) {
    const from = found.index;
    // Fallbacks nest var() and calc(), so walk to the bracket that closes
    // this var() instead of stopping at the first ")".
    let depth = 0;
    let end = from + 3;
    for (; end < css.length; end += 1) {
      if (css[end] === "(") depth += 1;
      if (css[end] === ")") depth -= 1;
      if (depth === 0) break;
    }

    const inside = css.slice(from + 4, end);
    const comma = inside.indexOf(",");
    const name = (comma === -1 ? inside : inside.slice(0, comma)).trim();

    const fallbacks = variables.get(name) ?? new Set<string>();
    if (comma === -1) {
      // Read with no fallback, so the component gives it a value itself,
      // on one of its own elements. Those are its defaults.
      for (const [, value] of css.matchAll(
        new RegExp(`${name}:\\s*([^;}]+)`, "g"),
      )) {
        if (value) fallbacks.add(value.trim().replace(/\s+/g, " "));
      }
    } else {
      fallbacks.add(
        inside
          .slice(comma + 1)
          .trim()
          .replace(/\s+/g, " "),
      );
    }
    variables.set(name, fallbacks);

    // Start just inside this var(), so a variable in its fallback is found.
    start.lastIndex = from + 4;
  }

  return variables;
}

interface ReferenceProps {
  /** Folder name of the component, such as `button`. */
  component: string;
  /** The add-on package the component is in. Left out, it's the core. */
  package?: Addon;
  /** What each entry is for, keyed by its full name. */
  descriptions: Record<string, string>;
}

interface CssVariablesProps extends ReferenceProps {
  /**
   * Look in the whole stylesheet instead of one component's. For variables
   * and classes that several components share, where `component` is their
   * shared prefix.
   */
  shared?: boolean;
  /**
   * With `shared`, leave out the names of these components of the same
   * package, whose own names start with the shared prefix.
   */
  exclude?: string[];
}

// Whether a name belongs to one of the components left out.
const excluded = (name: string, exclude: string[]) =>
  exclude.some(
    (other) =>
      name.startsWith(`--nuv-${other}-`) ||
      name === `nuv-${other}` ||
      name.startsWith(`nuv-${other}_`) ||
      name.startsWith(`nuv-${other}-`),
  );

export async function CssVariables({
  component,
  package: addon,
  descriptions,
  shared = false,
  exclude = [],
}: CssVariablesProps) {
  const source = packageOf(addon);
  const css = await readFile(
    shared ? source.styles : source.css(component),
    "utf8",
  );
  const variables = new Map(
    [...findVariables(css, component)].filter(
      ([name]) => !excluded(name, exclude),
    ),
  );
  checkDescriptions(
    "CSS variables",
    component,
    [...variables.keys()],
    descriptions,
  );

  return (
    <section
      className="relative my-6 overflow-auto prose-no-margin"
      aria-label={`CSS variables of ${component}`}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: on a phone this box scrolls sideways, and a scrollable area has to be reachable by keyboard
      tabIndex={0}
    >
      {/* Three columns don't fit a phone. Below this width the table scrolls
          sideways inside its box instead of squeezing the text. */}
      <table className="min-w-xl">
        <thead>
          <tr>
            <th scope="col">Variable</th>
            <th scope="col">Default</th>
            <th scope="col">What it sets</th>
          </tr>
        </thead>
        <tbody>
          {[...variables].map(([name, fallbacks]) => (
            <tr key={name}>
              <th scope="row">
                <code className="whitespace-nowrap">{name}</code>
              </th>
              <td>
                {[...fallbacks].map((fallback) => (
                  <div key={fallback}>
                    <code>{fallback}</code>
                  </div>
                ))}
              </td>
              <td>{descriptions[name]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export async function BemClasses({
  component,
  package: addon,
  descriptions,
  shared = false,
  exclude = [],
}: CssVariablesProps) {
  const source = packageOf(addon);
  const css = await readFile(
    shared ? source.styles : source.css(component),
    "utf8",
  );
  const pattern = new RegExp(`\\.(nuv-${component}[a-z0-9_-]*)`, "g");
  const classes = [
    ...new Set([...css.matchAll(pattern)].map(([, name]) => name)),
  ]
    .filter(
      (name): name is string => name !== undefined && !excluded(name, exclude),
    )
    .sort();
  checkDescriptions("classes", component, classes, descriptions);

  return (
    <section
      className="relative my-6 overflow-auto prose-no-margin"
      aria-label={`Classes of ${component}`}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: same as the table above
      tabIndex={0}
    >
      <table>
        <thead>
          <tr>
            <th scope="col">Class</th>
            <th scope="col">What it's on</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((name) => (
            <tr key={name}>
              <th scope="row">
                <code className="whitespace-nowrap">.{name}</code>
              </th>
              <td>{descriptions[name]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
