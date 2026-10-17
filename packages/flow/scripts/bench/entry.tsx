import { createRef } from "react";
import { createRoot } from "react-dom/client";
import { Flow, type FlowEdge, type FlowHandle, type FlowNode } from "../../src";

// A grid of nodes, each joined to the one after it and the one under it,
// with every fifth one in a color.
function grid(count: number) {
  const columns = Math.ceil(Math.sqrt(count));
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const intents = [
    "neutral",
    "primary",
    "success",
    "warning",
    "danger",
  ] as const;
  for (let i = 0; i < count; i++) {
    nodes.push({
      id: `n${i}`,
      label: `Step ${i}`,
      position: { x: (i % columns) * 220, y: Math.floor(i / columns) * 120 },
      intent: intents[i % 5],
    });
    if (i % columns)
      edges.push({ id: `h${i}`, from: `n${i - 1}`, to: `n${i}` });
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

// Called by main.ts. A file in this package that only runs code when it's
// imported is dropped by the bundler, since the package says only its CSS
// has side effects.
export function start() {
  const count = Number(
    new URLSearchParams(location.search).get("nodes") ?? 1000,
  );
  const { nodes, edges } = grid(count);
  const handle = createRef<FlowHandle>();
  const started = performance.now();

  (window as unknown as { bench: unknown }).bench = {
    handle,
    started,
    count,
  };

  createRoot(document.getElementById("root") as HTMLElement).render(
    <Flow
      aria-label="Benchmark"
      defaultNodes={nodes}
      defaultEdges={edges}
      handleRef={handle}
      editable
      style={{ ["--nuv-flow-height" as string]: "600px" }}
    />,
  );

  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      (window as unknown as { drawn: number }).drawn =
        performance.now() - started;
    }),
  );
}
