import { readFile } from "node:fs/promises";
import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import { checkDescriptions } from "@/components/style-reference";
import { codeHighlight } from "@/lib/code-themes";
import { library } from "@/lib/library";

// Both of these read the _mixins.scss the package ships.

interface ScssMixinsProps {
  /** What each mixin is for, keyed by its name. */
  descriptions: Record<string, string>;
}

export async function ScssMixins({ descriptions }: ScssMixinsProps) {
  const scss = await readFile(library.mixins, "utf8");
  const mixins = [...scss.matchAll(/^@mixin\s+([\w-]+)\s*(\([^)]*\))?/gm)].map(
    ([, name = "", parameters = ""]) => ({ name, parameters }),
  );
  checkDescriptions(
    "mixins",
    "scss",
    mixins.map(({ name }) => name),
    descriptions,
  );

  return (
    <section
      className="relative my-6 overflow-auto prose-no-margin"
      aria-label="Mixins"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: on a phone this box scrolls sideways, and a scrollable area has to be reachable by keyboard
      tabIndex={0}
    >
      <table className="min-w-xl">
        <thead>
          <tr>
            <th scope="col">Mixin</th>
            <th scope="col">What it does</th>
          </tr>
        </thead>
        <tbody>
          {mixins.map(({ name, parameters }) => (
            <tr key={name}>
              <th scope="row">
                <code className="whitespace-nowrap">
                  {name}
                  {parameters}
                </code>
              </th>
              <td>{descriptions[name]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export async function ScssBreakpoints() {
  const scss = await readFile(library.mixins, "utf8");
  const map = /^\$breakpoints:[\s\S]*?!default;/m.exec(scss)?.[0];
  if (!map) {
    throw new Error(`No $breakpoints map found in ${library.mixins}.`);
  }

  return <ServerCodeBlock code={map} lang="scss" {...codeHighlight} />;
}
