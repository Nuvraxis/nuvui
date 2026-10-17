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
