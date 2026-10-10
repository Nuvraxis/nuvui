"use client";

import { Button, Tree, TreeItem } from "@nuvui/react";
import { useState } from "react";

const folders = ["guides", "guides/start", "reference"];

export default function Example() {
  const [expanded, setExpanded] = useState(["guides"]);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          size="sm"
          intent="secondary"
          onClick={() => setExpanded(folders)}
        >
          Open all
        </Button>
        <Button size="sm" intent="secondary" onClick={() => setExpanded([])}>
          Close all
        </Button>
      </div>
      <Tree
        aria-label="Documentation"
        expanded={expanded}
        onExpandedChange={setExpanded}
      >
        <TreeItem value="guides" label="Guides">
          <TreeItem value="guides/start" label="Getting started">
            <TreeItem value="guides/start/install" label="Install" />
            <TreeItem value="guides/start/theme" label="Choose a theme" />
          </TreeItem>
          <TreeItem value="guides/forms" label="Forms" />
        </TreeItem>
        <TreeItem value="reference" label="Reference">
          <TreeItem value="reference/tokens" label="Tokens" />
        </TreeItem>
      </Tree>
    </div>
  );
}
