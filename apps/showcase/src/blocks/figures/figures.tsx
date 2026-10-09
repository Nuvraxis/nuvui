"use client";

import {
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartColor,
  chartFill,
} from "@nuvui/charts";
import {
  Stat,
  StatChart,
  StatDescription,
  StatLabel,
  StatValue,
  Trend,
} from "@nuvui/react";
import { Area, AreaChart } from "recharts";
import "./figures.scss";

const months = [
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
];

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const count = new Intl.NumberFormat("en-US");
const percent = (value: number) => `${value}%`;

// Made-up figures. `change` is against the month before, as a ratio, and
// `good` says which way is good news: a refund rate going down is, and is
// drawn as such.
const figures = [
  {
    label: "Revenue",
    format: (value: number) => dollars.format(value),
    change: 0.047,
    good: "up" as const,
    values: [
      42100, 58300, 39800, 44200, 51700, 49300, 55900, 61200, 58800, 64500,
      70100, 73400,
    ],
  },
  {
    label: "Orders",
    format: (value: number) => count.format(value),
    change: 0.061,
    good: "up" as const,
    values: [512, 704, 498, 541, 630, 612, 688, 742, 719, 790, 847, 899],
  },
  {
    label: "New customers",
    format: (value: number) => count.format(value),
    change: -0.023,
    good: "up" as const,
    values: [148, 201, 139, 152, 177, 169, 190, 208, 196, 223, 219, 214],
  },
  {
    label: "Refund rate",
    format: percent,
    // A rate's change is in points, which the trend is told to say.
    change: -0.004,
    said: "0.4 pts",
    good: "down" as const,
    values: [2.9, 3.1, 2.8, 2.6, 2.7, 2.4, 2.5, 2.3, 2.4, 2.1, 2.2, 1.8],
  },
];

export default function Figures() {
  return (
    <section className="figures" aria-labelledby="figures-title">
      <h2 id="figures-title" className="figures__title">
        This month
      </h2>
      <ul className="figures__list">
        {figures.map((figure) => {
          const data = figure.values.map((value, index) => ({
            month: months[index] ?? "",
            value,
          }));
          const latest = figure.values[figure.values.length - 1] ?? 0;

          return (
            <li key={figure.label}>
              <Stat className="figures__card">
                <StatLabel>{figure.label}</StatLabel>
                <StatValue>{figure.format(latest)}</StatValue>
                <StatDescription>
                  {/* The arrow says which way, and the color says whether
                      that's good. Neither is left to do both. */}
                  <Trend value={figure.change} good={figure.good}>
                    {"said" in figure ? figure.said : undefined}
                  </Trend>{" "}
                  against September
                </StatDescription>
                <StatChart>
                  <ChartContainer
                    config={{ value: { label: figure.label } }}
                    aria-label={`${figure.label} by month, November to October`}
                    className="figures__chart"
                    formatValue={(value) => figure.format(Number(value))}
                    table={
                      <ChartTable
                        data={data}
                        category="month"
                        categoryLabel="Month"
                      />
                    }
                  >
                    <AreaChart
                      data={data}
                      margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
                    >
                      <ChartTooltip indicator="line" />
                      <Area
                        dataKey="value"
                        type="monotone"
                        fill={chartFill("value")}
                        fillOpacity={0.2}
                        stroke={chartColor("value")}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </StatChart>
              </Stat>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
