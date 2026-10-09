import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { FrameTheme } from "@/components/blocks/frame-theme";
import { blocks } from "@/lib/blocks";

// Only the blocks listed are pages. Anything else is the 404 page.
export const dynamicParams = false;

export function generateStaticParams() {
  return blocks.map((block) => ({ name: block.name }));
}

const find = (name: string) => blocks.find((entry) => entry.name === name);

export async function generateMetadata({
  params,
}: PageProps<"/blocks/view/[name]">): Promise<Metadata> {
  const block = find((await params).name);
  if (!block) return {};

  return {
    title: `${block.title}, a block`,
    description: block.description,
    // The page a search should find is the category's, which has the code.
    robots: { index: false },
  };
}

// A block alone on a page, with nothing of the site around it. This is what
// a preview's frame shows, so the block's breakpoints follow the width of
// the frame, as they would follow the screen in an app.
export default async function ViewPage({
  params,
}: PageProps<"/blocks/view/[name]">) {
  const block = find((await params).name);
  if (!block) notFound();

  const module = (await import(`@/blocks/${block.name}/${block.name}.tsx`)) as {
    default: ComponentType;
  };
  const Block = module.default;

  return (
    <>
      <FrameTheme />
      <div className="site-frame">
        <Block />
      </div>
    </>
  );
}
