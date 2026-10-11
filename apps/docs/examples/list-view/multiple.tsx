"use client";

import { Button, ListView, ListViewItem } from "@nuvui/react";
import { useState } from "react";

const invoices = [
  { id: "INV-2041", to: "Northwind", locked: false },
  { id: "INV-2042", to: "Contoso", locked: false },
  { id: "INV-2043", to: "Fabrikam", locked: true },
  { id: "INV-2044", to: "Adatum", locked: false },
];

export default function Example() {
  const [value, setValue] = useState(["INV-2041"]);

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
        aria-label="Invoices"
        selectionMode="multiple"
        value={value}
        onValueChange={setValue}
      >
        {invoices.map((invoice) => (
          <ListViewItem
            key={invoice.id}
            value={invoice.id}
            disabled={invoice.locked}
          >
            <span style={{ flex: 1 }}>
              {invoice.id}, {invoice.to}
              {invoice.locked ? " (already sent)" : ""}
            </span>
          </ListViewItem>
        ))}
      </ListView>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <p style={{ margin: 0, fontSize: 14 }}>{value.length} selected</p>
        <Button size="sm" intent="ghost" onClick={() => setValue([])}>
          Clear
        </Button>
      </div>
    </div>
  );
}
