"use client";

import {
  Badge,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@nuvui/react";
import { useState } from "react";

const labels = [
  "Billing",
  "Bug",
  "Documentation",
  "Feature request",
  "Performance",
  "Security",
];

export default function Example() {
  const [picked, setPicked] = useState(["Bug", "Security"]);

  return (
    <div style={{ display: "grid", gap: 8, maxWidth: 280 }}>
      <label htmlFor="labels">Labels</label>
      <Combobox multiple value={picked} onValueChange={setPicked}>
        <ComboboxTrigger id="labels">
          <ComboboxValue placeholder="Add labels">
            {picked.length === 1 ? picked[0] : `${picked.length} labels`}
          </ComboboxValue>
        </ComboboxTrigger>
        <ComboboxContent
          aria-label="Labels"
          label="Search labels"
          searchPlaceholder="Search"
        >
          <ComboboxEmpty>No label found.</ComboboxEmpty>
          {labels.map((label) => (
            <ComboboxItem key={label} value={label}>
              {label}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {picked.map((label) => (
          <Badge key={label}>{label}</Badge>
        ))}
      </div>
    </div>
  );
}
