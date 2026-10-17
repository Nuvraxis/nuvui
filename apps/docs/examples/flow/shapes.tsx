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
