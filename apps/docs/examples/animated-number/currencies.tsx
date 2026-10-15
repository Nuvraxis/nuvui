"use client";

import { AnimatedNumber, Button } from "@nuvui/react";
import { useState } from "react";

// One plan's price in four markets, each written the way its own
// customers write money: the sign before the number or after it, a comma
// or a point, and yen with no cents.
const markets = [
  { name: "Germany", currency: "EUR", locale: "de-DE", price: 49 },
  { name: "United Kingdom", currency: "GBP", locale: "en-GB", price: 42 },
  { name: "Japan", currency: "JPY", locale: "ja-JP", price: 7800 },
  { name: "India", currency: "INR", locale: "en-IN", price: 3999 },
];

export default function Example() {
  const [yearly, setYearly] = useState(false);

  return (
    <div style={{ display: "grid", gap: 16, justifyItems: "start" }}>
      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto",
          gap: "0.5rem 2rem",
          margin: 0,
        }}
      >
        {markets.map((market) => (
          <div key={market.name} style={{ display: "contents" }}>
            <dt>{market.name}</dt>
            <dd style={{ margin: 0, textAlign: "end", fontWeight: 600 }}>
              <AnimatedNumber
                value={yearly ? market.price * 10 : market.price}
                currency={market.currency}
                locale={market.locale}
              />
            </dd>
          </div>
        ))}
      </dl>
      <Button
        intent="secondary"
        aria-pressed={yearly}
        onClick={() => setYearly((now) => !now)}
      >
        Show yearly prices
      </Button>
    </div>
  );
}
