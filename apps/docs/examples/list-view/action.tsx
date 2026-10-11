"use client";

import { Button, ListView, ListViewItem } from "@nuvui/react";
import { useState } from "react";

const reports = [
  { id: "q3", name: "Q3 revenue" },
  { id: "churn", name: "Churn by plan" },
  { id: "seats", name: "Seats in use" },
];

export default function Example() {
  const [said, setSaid] = useState("Nothing opened yet.");
  const name = (id: string) =>
    reports.find((report) => report.id === id)?.name ?? id;

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 420,
      }}
    >
      <ListView
        aria-label="Reports"
        onAction={(id) => setSaid(`Opened ${name(id)}.`)}
      >
        {reports.map((report) => (
          <ListViewItem key={report.id} value={report.id}>
            <span style={{ flex: 1 }}>{report.name}</span>
            <Button
              size="sm"
              intent="ghost"
              aria-label={`Export ${report.name}`}
              onClick={() => setSaid(`Exported ${report.name}.`)}
            >
              Export
            </Button>
          </ListViewItem>
        ))}
      </ListView>
      <p role="status" style={{ margin: 0, fontSize: 14 }}>
        {said}
      </p>
    </div>
  );
}
