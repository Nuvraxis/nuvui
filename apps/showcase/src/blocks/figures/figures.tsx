"use client";

import {
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartColor,
  chartFill,
} from "@nuvui/charts";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@nuvui/react";
import { TrendingDown, TrendingUp } from "lucide-react";
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

// Made-up figures. `good` says whether the change is the way you'd want
// it: a refund rate going down is good news, and is drawn as such.
const figures = [
  {
    label: "Revenue",
    format: (value: number) => dollars.format(value),
    change: "+4.7%",
    up: true,
    good: true,
    values: [
      42100, 58300, 39800, 44200, 51700, 49300, 55900, 61200, 58800, 64500,
      70100, 73400,
    ],
  },
  {
    label: "Orders",
    format: (value: number) => count.format(value),
    change: "+6.1%",
    up: true,
    good: true,
    values: [512, 704, 498, 541, 630, 612, 688, 742, 719, 790, 847, 899],
  },
  {
    label: "New customers",
    format: (value: number) => count.format(value),
    change: "-2.3%",
    up: false,
    good: false,
    values: [148, 201, 139, 152, 177, 169, 190, 208, 196, 223, 219, 214],
  },
  {
    label: "Refund rate",
    format: percent,
    change: "-0.4 pts",
    up: false,
    good: true,
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
          const Trend = figure.up ? TrendingUp : TrendingDown;

          return (
            <li key={figure.label}>
              <Card className="figures__card">
                <CardHeader>
                  <CardDescription>{figure.label}</CardDescription>
                  <CardTitle asChild>
                    <p className="figures__value">{figure.format(latest)}</p>
                  </CardTitle>
                </CardHeader>
                <CardContent className="figures__body">
                  <p className="figures__change">
                    {/* The arrow says which way, and the color says whether
                        that's good. Neither is left to do both. */}
                    <Badge
                      intent={figure.good ? "success" : "warning"}
                      variant="outline"
                    >
                      <Trend aria-hidden="true" size={14} />
                      {figure.change}
                    </Badge>
                    <span>against September</span>
                  </p>
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
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
