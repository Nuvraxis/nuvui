"use client";

import { EventTimeline, type TimelineScale } from "@nuvui/scheduler";
import { useState } from "react";
import { runs, vans } from "@/examples/event-timeline/fleet";
import { CheckboxControl, Playground, SelectControl } from "./controls";

const scales = ["hours", "days", "weeks", "months", "years"] as const;
const ranges = ["0 to 24", "6 to 20"] as const;
const steps = ["15", "30", "60"] as const;

export function EventTimelinePlayground() {
  const [scale, setScale] = useState<TimelineScale>("days");
  const [range, setRange] = useState<(typeof ranges)[number]>("0 to 24");
  const [folded, setFolded] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [step, setStep] = useState<(typeof steps)[number]>("15");

  const hours: [number, number] = range === "6 to 20" ? [6, 20] : [0, 24];
  const collapsed = folded ? ["north"] : [];

  const code = `<EventTimeline
  aria-label="Fleet"
  resources={vans}
  defaultEvents={runs}
  scale="${scale}"${range === "6 to 20" ? "\n  hours={[6, 20]}" : ""}
  collapsedResources={${JSON.stringify(collapsed)}}${readOnly ? "\n  readOnly" : ""}${step === "15" ? "" : `\n  step={${step}}`}
/>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="scale"
            value={scale}
            options={scales}
            onChange={setScale}
          />
          <SelectControl
            label="hours"
            value={range}
            options={ranges}
            onChange={setRange}
          />
          <CheckboxControl
            label="North depot folded"
            checked={folded}
            onChange={setFolded}
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
      <EventTimeline
        aria-label="Fleet"
        resources={vans}
        defaultEvents={runs}
        scale={scale}
        onScaleChange={setScale}
        hours={hours}
        collapsedResources={collapsed}
        onCollapsedResourcesChange={(next) => setFolded(next.includes("north"))}
        readOnly={readOnly}
        step={Number(step)}
      />
    </Playground>
  );
}
