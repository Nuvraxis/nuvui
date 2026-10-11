"use client";

import { ListView, ListViewItem } from "@nuvui/react";
import { useState } from "react";

const plans = [
  { id: "starter", name: "Starter", price: "Free" },
  { id: "team", name: "Team", price: "$12 a seat" },
  { id: "business", name: "Business", price: "$24 a seat" },
];

export default function Example() {
  const [value, setValue] = useState(["team"]);
  const plan = plans.find((other) => other.id === value[0]);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 360,
      }}
    >
      <ListView
        aria-label="Plans"
        selectionMode="single"
        value={value}
        onValueChange={setValue}
      >
        {plans.map((item) => (
          <ListViewItem key={item.id} value={item.id}>
            <span style={{ flex: 1 }}>{item.name}</span>
            <span>{item.price}</span>
          </ListViewItem>
        ))}
      </ListView>
      <p style={{ margin: 0, fontSize: 14 }}>
        Showing: {plan ? plan.name : "nothing"}
      </p>
    </div>
  );
}
