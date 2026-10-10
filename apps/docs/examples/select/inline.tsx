"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nuvui/react";
import { useState } from "react";

const counts: Record<string, number> = { "7": 38, "30": 164, "365": 1912 };

export default function Example() {
  const [period, setPeriod] = useState("30");

  return (
    <p style={{ margin: 0, fontSize: 18 }}>
      <span aria-live="polite">{counts[period]} orders</span> in{" "}
      <Select value={period} onValueChange={setPeriod}>
        <SelectTrigger variant="inline" aria-label="Period">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">the last 7 days</SelectItem>
          <SelectItem value="30">the last 30 days</SelectItem>
          <SelectItem value="365">the last year</SelectItem>
        </SelectContent>
      </Select>
      .
    </p>
  );
}
