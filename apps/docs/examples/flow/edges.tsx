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
