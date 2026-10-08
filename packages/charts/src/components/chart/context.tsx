"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { ChartConfig } from "./config";

/** Turns a value from the data into what's shown for it. */
export type ChartValueFormatter = (
  value: number | string,
  key: string,
) => ReactNode;

export interface ChartContextValue {
  config: ChartConfig;
  formatValue: ChartValueFormatter | undefined;
  /** What the chart is called, for the table that repeats it. */
  name: { "aria-label"?: string; "aria-labelledby"?: string };
}

export const ChartContext = createContext<ChartContextValue | null>(null);

export function useChart(part: string) {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error(`${part} has to be inside a ChartContainer.`);
  }
  return context;
}

export function show(
  value: unknown,
  key: string,
  format: ChartValueFormatter | undefined,
): ReactNode {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || typeof value === "string") {
    return format ? format(value, key) : String(value);
  }
  // A range, as an area between two values has.
  if (Array.isArray(value)) {
    return value.map((part, index) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: the parts of one value, which never reorder
      <span key={index}>
        {index > 0 ? " – " : null}
        {show(part, key, format)}
      </span>
    ));
  }
  return String(value);
}
