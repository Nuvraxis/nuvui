import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { NewBadge } from "@/components/new-badge";
import { baseOptions } from "@/lib/layout.shared";
import { isNew } from "@/lib/new-pages";
import { source } from "@/lib/source";

type Tree = ReturnType<typeof source.getPageTree>;
type Node = Tree["children"][number];

// The menu, with "New" beside the pages that are.
function marked(tree: Tree): Tree {
  const fresh = new Set(
    source
      .getPages()
      .filter((page) => isNew(page.data.added))
      .map((page) => page.url),
  );
  const mark = (node: Node): Node => {
    if (node.type === "folder") {
      return { ...node, children: node.children.map(mark) };
    }
    if (node.type !== "page" || !fresh.has(node.url)) return node;
    return {
      ...node,
      name: (
        <>
          {node.name}
          <NewBadge />
        </>
      ),
    };
  };
  return { ...tree, children: tree.children.map(mark) };
}

export default function Layout({ children }: LayoutProps<"/[[...slug]]">) {
  return (
    <DocsLayout tree={marked(source.getPageTree())} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
