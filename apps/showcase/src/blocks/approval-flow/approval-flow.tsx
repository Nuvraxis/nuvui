"use client";

import { Flow, type FlowEdge, type FlowNode } from "@nuvui/flow";
import { Badge } from "@nuvui/react";
import { useState } from "react";
import "./approval-flow.scss";

type Status = "done" | "now" | "next" | "skipped";

// Everything here is made up, and stands in for what your server keeps.
const steps: Record<
  string,
  { status: Status; who: string; when?: string; note: string }
> = {
  submitted: {
    status: "done",
    who: "Priya Raman",
    when: "Mon 13 Oct, 09:12",
    note: "Twelve laptops for the new support team, $8,400 in all.",
  },
  manager: {
    status: "done",
    who: "Tom Becker",
    when: "Mon 13 Oct, 14:40",
    note: "Approved. The team starts on the 3rd.",
  },
  amount: {
    status: "done",
    who: "The rule for purchases",
    note: "Under $10,000, so a director doesn't need to sign.",
  },
  director: {
    status: "skipped",
    who: "Director of operations",
    note: "Only for purchases of $10,000 or more.",
  },
  finance: {
    status: "now",
    who: "Finance team",
    note: "Checking the budget code and the supplier's terms.",
  },
  order: {
    status: "next",
    who: "Purchasing",
    note: "The order goes to the supplier once finance agrees.",
  },
};

const statusText: Record<Status, string> = {
  done: "Done",
  now: "Waiting here",
  next: "To come",
  skipped: "Not needed",
};

const nodes: FlowNode[] = [
  {
    id: "submitted",
    label: "Request sent",
    shape: "pill",
    position: { x: 0, y: 0 },
    intent: "success",
    description: "done",
  },
  {
    id: "manager",
    label: "Manager approves",
    position: { x: 0, y: 100 },
    intent: "success",
    description: "done",
  },
  {
    id: "amount",
    label: "$10,000 or more?",
    shape: "diamond",
    position: { x: 8, y: 210 },
    intent: "success",
    description: "done",
  },
  {
    id: "director",
    label: "Director signs",
    position: { x: 260, y: 226 },
    description: "not needed",
  },
  {
    id: "finance",
    label: "Finance checks",
    position: { x: 0, y: 360 },
    intent: "primary",
    description: "waiting here",
  },
  {
    id: "order",
    label: "Order placed",
    shape: "pill",
    position: { x: 0, y: 470 },
    description: "to come",
  },
];

const edges: FlowEdge[] = [
  {
    id: "submitted-manager",
    from: "submitted",
    to: "manager",
    intent: "success",
  },
  { id: "manager-amount", from: "manager", to: "amount", intent: "success" },
  {
    id: "amount-director",
    from: "amount",
    to: "director",
    label: "yes",
    dashed: true,
  },
  {
    id: "amount-finance",
    from: "amount",
    to: "finance",
    label: "no",
    intent: "success",
  },
  { id: "director-finance", from: "director", to: "finance", dashed: true },
  { id: "finance-order", from: "finance", to: "order", animated: true },
];

export default function ApprovalFlow() {
  const [selected, setSelected] = useState("finance");
  const step = steps[selected];
  const node = nodes.find((item) => item.id === selected);

  return (
    <div className="approval-flow">
      <header className="approval-flow__head">
        <h1 className="approval-flow__title">Purchase request PR-1042</h1>
        <p className="approval-flow__text">
          Where the request is on its way to an order. Select a step, with a
          click or the arrow keys and Space, to see who has it.
        </p>
      </header>
      <div className="approval-flow__body">
        <Flow
          aria-label="Approval path of PR-1042"
          className="approval-flow__diagram"
          nodes={nodes}
          edges={edges}
          selection={{ nodes: [selected], edges: [] }}
          onSelectionChange={(next) => {
            // One step always shows: the one just picked, which is the one
            // that isn't shown yet. A click on nothing keeps it.
            const picked =
              next.nodes.find((id) => id !== selected) ?? next.nodes[0];
            if (picked) setSelected(picked);
          }}
        />
        {step && node ? (
          <section
            className="approval-flow__panel"
            aria-labelledby="approval-flow-step"
          >
            <div className="approval-flow__panel-head">
              <h2 id="approval-flow-step" className="approval-flow__step">
                {node.label}
              </h2>
              <Badge
                intent={
                  step.status === "done"
                    ? "success"
                    : step.status === "now"
                      ? "primary"
                      : "neutral"
                }
                variant={step.status === "skipped" ? "outline" : "solid"}
              >
                {statusText[step.status]}
              </Badge>
            </div>
            <dl className="approval-flow__facts">
              <dt>Who</dt>
              <dd>{step.who}</dd>
              <dt>When</dt>
              <dd>{step.when ?? "Not yet"}</dd>
            </dl>
            <p className="approval-flow__note">{step.note}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
