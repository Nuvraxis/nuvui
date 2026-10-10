import { Tree, TreeItem } from "@nuvui/react";

export default function Example() {
  return (
    <Tree
      aria-label="Project files"
      defaultExpanded={["src", "src/components"]}
      style={{ inlineSize: "100%", maxInlineSize: 320 }}
    >
      <TreeItem value="src" label="src">
        <TreeItem value="src/components" label="components">
          <TreeItem value="src/components/button.tsx" label="button.tsx" />
          <TreeItem value="src/components/dialog.tsx" label="dialog.tsx" />
          <TreeItem value="src/components/tree.tsx" label="tree.tsx" />
        </TreeItem>
        <TreeItem value="src/styles" label="styles">
          <TreeItem value="src/styles/tokens.scss" label="tokens.scss" />
          <TreeItem value="src/styles/index.scss" label="index.scss" />
        </TreeItem>
        <TreeItem value="src/index.ts" label="index.ts" />
      </TreeItem>
      <TreeItem value="test" label="test">
        <TreeItem value="test/setup.ts" label="setup.ts" />
      </TreeItem>
      <TreeItem value="package.json" label="package.json" />
      <TreeItem value="README.md" label="README.md" />
    </Tree>
  );
}
