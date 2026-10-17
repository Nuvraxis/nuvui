<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/flow/flow.mdx. Don't edit it here: run `pnpm skill`. -->

# Flow

A diagram of shapes joined by arrows, drawn as SVG, in a frame that pans and zooms. Nodes are dragged, joined and removed with a pointer or the keyboard, and only what's in view is drawn.

Use a flow diagram for something that goes from step to step: how an order moves, who approves a request, what a service calls. A diagram shows the shape of the whole. If the steps only go one way, a [stepper](../components/stepper.md) or a list says the same more plainly.

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

## Import

```tsx
import { Flow } from "@nuvui/flow";
```

The styles come from `@nuvui/flow/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Flow diagrams](index.md) covers that.

```tsx
<Flow aria-label="How an order goes" nodes={nodes} edges={edges} />
```

## Nodes

A node has an `id`, a `label` and a `position`: its top left corner, in the diagram's own units. The diagram is fitted into its frame, so the units are whatever you like.

`shape` is one of five, each with a meaning a screen reader hears after the label:

| Shape | Read as | Default size |
| --- | --- | --- |
| `box` | step | 160 by 56 |
| `rounded`, the default | step | 160 by 56 |
| `circle` | event | 88 by 88 |
| `diamond` | decision | 144 by 88 |
| `pill` | start or end | 160 by 48 |

`size` changes one node's size. `intent` draws its outline in a color: `neutral`, `primary`, `success`, `warning` or `danger`. `description` is read after its name and shown in the list.

```tsx
import { Flow, type FlowNode } from "@nuvui/flow";

const nodes: FlowNode[] = [
  { id: "box", label: "box", shape: "box", position: { x: 0, y: 0 } },
  {
    id: "rounded",
    label: "rounded",
    shape: "rounded",
    position: { x: 200, y: 0 },
    intent: "primary",
  },
  {
    id: "circle",
    label: "circle",
    shape: "circle",
    position: { x: 400, y: -16 },
    intent: "success",
  },
  {
    id: "diamond",
    label: "diamond",
    shape: "diamond",
    position: { x: 528, y: -16 },
    intent: "warning",
  },
  {
    id: "pill",
    label: "pill",
    shape: "pill",
    position: { x: 712, y: 4 },
    intent: "danger",
  },
];

export default function Example() {
  return (
    <Flow
      aria-label="The five shapes"
      nodes={nodes}
      background="none"
      controls={false}
      className="[--nuv-flow-height:12rem]"
    />
  );
}
```

The label wraps inside the shape, and after as many lines as the shape has room for it ends with an ellipsis. The whole label is still its name. A circle's and a diamond's words sit in the box that fits inside them, so they're narrower than the shape.

## Edges

An edge goes `from` one node `to` another, or to the same node, which draws a loop. `path` says how the line goes:

- `curved`, the default, and `step`, at right angles, join the sides of the two nodes that face each other.
- `straight` runs from one outline to the other, toward the middles.

`edgePath` on the diagram changes the default for every edge that doesn't say.

`arrow` puts an arrowhead at the `end`, the default, the `start`, `both` or `none`. `label` writes words on the line, such as "yes" after a decision. `dashed` draws it dashed, and `animated` draws it dashed and moving toward its end, which stops when less motion is asked for. `intent` colors it as a node's.

```tsx
import { Flow, type FlowEdge, type FlowNode } from "@nuvui/flow";

const box = (id: string, x: number, y: number): FlowNode => ({
  id,
  label: id,
  shape: "box",
  position: { x, y },
  size: { width: 120, height: 48 },
});

const nodes: FlowNode[] = [
  box("Request", 0, 0),
  box("Straight", 300, 0),
  box("Curved", 300, 110),
  box("Step", 300, 220),
  box("Both ways", 0, 220),
];

const edges: FlowEdge[] = [
  { id: "straight", from: "Request", to: "Straight", path: "straight" },
  {
    id: "curved",
    from: "Request",
    to: "Curved",
    path: "curved",
    label: "dashed",
    dashed: true,
  },
  {
    id: "step",
    from: "Request",
    to: "Step",
    path: "step",
    label: "running",
    animated: true,
    intent: "primary",
  },
  {
    id: "both",
    from: "Step",
    to: "Both ways",
    arrow: "both",
    intent: "danger",
  },
];

