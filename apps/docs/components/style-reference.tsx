import { readFile } from "node:fs/promises";
import { library } from "@/lib/library";

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
  const start = `var(--nuv-${component}-`;
  const variables = new Map<string, Set<string>>();

  let from = css.indexOf(start);
  while (from !== -1) {
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
    const name = inside.slice(0, comma).trim();
    const fallback = inside
      .slice(comma + 1)
      .trim()
      .replace(/\s+/g, " ");

    const fallbacks = variables.get(name) ?? new Set<string>();
    fallbacks.add(fallback);
    variables.set(name, fallbacks);

    // Start just inside this var(), so a variable in its fallback is found.
    from = css.indexOf(start, from + start.length);
  }

  return variables;
}

interface ReferenceProps {
  /** Folder name of the component, such as `button`. */
  component: string;
  /** What each entry is for, keyed by its full name. */
  descriptions: Record<string, string>;
}

interface CssVariablesProps extends ReferenceProps {
  /**
   * Look in the whole stylesheet instead of one component's. For variables
   * that several components read, where `component` is their shared prefix.
   */
  shared?: boolean;
}

export async function CssVariables({
  component,
  descriptions,
  shared = false,
}: CssVariablesProps) {
  const css = await readFile(
    shared ? library.styles : library.css(component),
    "utf8",
  );
  const variables = findVariables(css, component);
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

export async function BemClasses({ component, descriptions }: ReferenceProps) {
  const css = await readFile(library.css(component), "utf8");
  const pattern = new RegExp(`\\.(nuv-${component}[a-z0-9_-]*)`, "g");
  const classes = [
    ...new Set([...css.matchAll(pattern)].map(([, name]) => name)),
  ]
    .filter((name): name is string => name !== undefined)
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
