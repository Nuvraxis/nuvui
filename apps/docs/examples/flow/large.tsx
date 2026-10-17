"use client";

import {
  Flow,
  type FlowEdge,
  type FlowIntent,
  type FlowNode,
} from "@nuvui/flow";
import { useMemo } from "react";

const intents: FlowIntent[] = [
  "neutral",
  "primary",
  "success",
  "warning",
  "danger",
];

// Five thousand steps in a grid, each joined to the next in its row and to
// the one under it. Made in the browser, so the page doesn't carry them.
function grid(count: number) {
  const columns = Math.ceil(Math.sqrt(count));
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  for (let i = 0; i < count; i++) {
    nodes.push({
      id: `n${i}`,
      label: `Step ${i + 1}`,
      position: { x: (i % columns) * 220, y: Math.floor(i / columns) * 120 },
      intent: intents[i % intents.length],
    });
    if (i % columns) {
      edges.push({ id: `h${i}`, from: `n${i - 1}`, to: `n${i}` });
    }
    if (i >= columns) {
      edges.push({
        id: `v${i}`,
        from: `n${i - columns}`,
        to: `n${i}`,
        path: "step",
      });
    }
  }
  return { nodes, edges };
}

export default function Example() {
  const { nodes, edges } = useMemo(() => grid(5000), []);
  return (
    <Flow
      aria-label="Five thousand steps"
      defaultNodes={nodes}
      defaultEdges={edges}
      serverLimit={0}
    />
  );
}
