import { checkDescriptions } from "@/components/style-reference";
import { readTokens, type TokenGroup, tokensIn } from "@/lib/tokens";

// Everything here is read out of the tokens.css the package ships. Only the
// descriptions of the semantic colors are written by hand, and the build
// fails if one is missing or describes a token that's gone.

const scrollBox = "relative my-6 overflow-auto prose-no-margin";

// `var(--color-blue-600)` reads better in a narrow column as its name.
function shorten(value: string) {
  return /^var\((--[\w-]+)\)$/.exec(value)?.[1] ?? value;
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="mr-2 inline-block size-4 rounded-sm border align-middle"
      style={{ backgroundColor: color }}
    />
  );
}

interface SemanticColorsProps {
  /** Which colors to list. The chart colors are a group of their own. */
  group?: "semantic" | "chart";
  /**
   * What each color is for, keyed by its full name. Leave it out for a group
   * whose names say it all, and the table has no descriptions.
   */
  descriptions?: Record<string, string>;
}

export async function SemanticColors({
  group = "semantic",
  descriptions,
}: SemanticColorsProps) {
  const tokens = await readTokens();
  const names = (await tokensIn(group)).map(([name]) => name);
  if (descriptions) {
    checkDescriptions(`${group} colors`, "tokens", names, descriptions);
  }

  return (
    <section
      className={scrollBox}
      aria-label={group === "chart" ? "Chart colors" : "Semantic colors"}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: on a phone this box scrolls sideways, and a scrollable area has to be reachable by keyboard
      tabIndex={0}
    >
      {/* The description sits under the name instead of in a column of its
          own. With four columns it was left about ten characters wide. */}
      <table className="min-w-xl">
        <thead>
          <tr>
            <th scope="col">Token</th>
            <th scope="col">Light</th>
            <th scope="col">Dark</th>
          </tr>
        </thead>
        <tbody>
          {names.map((name) => {
            const light = tokens.light.get(name) ?? "";
            const dark = tokens.dark.get(name) ?? "";
            return (
              <tr key={name}>
                <th scope="row">
                  <code className="whitespace-nowrap">{name}</code>
                  {descriptions && (
                    <span className="mt-1 block font-normal">
                      {descriptions[name]}
                    </span>
                  )}
                </th>
                <td className="whitespace-nowrap">
                  <Swatch color={light} />
                  <code>{shorten(light)}</code>
                </td>
                <td className="whitespace-nowrap">
                  <Swatch color={dark} />
                  <code>{shorten(dark)}</code>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export async function ColorScales() {
  const palette = await tokensIn("palette");

  // --color-gray-500 goes under "gray" as step 500. Black and white have no
  // steps, so they share a row.
  const rows = new Map<string, { label: string; name: string }[]>();
  for (const [name] of palette) {
    const [, hue, step] = /^--color-([a-z]+)-(\d+)$/.exec(name) ?? [];
    const row = hue ? `--color-${hue}-*` : "--color-black, --color-white";
    const label = step ?? name.replace("--color-", "");
    rows.set(row, [...(rows.get(row) ?? []), { label, name }]);
  }

  return (
    <div className="not-prose my-6 grid gap-5" data-color-scales>
      {[...rows].map(([row, steps]) => (
        <div key={row}>
          <p className="mb-2 text-sm font-medium">
            <code>{row}</code>
          </p>
          <ul className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
            {steps.map(({ label, name }) => (
              <li key={name} className="text-center text-xs" data-token={name}>
                <span
                  aria-hidden="true"
                  className="mb-1 block h-10 rounded-md border"
                  style={{ backgroundColor: `var(${name})` }}
                />
                {label}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

interface TokenListProps {
  /** Which group from lib/tokens.ts to list. */
  group: TokenGroup;
}

export async function TokenList({ group }: TokenListProps) {
  const tokens = await tokensIn(group);

  return (
    <section
      className={scrollBox}
      aria-label={`Tokens: ${group}`}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: same as the table above
      tabIndex={0}
    >
      <table>
        <thead>
          <tr>
            <th scope="col">Token</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map(([name, value]) => (
            <tr key={name}>
              <th scope="row">
                <code className="whitespace-nowrap">{name}</code>
              </th>
              <td>
                <code>{value}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
