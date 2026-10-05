import { readFile } from "node:fs/promises";
import path from "node:path";
import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import type { ComponentType } from "react";
import { codeHighlight } from "@/lib/code-themes";

interface PreviewProps {
  /** Path of the example under `examples/`, without the extension. */
  name: string;
}

// Renders an example and prints the file it came from. The code on the page
// is the code that's running, because it's the same file.
export async function Preview({ name }: PreviewProps) {
  const [module, code] = await Promise.all([
    import(`@/examples/${name}.tsx`) as Promise<{ default: ComponentType }>,
    readFile(path.join(process.cwd(), "examples", `${name}.tsx`), "utf8"),
  ]);
  const Example = module.default;

  return (
    // not-prose keeps the article's link and paragraph styles off the
    // components being shown.
    <figure className="not-prose my-6" data-preview={name}>
      <div
        className="flex min-h-40 flex-wrap items-center justify-center gap-3 rounded-t-xl border border-b-0 p-6"
        style={{
          backgroundColor: "var(--color-background)",
          color: "var(--color-foreground)",
        }}
      >
        <Example />
      </div>
      <ServerCodeBlock
        code={code.trim()}
        lang="tsx"
        {...codeHighlight}
        codeblock={{ className: "my-0 rounded-t-none" }}
      />
    </figure>
  );
}
