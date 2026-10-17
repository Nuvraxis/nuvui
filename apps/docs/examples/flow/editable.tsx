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
