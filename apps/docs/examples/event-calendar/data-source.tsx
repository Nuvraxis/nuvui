"use client";

import { EventCalendar } from "@nuvui/scheduler";
import { useMemo } from "react";
import { makeServer } from "./server";

export default function Example() {
  // Made once, so what's loaded is kept from one render to the next.
  const dataSource = useMemo(() => makeServer({ delay: 800 }), []);
  return (
    <EventCalendar
      aria-label="Team calendar"
      dataSource={dataSource}
      defaultPanelOpen={false}
    />
  );
}
