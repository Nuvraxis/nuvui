"use client";

import { Tree, TreeItem } from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

const modes = ["none", "single", "multiple"] as const;

export function TreePlayground() {
  const [mode, setMode] = useState<(typeof modes)[number]>("single");
  const [disabled, setDisabled] = useState(false);

  const code = `<Tree aria-label="Project files"${
    mode === "none" ? "" : ` selectionMode="${mode}"`
  } defaultExpanded={["src"]}>
  <TreeItem value="src" label="src">
    <TreeItem value="src/index.ts" label="index.ts" />
    <TreeItem value="src/tree.tsx" label="tree.tsx"${disabled ? " disabled" : ""} />
  </TreeItem>
  <TreeItem value="package.json" label="package.json" />
</Tree>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="selectionMode"
            value={mode}
            options={modes}
            onChange={setMode}
          />
          <CheckboxControl
            label="disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        </>
      }
    >
      <Tree
        // A tree keeps what's selected. Starting again when the mode
        // changes keeps what's shown and the code in step.
        key={mode}
        aria-label="Project files"
        selectionMode={mode}
        defaultExpanded={["src"]}
        style={{ inlineSize: "100%", maxInlineSize: 320 }}
      >
        <TreeItem value="src" label="src">
          <TreeItem value="src/index.ts" label="index.ts" />
          <TreeItem value="src/tree.tsx" label="tree.tsx" disabled={disabled} />
        </TreeItem>
        <TreeItem value="package.json" label="package.json" />
      </Tree>
    </Playground>
  );
}
