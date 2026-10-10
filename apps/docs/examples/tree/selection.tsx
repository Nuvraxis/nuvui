"use client";

import { Tree, TreeItem } from "@nuvui/react";
import { useState } from "react";

const names: Record<string, string> = {
  company: "Acme",
  engineering: "Engineering",
  platform: "Platform",
  apps: "Apps",
  design: "Design",
  sales: "Sales",
};

export default function Example() {
  const [value, setValue] = useState(["platform"]);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <Tree
        aria-label="Teams"
        selectionMode="single"
        value={value}
        onValueChange={setValue}
        defaultExpanded={["company", "engineering"]}
      >
        <TreeItem value="company" label="Acme">
          <TreeItem value="engineering" label="Engineering">
            <TreeItem value="platform" label="Platform" />
            <TreeItem value="apps" label="Apps" />
          </TreeItem>
          <TreeItem value="design" label="Design" />
          <TreeItem value="sales" label="Sales" />
        </TreeItem>
      </Tree>
      <p style={{ margin: 0, fontSize: 14 }}>
        Showing: {value[0] ? names[value[0]] : "nothing"}
      </p>
    </div>
  );
}
