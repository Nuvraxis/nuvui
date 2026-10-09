import {
  Timeline,
  TimelineContent,
  TimelineDescription,
  TimelineItem,
  TimelineMarker,
  TimelineTime,
  TimelineTitle,
} from "@nuvui/react";
import type { ReactNode } from "react";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export default function Example() {
  return (
    <Timeline aria-label="Deploys of the billing service">
      <TimelineItem>
        <TimelineMarker intent="danger">
          <Icon>
            <path d="M3 3l6 6M9 3l-6 6" />
          </Icon>
        </TimelineMarker>
        <TimelineContent>
          <TimelineTitle>Deploy failed</TimelineTitle>
          <TimelineDescription>
            The health check timed out after 90 seconds.
          </TimelineDescription>
          <TimelineTime dateTime="2026-10-08T11:02:00Z">
            Today, 11:02
          </TimelineTime>
        </TimelineContent>
      </TimelineItem>
      <TimelineItem>
        <TimelineMarker intent="warning">
          <Icon>
            <path d="M6 3v3.5M6 9h.01" />
          </Icon>
        </TimelineMarker>
        <TimelineContent>
          <TimelineTitle>Deployed with warnings</TimelineTitle>
          <TimelineDescription>
            Two migrations took over a minute.
          </TimelineDescription>
          <TimelineTime dateTime="2026-10-07T16:30:00Z">
            Yesterday, 16:30
          </TimelineTime>
        </TimelineContent>
      </TimelineItem>
      <TimelineItem>
        <TimelineMarker intent="success">
          <Icon>
            <path d="M2.5 6.5l2.25 2.25L9.5 3.5" />
          </Icon>
        </TimelineMarker>
        <TimelineContent>
          <TimelineTitle>Deployed</TimelineTitle>
          <TimelineTime dateTime="2026-10-06T10:15:00Z">
            6 October, 10:15
          </TimelineTime>
        </TimelineContent>
      </TimelineItem>
      <TimelineItem>
        <TimelineMarker intent="primary">
          <Icon>
            <path d="M6 2.5v7M2.5 6h7" />
          </Icon>
        </TimelineMarker>
        <TimelineContent>
          <TimelineTitle>Service created</TimelineTitle>
          <TimelineTime dateTime="2026-10-01T09:00:00Z">
            1 October, 09:00
          </TimelineTime>
        </TimelineContent>
      </TimelineItem>
    </Timeline>
  );
}
