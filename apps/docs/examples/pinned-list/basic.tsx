"use client";

import { PinnedList, PinnedListItem } from "@nuvui/react";

const reports: Record<string, { name: string; owner: string }> = {
  revenue: { name: "Revenue by month", owner: "Finance" },
  churn: { name: "Churn by plan", owner: "Customer success" },
  pipeline: { name: "Sales pipeline", owner: "Sales" },
  hiring: { name: "Hiring plan", owner: "People" },
  usage: { name: "Seats in use", owner: "Product" },
};

export default function Example() {
  return (
    <PinnedList
      items={Object.keys(reports)}
      defaultPinned={["pipeline"]}
      style={{ inlineSize: "100%", maxInlineSize: 400 }}
    >
      {(id) => {
        const report = reports[id];
        return (
          <PinnedListItem value={id} label={report?.name ?? id}>
            <div style={{ fontWeight: 500 }}>{report?.name}</div>
            <div style={{ color: "var(--color-muted-foreground)" }}>
              {report?.owner}
            </div>
          </PinnedListItem>
        );
      }}
    </PinnedList>
  );
}
