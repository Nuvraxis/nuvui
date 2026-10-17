"use client";

import {
  Flow,
  type FlowEdge,
  type FlowNode,
  type FlowSelection,
  type FlowShape,
} from "@nuvui/flow";
import { Button, Input, Label } from "@nuvui/react";
import { useId, useRef, useState } from "react";
import "./workflow-builder.scss";

const kinds: {
  shape: FlowShape;
  name: string;
  /** The name with its article, to start a sentence. */
  a: string;
  label: string;
  intent: FlowNode["intent"];
}[] = [
  {
    shape: "pill",
    name: "trigger",
    a: "A trigger",
    label: "When this happens",
    intent: "primary",
  },
  {
    shape: "diamond",
    name: "condition",
    a: "A condition",
    label: "Is it true?",
    intent: "warning",
  },
  {
    shape: "rounded",
    name: "action",
    a: "An action",
    label: "Do this",
    intent: "neutral",
  },
];

// An automation to start from. Everything here is made up.
const start: FlowNode[] = [
  {
    id: "signup",
    label: "A customer signs up",
    shape: "pill",
    position: { x: 0, y: 0 },
    intent: "primary",
  },
  {
    id: "business",
    label: "Business plan?",
    shape: "diamond",
    position: { x: 8, y: 100 },
    intent: "warning",
  },
  {
    id: "call",
    label: "Book an onboarding call",
    position: { x: 260, y: 116 },
  },
  {
    id: "email",
    label: "Send the welcome email",
    position: { x: 0, y: 260 },
  },
];

const links: FlowEdge[] = [
  { id: "signup->business", from: "signup", to: "business" },
  { id: "business->call", from: "business", to: "call", label: "yes" },
  { id: "business->email", from: "business", to: "email", label: "no" },
  { id: "call->email", from: "call", to: "email" },
];

const none: FlowSelection = { nodes: [], edges: [] };

export default function WorkflowBuilder() {
  const [nodes, setNodes] = useState(start);
  const [edges, setEdges] = useState(links);
  const [selection, setSelection] = useState<FlowSelection>(none);
  const [said, setSaid] = useState("");
  const made = useRef(0);
  const nameId = useId();

  const chosen =
    selection.nodes.length === 1
      ? nodes.find((node) => node.id === selection.nodes[0])
      : undefined;

  // A new step goes under the one that's selected, joined to it, or at the
  // bottom when none is.
  const add = (kind: (typeof kinds)[number]) => {
    made.current += 1;
    const id = `${kind.name}-${made.current}`;
    const bottom = Math.max(...nodes.map((node) => node.position.y), 0);
    const position = chosen
      ? { x: chosen.position.x, y: chosen.position.y + 140 }
      : { x: 0, y: bottom + 140 };
    setNodes([
      ...nodes,
      {
        id,
        label: kind.label,
        shape: kind.shape,
        intent: kind.intent,
        position,
      },
    ]);
    if (chosen) {
      setEdges([
        ...edges,
        { id: `${chosen.id}->${id}`, from: chosen.id, to: id },
      ]);
    }
    setSelection({ nodes: [id], edges: [] });
    setSaid(
      chosen
        ? `${kind.a} was added after ${chosen.label}.`
        : `${kind.a} was added.`,
    );
  };

  const rename = (label: string) => {
    if (!chosen) return;
    setNodes(
      nodes.map((node) => (node.id === chosen.id ? { ...node, label } : node)),
    );
  };

  const remove = () => {
    if (!chosen) return;
    setNodes(nodes.filter((node) => node.id !== chosen.id));
    setEdges(
      edges.filter((edge) => edge.from !== chosen.id && edge.to !== chosen.id),
    );
    setSelection(none);
    setSaid(`${chosen.label} was removed.`);
  };

  return (
    <div className="workflow-builder">
      <header className="workflow-builder__head">
        <h1 className="workflow-builder__title">New customer automation</h1>
        <p className="workflow-builder__text">
          Drag steps to arrange them, and drag from a step&apos;s edge to
          another to join them. With the keyboard, Shift and an arrow move a
          step, and L joins two.
        </p>
        <p className="workflow-builder__said" aria-live="polite">
          {said}
        </p>
      </header>
      <div className="workflow-builder__tools">
        {kinds.map((kind) => (
          <Button
            key={kind.name}
            intent="secondary"
            size="sm"
            onClick={() => add(kind)}
          >
            {`Add ${kind.a.toLowerCase()}`}
          </Button>
        ))}
      </div>
      <div className="workflow-builder__body">
        <Flow
          aria-label="New customer automation"
          className="workflow-builder__diagram"
          editable
          snap={20}
          nodes={nodes}
          edges={edges}
          selection={selection}
          onSelectionChange={setSelection}
          onNodesChange={(next, change) => {
            setNodes(next);
            if (change.type === "remove") {
              setSaid(
                `${change.ids.length} ${change.ids.length === 1 ? "step was" : "steps were"} removed.`,
              );
            }
          }}
          onEdgesChange={(next) => setEdges(next)}
        />
        <section className="workflow-builder__panel" aria-label="Selected step">
          {chosen ? (
            <>
              <div className="workflow-builder__field">
                <Label htmlFor={nameId}>Step name</Label>
                <Input
                  id={nameId}
                  value={chosen.label}
                  onChange={(event) => rename(event.target.value)}
                />
              </div>
              <Button intent="danger" size="sm" onClick={remove}>
                Remove step
              </Button>
            </>
          ) : (
            <p className="workflow-builder__empty">
              Select one step to rename or remove it. A new step is joined to
              the one that&apos;s selected.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
