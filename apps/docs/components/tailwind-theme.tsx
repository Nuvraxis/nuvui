import { readFile } from "node:fs/promises";
import path from "node:path";
import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import { codeHighlight } from "@/lib/code-themes";
import { readTokens } from "@/lib/tokens";

// Prints the @theme block that turns the library's semantic colors into
// Tailwind utilities. The list comes from tokens.css, so a new color shows up
// here by itself. This site's own stylesheet has to contain every line, which
// is what makes the block on the page one that has actually been run.
export async function TailwindTheme() {
  const tokens = await readTokens();
  const lines = [...tokens.dark.keys()].map((name) => `${name}: var(${name});`);

  const siteCss = await readFile(
    path.join(process.cwd(), "app", "semantic-colors.css"),
    "utf8",
  );
  const missing = lines.filter((line) => !siteCss.includes(line));
  if (missing.length > 0) {
    throw new Error(
      `app/semantic-colors.css is missing these lines, so the Tailwind guide would show a mapping this site doesn't use:\n${missing.join("\n")}`,
    );
  }

  return (
    <ServerCodeBlock
      code={`@theme inline reference {\n${lines.map((line) => `  ${line}`).join("\n")}\n}`}
      lang="css"
      {...codeHighlight}
      codeblock={{ title: "app/globals.css" }}
    />
  );
}
