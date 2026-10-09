import {
  Timeline,
  TimelineContent,
  TimelineDescription,
  TimelineItem,
  TimelineMarker,
  TimelineTime,
  TimelineTitle,
} from "@nuvui/react";

export default function Example() {
  return (
    <Timeline aria-label="History of invoice 1042">
      <TimelineItem>
        <TimelineMarker />
        <TimelineContent>
          <TimelineTitle>Paid in full</TimelineTitle>
          <TimelineDescription>By card ending 4242.</TimelineDescription>
          <TimelineTime dateTime="2026-10-06T14:12:00Z">
            6 October, 14:12
          </TimelineTime>
        </TimelineContent>
      </TimelineItem>
      <TimelineItem>
        <TimelineMarker />
        <TimelineContent>
          <TimelineTitle>Reminder sent</TimelineTitle>
          <TimelineDescription>
            To billing@northwind.example.
          </TimelineDescription>
          <TimelineTime dateTime="2026-10-03T09:00:00Z">
            3 October, 09:00
          </TimelineTime>
        </TimelineContent>
      </TimelineItem>
      <TimelineItem>
        <TimelineMarker />
        <TimelineContent>
          <TimelineTitle>Invoice created</TimelineTitle>
          <TimelineDescription>By Ada Osei.</TimelineDescription>
          <TimelineTime dateTime="2026-09-19T16:40:00Z">
            19 September, 16:40
          </TimelineTime>
        </TimelineContent>
      </TimelineItem>
    </Timeline>
  );
}
