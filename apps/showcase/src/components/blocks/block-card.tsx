import { readFile } from "node:fs/promises";
import path from "node:path";
import { type BlockManifest, viewPath } from "@/lib/blocks";
import { highlight } from "@/lib/highlight";
import { BlockPreview } from "./block-preview";

const blocksDir = path.join(process.cwd(), "src", "blocks");

const langOf = (file: string) =>
  file.endsWith(".scss") ? "scss" : file.endsWith(".ts") ? "ts" : "tsx";

interface BlockCardProps {
  block: BlockManifest;
  /** The heading's level: 2 on a category's page, 3 under a section. */
  level?: 2 | 3;
}

// A block with its preview and its files. The files are read here when the
// site is built, and they're the ones the preview's page imports, so the
// code on offer is the code that's running.
export async function BlockCard({ block, level = 2 }: BlockCardProps) {
  const files = await Promise.all(
    block.files.map(async (name) => {
      const source = await readFile(
        path.join(blocksDir, block.name, name),
        "utf8",
      );
      const code = source.trim();
      return { name, code, html: await highlight(code, langOf(name)) };
    }),
  );

  return (
    <BlockPreview
      name={block.name}
      title={block.title}
      description={block.description}
      view={viewPath(block)}
      height={block.height}
      install={block.install}
      files={files}
      level={level}
    />
  );
}
