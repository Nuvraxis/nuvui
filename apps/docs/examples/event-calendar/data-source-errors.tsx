"use client";

import { EventCalendar } from "@nuvui/scheduler";
import { useMemo } from "react";
import { makeServer } from "./server";

export default function Example() {
  const dataSource = useMemo(() => {
    // The first load fails, to show Try again, and so does every save, to
    // show a change being taken back.
    let loads = 0;
    return makeServer({
      delay: 600,
      fails: (kind) => {
        if (kind === "save") return true;
        loads += 1;
        return loads === 1;
      },
    });
  }, []);
  return (
    <EventCalendar
      aria-label="Team calendar"
      dataSource={dataSource}
      defaultPanelOpen={false}
    />
  );
}
