<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/flow/index.mdx. Don't edit it here: run `pnpm skill`. -->

# Flow diagrams

The @nuvui/flow package. Boxes, circles and other shapes joined by arrows, drawn as SVG, in a view that pans and zooms, and edited with a pointer or the keyboard.

Flow diagrams are a package of their own, `@nuvui/flow`. They need no library the core doesn't have, but most apps have no diagrams, and an app without them shouldn't carry one.

| Component | What it is |
| --- | --- |
| [Flow](flow.md) | A diagram of shapes joined by arrows, in a frame that pans and zooms. With `editable`, its nodes are dragged, joined and removed. |

```tsx
import { Flow, type FlowEdge, type FlowNode } from "@nuvui/flow";

const nodes: FlowNode[] = [
  {
    id: "placed",
    label: "Order placed",
    shape: "pill",
    position: { x: 0, y: 0 },
    intent: "primary",
  },
  {
    id: "stock",
    label: "In stock?",
    shape: "diamond",
    position: { x: 8, y: 110 },
  },
  {
    id: "ship",
    label: "Pack and ship",
    position: { x: 260, y: 126 },
  },
  {
    id: "reorder",
    label: "Reorder from the supplier",
    shape: "box",
    position: { x: 0, y: 270 },
    intent: "warning",
  },
  {
    id: "delivered",
    label: "Delivered",
    shape: "pill",
    position: { x: 260, y: 270 },
    intent: "success",
  },
];

const edges: FlowEdge[] = [
  { id: "placed-stock", from: "placed", to: "stock" },
  { id: "stock-ship", from: "stock", to: "ship", label: "yes" },
  { id: "stock-reorder", from: "stock", to: "reorder", label: "no" },
  { id: "reorder-ship", from: "reorder", to: "ship", dashed: true },
  { id: "ship-delivered", from: "ship", to: "delivered" },
];

// Flow is a client component, and this one only hands it data, so it can
// be a server component.
export default function Example() {
  return <Flow aria-label="How an order goes" nodes={nodes} edges={edges} />;
}
```

## Install

```sh
pnpm add @nuvui/flow @nuvui/react
```

`@nuvui/react` is a peer dependency: the diagram is drawn with the core's tokens. Nothing else is installed with it. The panning, the zooming, the dragging and the lines are written in the package.

## Load the styles

Import the package's stylesheet once, after the core's:

```tsx title="app/layout.tsx"
import "@nuvui/react/styles.css";
import "@nuvui/flow/styles.css";
```

Both files open with the same line naming the cascade layers, so the order you import them in doesn't decide which rule wins. The diagram's styles are also on their own, at `@nuvui/flow/css/flow.css`.

## What it keeps and what you keep

The diagram is data: a list of nodes, each with a place and a label, and a list of edges, each from one node to another. You can keep both and hand them in, or hand in the first ones and let the diagram keep them.

```ts
const nodes = [
  { id: "placed", label: "Order placed", shape: "pill", position: { x: 0, y: 0 } },
  { id: "stock", label: "In stock?", shape: "diamond", position: { x: 8, y: 110 } },
];
const edges = [{ id: "placed-stock", from: "placed", to: "stock" }];
```

When a node is moved, joined or removed in the diagram, you're told once, with the lists as they are now and what changed. A drag is told when it ends, not on every frame.

## Large diagrams

Only what's in view is drawn, and a node that moves draws itself and its lines again, and nothing else. From far out, or with too many nodes in view to draw one by one, the diagram is a few paths, one for each color. So the number of elements on the page stays about the same whatever the size of the diagram.

```tsx
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
```

## What it leaves out

- **Laying a diagram out by itself.** Every node has a position from you. A library such as dagre or ELK can work positions out, and you hand them in.
- **Anything inside a node but its words.** A node is a shape with a label, drawn in SVG. A button or a field in a node isn't possible.
- **Groups,** a box around some nodes that moves them together.
- **A minimap,** the whole diagram small in a corner.
- **Undo.** The lists are yours, and so is keeping their history.