export default function Example() {
  return <Flow aria-label="Kinds of edges" nodes={nodes} edges={edges} />;
}
```

## Editing

With `editable`, the diagram can be changed:

- **Moving.** Drag a node, or several selected ones. With the keyboard, hold Shift and press an arrow key. `snap` puts moved nodes on a grid of that step, and the arrow keys move by it, or by 10 without one.
- **Joining.** Drag from one of the handles on a node's sides to another node. Handles show on the node under the pointer and on a node that's selected alone. With the keyboard, press L on one node, move to another and press L again.
- **Removing.** Select nodes or edges and press Delete. A node takes its edges with it.

A node with `locked` can be selected but not moved, joined or removed.

```tsx
"use client";

import { Flow, type FlowEdge, type FlowNode } from "@nuvui/flow";
import { Button } from "@nuvui/react";
import { useState } from "react";

const start: FlowNode[] = [
  {
    id: "lead",
    label: "New lead",
    shape: "pill",
    position: { x: 0, y: 40 },
    intent: "primary",
  },
  { id: "qualify", label: "Qualify", position: { x: 220, y: 36 } },
  {
    id: "won",
    label: "Won",
    shape: "pill",
    position: { x: 440, y: 40 },
    intent: "success",
  },
];

const links: FlowEdge[] = [
  { id: "lead-qualify", from: "lead", to: "qualify" },
  { id: "qualify-won", from: "qualify", to: "won" },
];

