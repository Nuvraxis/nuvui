"use client";

import { AnimatedNumber, Button } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [items, setItems] = useState(2);

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Button onClick={() => setItems((now) => now + 1)}>Add to cart</Button>
      {/* Read out once, when the number has changed. */}
      <span aria-live="polite">
        <AnimatedNumber value={items} /> items in your cart
      </span>
    </div>
  );
}
