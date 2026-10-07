import { readFile } from "node:fs/promises";
import path from "node:path";
import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import type { ComponentType } from "react";
import { codeHighlight } from "@/lib/code-themes";

interface PreviewProps {
  /** Path of the example under `examples/`, without the extension. */
  name: string;
  /**
   * A stylesheet the example imports, by file name. It's printed above the
   * example's own source, and both blocks get a title.
   */
  stylesheet?: string;
  /**
   * Give the example the whole width of the frame. For something that
   * fills its container, such as a table.
   */
  wide?: boolean;
}

const examplesDir = path.join(process.cwd(), "examples");

// Renders an example and prints the file it came from. The code on the page
// is the code that's running, because it's the same file.
export async function Preview({ name, stylesheet, wide }: PreviewProps) {
  const [module, code, styles] = await Promise.all([
    import(`@/examples/${name}.tsx`) as Promise<{ default: ComponentType }>,
    readFile(path.join(examplesDir, `${name}.tsx`), "utf8"),
    stylesheet
      ? readFile(path.join(examplesDir, path.dirname(name), stylesheet), "utf8")
      : undefined,
  ]);
  const Example = module.default;

  return (
    // not-prose keeps the article's link and paragraph styles off the
    // components being shown.
    <figure className="not-prose my-6" data-preview={name}>
      <div
        className={
          wide
            ? "min-h-40 rounded-t-xl border border-b-0 p-4 sm:p-6"
            : "flex min-h-40 flex-wrap items-center justify-center gap-3 rounded-t-xl border border-b-0 p-6"
        }
        style={{
          backgroundColor: "var(--color-background)",
          color: "var(--color-foreground)",
        }}
      >
        <Example />
      </div>
      {stylesheet && styles !== undefined && (
        <ServerCodeBlock
          code={styles.trim()}
          lang={path.extname(stylesheet).slice(1)}
          {...codeHighlight}
          codeblock={{
            title: stylesheet,
            className: "my-0 rounded-none border-b-0",
          }}
        />
      )}
      <ServerCodeBlock
        code={code.trim()}
        lang="tsx"
        {...codeHighlight}
        codeblock={{
          title: stylesheet ? `${path.basename(name)}.tsx` : undefined,
          className: "my-0 rounded-t-none",
        }}
      />
    </figure>
  );
}
