"use client";

import { type CalendarView, EventCalendar } from "@nuvui/scheduler";
import { useState } from "react";
import { teamEvents } from "@/examples/event-calendar/events";
import { CheckboxControl, Playground, SelectControl } from "./controls";

const views = ["week", "day", "month", "agenda"] as const;
const ranges = ["0 to 24", "8 to 18"] as const;
const steps = ["15", "30", "60"] as const;

export function EventCalendarPlayground() {
  const [view, setView] = useState<CalendarView>("week");
  const [range, setRange] = useState<(typeof ranges)[number]>("0 to 24");
  const [weekends, setWeekends] = useState(true);
  const [numbers, setNumbers] = useState(false);
  const [panel, setPanel] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [step, setStep] = useState<(typeof steps)[number]>("15");

  const hours: [number, number] = range === "8 to 18" ? [8, 18] : [0, 24];
  const preferences = {
    showWeekends: weekends,
    showWeekNumbers: numbers,
  };

  const code = `<EventCalendar
  aria-label="Team calendar"
  defaultEvents={events}
  view="${view}"${range === "8 to 18" ? "\n  hours={[8, 18]}" : ""}
  preferences={{ showWeekends: ${weekends}, showWeekNumbers: ${numbers} }}
  panelOpen={${panel}}${readOnly ? "\n  readOnly" : ""}${step === "15" ? "" : `\n  step={${step}}`}
/>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="view"
            value={view}
            options={views}
            onChange={setView}
          />
          <SelectControl
            label="hours"
            value={range}
            options={ranges}
            onChange={setRange}
          />
          <CheckboxControl
            label="showWeekends"
            checked={weekends}
            onChange={setWeekends}
          />
          <CheckboxControl
            label="showWeekNumbers"
            checked={numbers}
            onChange={setNumbers}
          />
          <CheckboxControl
            label="panelOpen"
            checked={panel}
            onChange={setPanel}
          />
          <CheckboxControl
            label="readOnly"
            checked={readOnly}
            onChange={setReadOnly}
          />
          <SelectControl
            label="step"
            value={step}
            options={steps}
            onChange={setStep}
          />
        </>
      }
    >
      <EventCalendar
        aria-label="Team calendar"
        defaultEvents={teamEvents}
        view={view}
        onViewChange={setView}
        hours={hours}
        preferences={preferences}
        onPreferencesChange={(next) => {
          setWeekends(next.showWeekends ?? true);
          setNumbers(next.showWeekNumbers ?? false);
        }}
        panelOpen={panel}
        onPanelOpenChange={setPanel}
        readOnly={readOnly}
        step={Number(step)}
      />
    </Playground>
  );
}
