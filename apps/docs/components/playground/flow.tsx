"use client";

import { Flow, type FlowEdge, type FlowNode, type FlowPath } from "@nuvui/flow";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

const nodes: FlowNode[] = [
  {
    id: "request",
    label: "Request",
    shape: "pill",
    position: { x: 0, y: 0 },
    intent: "primary",
  },
  {
    id: "approve",
    label: "Over budget?",
    shape: "diamond",
    position: { x: 8, y: 100 },
  },
  { id: "manager", label: "Manager approves", position: { x: 260, y: 116 } },
  {
    id: "done",
    label: "Paid",
    shape: "pill",
    position: { x: 0, y: 260 },
    intent: "success",
  },
];

const edges: FlowEdge[] = [
  { id: "request-approve", from: "request", to: "approve" },
  { id: "approve-manager", from: "approve", to: "manager", label: "yes" },
  { id: "approve-done", from: "approve", to: "done", label: "no" },
  { id: "manager-done", from: "manager", to: "done" },
];

const paths = ["curved", "straight", "step"] as const;
const backgrounds = ["dots", "lines", "none"] as const;
const snaps = ["0", "20"] as const;

export function FlowPlayground() {
  const [editable, setEditable] = useState(true);
  const [edgePath, setEdgePath] = useState<FlowPath>("curved");
  const [background, setBackground] =
    useState<(typeof backgrounds)[number]>("dots");
  const [snap, setSnap] = useState<(typeof snaps)[number]>("0");
  const [controls, setControls] = useState(true);

  const lines = [
    'aria-label="Approval"',
    "defaultNodes={nodes}",
    "defaultEdges={edges}",
    editable && "editable",
    edgePath !== "curved" && `edgePath="${edgePath}"`,
    background !== "dots" && `background="${background}"`,
    snap !== "0" && `snap={${snap}}`,
    !controls && "controls={false}",
  ].filter(Boolean);
  const code = `<Flow\n${lines.map((line) => `  ${line}`).join("\n")}\n/>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <CheckboxControl
            label="editable"
            checked={editable}
            onChange={setEditable}
          />
          <SelectControl
            label="edgePath"
            value={edgePath}
            options={paths}
            onChange={setEdgePath}
          />
          <SelectControl
            label="background"
            value={background}
            options={backgrounds}
            onChange={setBackground}
          />
          <SelectControl
            label="snap"
            value={snap}
            options={snaps}
            onChange={setSnap}
          />
          <CheckboxControl
            label="controls"
            checked={controls}
            onChange={setControls}
          />
        </>
      }
    >
      <div className="w-full">
        <Flow
          aria-label="Approval"
          defaultNodes={nodes}
          defaultEdges={edges}
          editable={editable}
          edgePath={edgePath}
          background={background}
          snap={Number(snap)}
          controls={controls}
        />
      </div>
    </Playground>
  );
}
