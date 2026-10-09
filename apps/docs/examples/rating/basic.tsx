"use client";

import { Rating } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [stars, setStars] = useState(3);

  return (
    <div style={{ display: "grid", gap: 8, justifyItems: "center" }}>
      <span id="rating-basic-label">How was the delivery?</span>
      <Rating
        aria-labelledby="rating-basic-label"
        value={stars}
        onValueChange={setStars}
      />
      <span aria-live="polite">{stars} of 5</span>
    </div>
  );
}
