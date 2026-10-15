"use client";

import {
  AnimatedNumber,
  Button,
  formatNumber,
  Stat,
  StatDescription,
  StatGroup,
  StatLabel,
  StatValue,
  Trend,
} from "@nuvui/react";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import "./live-figures.scss";

// Made-up readings, which stand in for what your server sends. Each
// refresh shows the next one, and after the last it starts again, so there
// is always somewhere for the figures to move.
const readings = [
  { revenue: 48250, orders: 1284, visitors: 18420, conversion: 0.0697 },
  { revenue: 49910, orders: 1312, visitors: 18975, conversion: 0.0691 },
  { revenue: 51365, orders: 1347, visitors: 19260, conversion: 0.0699 },
  { revenue: 50890, orders: 1339, visitors: 19842, conversion: 0.0675 },
];

type Reading = (typeof readings)[number];

const figures = [
  { key: "revenue", label: "Revenue", options: { currency: "EUR" } },
  { key: "orders", label: "Orders", options: {} },
  { key: "visitors", label: "Visitors", options: {} },
  {
    key: "conversion",
    label: "Conversion",
    options: {
      format: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
  },
] as const satisfies {
  key: keyof Reading;
  label: string;
  options: Parameters<typeof formatNumber>[1];
}[];

export default function LiveFigures() {
  const [refreshes, setRefreshes] = useState(0);
  const index = refreshes % readings.length;
  const now = readings[index];
  const before = readings[(index + readings.length - 1) % readings.length];
  if (!now || !before) return null;

  return (
    <section className="live-figures" aria-labelledby="live-figures-title">
      <header className="live-figures__head">
        <h2 id="live-figures-title" className="live-figures__title">
          Today so far
        </h2>
        <Button
          intent="secondary"
          onClick={() => setRefreshes((count) => count + 1)}
        >
          <RefreshCw aria-hidden="true" size={16} />
          Refresh
        </Button>
      </header>
      <StatGroup className="live-figures__list">
        {figures.map((figure) => (
          <Stat key={figure.key} className="live-figures__card">
            <StatLabel>{figure.label}</StatLabel>
            <StatValue>
              <AnimatedNumber value={now[figure.key]} {...figure.options} />
            </StatValue>
            <StatDescription>
              <Trend
                value={
                  (now[figure.key] - before[figure.key]) / before[figure.key]
                }
              />{" "}
              since the last refresh
            </StatDescription>
          </Stat>
        ))}
      </StatGroup>
      {/* The figures aren't read out each time they move. This says the
          one that matters most, once for each refresh. */}
      <p role="status" className="live-figures__status">
        {refreshes === 0
          ? ""
          : `Refreshed. Revenue is ${formatNumber(now.revenue, { currency: "EUR" })}.`}
      </p>
    </section>
  );
}