export default function Example() {
  const [nodes, setNodes] = useState(start);
  const [edges, setEdges] = useState(links);
  const [last, setLast] = useState("Nothing yet.");

  const add = () => {
    const count = nodes.length + 1;
    setNodes([
      ...nodes,
      {
        id: `step-${count}`,
        label: `Step ${count}`,
        position: { x: 220, y: 140 + (count - 3) * 80 },
      },
    ]);
  };

  return (
    <div className="flex flex-col gap-3">
      <Flow
        aria-label="Sales steps"
        editable
        snap={20}
        nodes={nodes}
        edges={edges}
        onNodesChange={(next, change) => {
          setNodes(next);
          setLast(`Nodes: ${change.type} ${change.ids.join(", ")}`);
        }}
        onEdgesChange={(next, change) => {
          setEdges(next);
          setLast(`Edges: ${change.type} ${change.ids.join(", ")}`);
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button intent="secondary" onClick={add}>
          Add a step
        </Button>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {last}
        </p>
      </div>
    </div>
  );
}
```

### Who keeps the diagram

Pass `nodes` and `edges`, and the diagram draws them and tells you of changes. Pass `defaultNodes` and `defaultEdges` instead, and it keeps them itself and still tells you.

`onNodesChange` is called with the nodes as they are after a change, and the change: `{ type: "move", ids }` or `{ type: "remove", ids }`. A drag is reported once, when it ends, and keys once they rest, so a diagram with thousands of nodes isn't copied on every frame. `onNodeDrag` is called on every frame of a drag for an app that wants that. The nodes that didn't change are the same objects as before.

`onEdgesChange` is the same for edges, with `{ type: "add", ids }` or `{ type: "remove", ids }`.

When you keep `nodes`, a move you don't take is undone: the node goes back to where your nodes say. That's how a step is kept in a lane, or saving that fails is put right.

### Which links may be made

By default any two different nodes may be joined, once each way. `canConnect` decides instead: it's called with the two ids, and a link it refuses isn't made. `createEdge` makes the new edge, which by default is `{ id: "from->to", from, to }`.

## Selecting

A click selects a node or an edge. Shift and a click adds one or takes it away. Shift and a drag on empty space selects what the box touches, and a click on empty space clears the selection. With the keyboard, Space selects, Ctrl+A selects every node, and Escape clears.

`selection`, with `onSelectionChange`, keeps the selection yourself. It's `{ nodes, edges }`, by id, in the order of your lists.

`onNodeOpen` is called on a double click on a node, or on Enter, for something such as opening a panel with its details.

## The view

The diagram is fitted into its frame when it first shows, and never zoomed in past its own size for that. `defaultViewport` starts it somewhere else instead, and `onViewportChange` is called when the view stops moving.

Drag empty space to pan. Pinch on a touch screen. The wheel zooms while the diagram has focus, or with Ctrl held, which is what a pinch on a trackpad sends. Otherwise it scrolls the page past the diagram, as it would past a picture. The buttons in the corner zoom out, zoom in and fit, and so do minus, plus and 0. `minZoom` and `maxZoom` are the limits, 0.05 and 2.5 by default. `controls={false}` leaves the buttons out.

`handleRef` gives you the same from your own code:

```tsx
const flow = useRef<FlowHandle>(null);

<Flow aria-label="Services" nodes={nodes} edges={edges} handleRef={flow} />;

flow.current?.center("billing");
```

| Method | What it does |
| --- | --- |
| `fit()` | Shows the whole diagram. |
| `zoomIn()`, `zoomOut()` | Zooms around the middle of the frame. |
| `center(id)` | Moves the view so a node is in the middle. |
| `getViewport()` | Where the view is now: `{ x, y, zoom }`. |

## Large diagrams

The diagram stays quick with thousands of nodes because the work is kept to what can be seen:

- Only the nodes and edges in view, and a margin around it, are on the page. They're found through an index of where everything is, not by looking at every node.
- From far out, where words can't be read, nodes are shapes with no words and edges have no arrowheads. Further out, or with too many nodes in view to draw one by one, the diagram is a few paths, one for each color.
- Panning and zooming change one attribute, once a frame, and don't render React. A node that moves renders itself and its edges and nothing else.
- Nothing is measured: every node's size comes from its shape or from you.

The text version, the list, is built when it's opened, two hundred steps at a time.

## Server rendering and a strict policy

Every position is an SVG attribute, and nothing is set with a `style` attribute. A server sends the diagram fitted by the SVG's `viewBox`, which needs no size, and a [Content Security Policy](../content-security-policy.md) without `style-src-attr 'unsafe-inline'` changes nothing.

Up to `serverLimit` nodes, 300 by default, the server sends the whole diagram. A larger one is drawn by the browser once it knows the frame's size: the server sends the frame, the controls and the list's button.

Flow starts with `"use client"`. A server component can render it and hand it the lists.

## Flow props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `aria-label` (required) | `string` |  | The diagram's name, for a screen reader. Required. |
| `nodes` | `FlowNode[]` |  | The nodes, when the app keeps them. |
| `defaultNodes` | `FlowNode[]` |  | The nodes to start with, when the diagram keeps them itself. |
| `onNodesChange` | `((nodes: FlowNode[], change: FlowNodesChange) => void)` |  | Called with the nodes after a change made in the diagram, and what the change was. A drag is reported once, when it ends. |
| `edges` | `FlowEdge[]` |  |  |
| `defaultEdges` | `FlowEdge[]` |  |  |
| `onEdgesChange` | `((edges: FlowEdge[], change: FlowEdgesChange) => void)` |  |  |
| `selection` | `FlowSelection` |  |  |
| `defaultSelection` | `FlowSelection` |  |  |
| `onSelectionChange` | `((selection: FlowSelection) => void)` |  |  |
| `editable` | `boolean` | `false` | Nodes can be dragged, joined and removed, with a pointer or the keyboard. |
| `edgePath` | `"curved" \| "step" \| "straight"` | `"curved"` | How an edge's line goes when the edge doesn't say. |
| `background` | `"dots" \| "lines" \| "none"` | `"dots"` |  |
| `snap` | `number` | `0` | The step of a grid that moved nodes land on, in the diagram's units. 0 for none. The arrow keys move a node by this much, or by 10. |
| `minZoom` | `number` | `0.05` |  |
| `maxZoom` | `number` | `2.5` |  |
| `defaultViewport` | `FlowViewport` |  | Where the view starts. The whole diagram, fitted, when not given. |
| `onViewportChange` | `((viewport: FlowViewport) => void)` |  | Called when the view stops moving. |
| `onNodeOpen` | `((id: string) => void)` |  | Called on a double click of a node, or Enter on one. |
| `onNodeDrag` | `((positions: { id: string; position: Point; }[]) => void)` |  | Called on every frame of a drag, with where the dragged nodes are. |
| `canConnect` | `((from: string, to: string) => boolean)` |  | Whether a link may be made from one node to another. By default any two different nodes that aren't joined that way yet. |
| `createEdge` | `((from: string, to: string) => FlowEdge)` |  | The edge a new link makes. |
| `controls` | `boolean` | `true` | Zoom and fit buttons, and the list's button. |
| `serverLimit` | `number` | `300` | How many nodes a server draws. A larger diagram is drawn by the browser, once it knows the frame's size. |
| `labels` | `FlowLabels` |  | The diagram's own words, for translating. |
| `handleRef` | `Ref<FlowHandle>` |  | The diagram's methods: fit, zoom and center. |

It also takes the attributes of a `div`, and passes `ref` to it.

## FlowNode

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `id` (required) | `string` |  | What edges and changes know it by. Unique in the diagram. |
| `label` (required) | `string` |  | The words in the shape, and its name for a screen reader. |
| `position` (required) | `Point` |  | Its top left corner, in the diagram's own units. |
| `shape` | `"box" \| "circle" \| "diamond" \| "pill" \| "rounded"` | `"rounded"` |  |
| `size` | `Size` |  | Its size, in the diagram's units. Each shape has its own default. |
| `intent` | `"danger" \| "neutral" \| "primary" \| "success" \| "warning"` | `"neutral"` |  |
| `description` | `string` |  | More about it, read after its name and shown in the list. |
| `locked` | `boolean` |  | In an editable diagram, it can't be moved, joined to another or removed. It can still be selected. |

## FlowEdge

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `id` (required) | `string` |  | What changes know it by. Unique among the edges. |
| `from` (required) | `string` |  | The id of the node it starts at. |
| `to` (required) | `string` |  | The id of the node it goes to. |
| `label` | `string` |  | Words on the line, such as "yes" after a decision. |
| `path` | `"curved" \| "step" \| "straight"` |  | How the line goes. The diagram's `edgePath` when it isn't given. |
| `arrow` | `"both" \| "end" \| "none" \| "start"` | `"end"` | Which ends have an arrowhead. |
| `intent` | `"danger" \| "neutral" \| "primary" \| "success" \| "warning"` | `"neutral"` |  |
| `dashed` | `boolean` |  | A dashed line, such as for something that may happen. |
| `animated` | `boolean` |  | A dashed line that moves toward its end, such as for something happening now. It stands still when less motion is asked for. |

## Translation

Everything the diagram says and doesn't draw is in `labels`, in English until you give another. The ones that put names into a sentence are functions.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `roleDescription` | `string` |  | What kind of thing the diagram is, read after its name. |
| `shapes` | `Partial<Record<FlowShape, string>>` |  | What each shape means, read after a node's name. |
| `leadsTo` | `((targets: FlowLinkTarget[]) => string)` |  | Where a node leads, read after its name and shown in the list. |
| `instructions` | `string` |  | How to get around the diagram with the keyboard. |
| `editInstructions` | `string` |  | How to change it with the keyboard, read after `instructions`. |
| `controls` | `string` |  | The name of the group of buttons. |
| `zoomIn` | `string` |  |  |
| `zoomOut` | `string` |  |  |
| `fit` | `string` |  |  |
| `showList` | `string` |  | The button that shows the diagram as a list. |
| `hideList` | `string` |  |  |
| `list` | `string` |  | The name of the list. |
| `showMore` | `((count: number) => string)` |  | The button at the end of a long list. |
| `find` | `((label: string) => string)` |  | A step's button in the list, which finds it in the diagram. |
| `removeLink` | `((from: string, to: string) => string)` |  | A link's button in the list of an editable diagram. |
| `linking` | `((from: string) => string)` |  | Said when a link is started with the keyboard. |
| `linked` | `((from: string, to: string) => string)` |  | Said when a link is made. |
| `linkCancelled` | `string` |  | Said when a link that was started is let go. |
| `moved` | `((labels: string[]) => string)` |  | Said when nodes are moved. |
| `removed` | `((nodes: number, links: number) => string)` |  | Said when nodes and links are removed. |

```tsx
<Flow
  aria-label="Bestelling"
  labels={{
    roleDescription: "stroomdiagram",
    shapes: { diamond: "keuze", pill: "begin of einde" },
    leadsTo: (targets) =>
      `gaat naar ${targets.map((target) => target.label).join(" en ")}`,
  }}
/>
```

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Into the diagram, on the first node or the one you were on, and on to its buttons. |
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> | To the nearest node that way, brought into view. |
| <kbd>Space</kbd> | Selects the node, or takes it out of the selection. |
| <kbd>Enter</kbd> | Opens the node, with `onNodeOpen`, or selects it. |
| <kbd>Ctrl</kbd>+<kbd>A</kbd> | Selects every node. |
| <kbd>Esc</kbd> | Lets go of a link that was started, or clears the selection. |
| <kbd>+</kbd> <kbd>-</kbd> <kbd>0</kbd> | Zooms in, zooms out, fits the diagram. |

In an editable diagram:

| Key | What it does |
| --- | --- |
| <kbd>Shift</kbd>+arrow | Moves the selected nodes, or the one you're on, by the grid's step or by 10. |
| <kbd>L</kbd> | Starts a link from the node you're on. Move to another and press it again to join them. |
| <kbd>Delete</kbd> | Removes what's selected, or the node you're on. |

The arrows go by where things are on the screen, so they're the same where the page reads right to left. The diagram itself isn't mirrored: its positions are yours.

### What the component handles

- The diagram is a listbox, with its name and "flow diagram" as what it is. Each node is an option, named for its label, what its shape means, its description and where it leads, such as "In stock?, decision, leads to Pack and ship (yes) and Reorder (no)".
- Focus stays on the diagram and the node you're on is its active option, so a node that isn't drawn can't lose the focus. Each option says its place among all the nodes, not only the drawn ones.
- How to use the keys is written out and read with the diagram, with the editing keys when it's editable.
- Moves, links and removals are said in a live region.
- **The list.** The button in the corner shows the same diagram as a list of steps, each with where it leads. A step's name is a button that finds it in the diagram. In an editable diagram each link has a button that removes it. It's what a screen reader, a keyboard and print can all follow.
- The buttons are 44 pixels on a touch screen. In forced colors the outlines are in the text color and what's selected in the highlight color.

### What you need to handle

- Name the diagram with `aria-label`, and give each node a label that tells it from the others.
- Dragging is never the only way: the keyboard does everything a pointer does, and the list removes links. For adding nodes, give a button of your own, as the example above does.
- What a screen reader says for each node hasn't been checked with NVDA and VoiceOver yet. The tests check the names, roles and states a browser passes on.

## On small screens

The frame is as wide as its container and 24rem tall. One finger drags empty space to pan and two pinch to zoom, so the page doesn't scroll while a finger is on the diagram. Keep the frame shorter than the screen, so there's page to scroll by around it.

## CSS variables

Set any of these on a `Flow`, or on anything around it.

```css
.diagram {
  --nuv-flow-height: 32rem;
  --nuv-flow-node-bg: var(--color-muted);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-flow-fg` | `var(--color-foreground)` | Color of the text around the diagram, such as the list. |
| `--nuv-flow-height` | `24rem` | Height of the frame. |
| `--nuv-flow-border` | `var(--color-border)` | Color of the frame's border, and the buttons' group. |
| `--nuv-flow-radius` | `var(--radius-lg)` | Corner radius of the frame. |
| `--nuv-flow-bg` | `var(--color-background)` | Background of the frame, behind edge labels and inside handles. |
| `--nuv-flow-grid` | `var(--color-border-strong)`, `var(--color-border)` | Color of the background's dots or lines. |
| `--nuv-flow-node-bg` | `var(--color-surface)` | Fill of a node. |
| `--nuv-flow-node-border` | `var(--color-border-strong)`, `var(--color-primary)`, `var(--color-success)`, `var(--color-warning)`, `var(--color-danger)` | Outline of a node, for every intent, and of the boxes from far out. Keep it at 3:1 against the frame. |
| `--nuv-flow-selected-bg` | `var(--color-muted)` | Fill of a selected node. |
| `--nuv-flow-selected-border` | `var(--color-ring)` | Outline of a selected node or edge, of handles and of a link being made. |
| `--nuv-flow-node-fg` | `var(--color-surface-foreground)` | Color of a node's words. Keep it at 4.5:1 against its fill. |
| `--nuv-flow-selected-fg` | `var(--color-foreground)` | Color of a selected node's words. |
| `--nuv-flow-edge` | `var(--color-muted-foreground)`, `var(--color-primary)`, `var(--color-success)`, `var(--color-warning)`, `var(--color-danger)`, `var(--color-border-strong)` | Color of every edge and arrowhead, for every intent. Keep it at 3:1 against the frame. |
| `--nuv-flow-edge-fg` | `var(--color-muted-foreground)` | Color of an edge's words. Keep it at 4.5:1 against the frame. |
| `--nuv-flow-controls-bg` | `var(--color-surface)` | Background of the buttons' group. |
| `--nuv-flow-control-fg` | `var(--color-surface-foreground)` | Color of a button's icon. |
| `--nuv-flow-control-hover-bg` | `var(--color-muted)` | Background of a button under the pointer. |
| `--nuv-flow-muted-fg` | `var(--color-muted-foreground)` | Color of the quieter words in the list. Keep it at 4.5:1 against the page. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-flow` | Flow |
| `.nuv-flow__arrow` | An arrowhead. |
| `.nuv-flow__arrow--danger` | A danger edge's arrowhead. |
| `.nuv-flow__arrow--primary` | A primary edge's arrowhead. |
| `.nuv-flow__arrow--selected` | A selected edge's arrowhead. |
| `.nuv-flow__arrow--success` | A success edge's arrowhead. |
| `.nuv-flow__arrow--warning` | A warning edge's arrowhead. |
| `.nuv-flow__background` | The background's grid. |
| `.nuv-flow__canvas` | The listbox around the drawing, which takes focus. |
| `.nuv-flow__control` | One of those buttons. |
| `.nuv-flow__controls` | The group of buttons in the corner. |
| `.nuv-flow__dot` | A dot of the grid. |
| `.nuv-flow__edge` | An edge, with its intent as a modifier. |
| `.nuv-flow__edge--danger` | A danger edge. |
| `.nuv-flow__edge--primary` | A primary edge. |
| `.nuv-flow__edge--success` | A success edge. |
| `.nuv-flow__edge--warning` | A warning edge. |
| `.nuv-flow__edge-label` | The box an edge's words are in. |
| `.nuv-flow__edge-label-text` | An edge's words. |
| `.nuv-flow__focus` | The ring around the node the keyboard is on. |
| `.nuv-flow__frame` | The frame the diagram is drawn in. |
| `.nuv-flow__grid-line` | A line of the grid. |
| `.nuv-flow__handle` | A handle a link is dragged from. |
| `.nuv-flow__hidden` | Text for screen readers only: the instructions and the live region. |
| `.nuv-flow__icon` | A button's icon. |
| `.nuv-flow__label` | The box a node's words are in. |
| `.nuv-flow__label-text` | A node's words. |
| `.nuv-flow__line` | An edge's line. |
| `.nuv-flow__list` | The list's container, hidden until it's shown. |
| `.nuv-flow__more` | The button that shows two hundred more steps. |
| `.nuv-flow__new-link` | The line of a link being made. |
| `.nuv-flow__node` | A node, with its intent as a modifier. |
| `.nuv-flow__node--danger` | A danger node. |
| `.nuv-flow__node--primary` | A primary node. |
| `.nuv-flow__node--success` | A success node. |
| `.nuv-flow__node--warning` | A warning node. |
| `.nuv-flow__overview` | The boxes of one intent, from far out. |
| `.nuv-flow__overview--danger` | The danger ones. |
| `.nuv-flow__overview--primary` | The primary ones. |
| `.nuv-flow__overview--success` | The success ones. |
| `.nuv-flow__overview--warning` | The warning ones. |
| `.nuv-flow__overview-edges` | Every edge, from far out. |
| `.nuv-flow__selection-box` | The box drawn to select with Shift and a drag. |
| `.nuv-flow__shape` | A node's outline. |
| `.nuv-flow__step-description` | Its description. |
| `.nuv-flow__step-kind` | What its shape means. |
| `.nuv-flow__step-links` | Where it leads. |
| `.nuv-flow__step-name` | A step's name, the button that finds it. |
| `.nuv-flow__step-remove` | The button that removes a link. |
| `.nuv-flow__steps` | The list of steps. |
| `.nuv-flow__svg` | The drawing. |

A state is an attribute: `data-editable` on the diagram, `data-detail` on the canvas (0 for everything, 1 for no words, 2 for the overview), `data-selected`, `data-linking` and `data-locked` on a node, `data-shape` on a node, and `data-selected`, `data-dashed` and `data-animated` on an edge.

## Do and don't

**Do**

- Keep the diagram to what one reader can follow, and split one that grows past that.
- Give every node a label that reads well on its own, since that's its name.
- Save changes when `onNodesChange` and `onEdgesChange` are called, once each.

**Don't**

- Don't use a diagram for steps that only ever go one way. A list says it more plainly.
- Don't make color the only difference between nodes. Say it in the label or the description too.
- Don't save on every frame of a drag with `onNodeDrag`.
