"use client";

import {
  Timeline,
  TimelineContent,
  TimelineDescription,
  TimelineItem,
  TimelineMarker,
  type TimelineMarkerProps,
  TimelineTime,
  TimelineTitle,
} from "@nuvui/react";
import { useState } from "react";
import {
  CheckboxControl,
  Playground,
  SelectControl,
  TextControl,
} from "./controls";

type Intent = NonNullable<TimelineMarkerProps["intent"]>;

const intents = Object.keys({
  neutral: true,
  primary: true,
  success: true,
  warning: true,
  danger: true,
} satisfies Record<Intent, true>) as Intent[];

export function TimelinePlayground() {
  const [intent, setIntent] = useState<Intent>("neutral");
  const [title, setTitle] = useState("Invoice sent");
  const [description, setDescription] = useState(true);

  const code = `<Timeline aria-label="History">
  <TimelineItem>
    <TimelineMarker${intent === "neutral" ? "" : ` intent="${intent}"`} />
    <TimelineContent>
      <TimelineTitle>${title}</TimelineTitle>${
        description
          ? `
      <TimelineDescription>To billing@northwind.example.</TimelineDescription>`
          : ""
      }
      <TimelineTime dateTime="2026-10-03T09:00:00Z">3 October, 09:00</TimelineTime>
    </TimelineContent>
  </TimelineItem>
  <TimelineItem>
    <TimelineMarker />
    <TimelineContent>
      <TimelineTitle>Invoice created</TimelineTitle>
    </TimelineContent>
  </TimelineItem>
</Timeline>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="intent"
            value={intent}
            options={intents}
            onChange={setIntent}
          />
          <TextControl
            label="TimelineTitle"
            value={title}
            onChange={setTitle}
          />
          <CheckboxControl
            label="TimelineDescription"
            checked={description}
            onChange={setDescription}
          />
        </>
      }
    >
      <Timeline aria-label="History">
        <TimelineItem>
          <TimelineMarker intent={intent} />
          <TimelineContent>
            <TimelineTitle>{title}</TimelineTitle>
            {description ? (
              <TimelineDescription>
                To billing@northwind.example.
              </TimelineDescription>
            ) : null}
            <TimelineTime dateTime="2026-10-03T09:00:00Z">
              3 October, 09:00
            </TimelineTime>
          </TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineMarker />
          <TimelineContent>
            <TimelineTitle>Invoice created</TimelineTitle>
          </TimelineContent>
        </TimelineItem>
      </Timeline>
    </Playground>
  );
}
