<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/timeline.mdx. Don't edit it here: run `pnpm skill`. -->

# Timeline

Events in the order they happened, each with a marker on a line, a title, a time and a description.

Use a timeline for the history of one thing: an invoice, a deploy, an order, a support ticket. It's an ordered list with a line down its side.

```tsx
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
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import {
  Timeline,
  TimelineContent,
  TimelineDescription,
  TimelineItem,
  TimelineMarker,
  TimelineTime,
  TimelineTitle,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Timeline` | The list. An `ol`. |
| `TimelineItem` | One event. An `li`, holding a marker and then the content. |
| `TimelineMarker` | The point on the line. A ring, or a filled circle with an icon in it. |
| `TimelineContent` | Everything beside the marker. |
| `TimelineTitle` | What happened, in a line. |
| `TimelineDescription` | More about it. |
| `TimelineTime` | When. A `time` element. |

`TimelineItem` needs its marker first and its content second. Inside the content, any of the three parts can be left out, and they can go in any order.

## Props

### TimelineMarker

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `intent` | `"danger" \| "neutral" \| "primary" \| "success" \| "warning"` | `"neutral"` | What kind of event it is. The color is extra: the event's text has to say it too. |

The other parts add no props of their own. Each takes what its element takes, including `ref` and `className`. `TimelineTime` takes `dateTime`.

## Kinds of event

A marker's `intent` fills it with one of the theme's colors, and an icon can go inside. With no intent it's a ring.

```tsx
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
```

The marker is hidden from screen readers. Its color and its icon are for the eye, and the title has to say the same thing in words: "Deploy failed", not "Deploy" beside a red cross.

## The time

`TimelineTime` is a `time` element. Write the time the way people read it as its children, and give the exact one in `dateTime`, in ISO 8601. The children can be relative, such as "Yesterday, 16:30", as long as `dateTime` isn't.

The component doesn't format dates. Whatever writes dates in the rest of your app writes these, so they're in the same language and time zone.

## Order

The list is read in the order it's written. Newest first suits a history someone checks for what just happened. Oldest first suits the steps something went through. Pick one for the whole app.

For a long history, show the latest events and a button that loads more. The component has no paging of its own.

## Accessibility

A timeline has no keyboard behavior of its own. Links and buttons inside an event work as they do anywhere.

### What the component handles

- It's an ordered list, so a screen reader says how many events there are and where it is among them. The list says it's a list in so many words, because Safari stops treating a list as one once its numbers are styled away.
- The marker has `aria-hidden="true"`.
- The line is a border, and a filled marker has a border that can't be seen until the browser forces its own colors. Both are still drawn there.
- The description and the time have at least 4.5:1 against the page in every theme.

### What you need to handle

- Name the list with `aria-label` or `aria-labelledby`, such as "History of invoice 1042".
- Say in the title what the marker's color and icon show.
- Give every `TimelineTime` a `dateTime`.
- An event added while the page is open isn't announced. If it matters, say it in a [toast](toast.md) or an element with `role="status"`.

## CSS variables

Set any of these on the `Timeline`, or on anything around it.

```css
.compact-history {
  --nuv-timeline-space: calc(var(--spacing) * 3);
  --nuv-timeline-marker-size: 1rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-timeline-fg` | `var(--color-foreground)` | Text color. |
| `--nuv-timeline-marker-size` | `1.5rem` | Width and height of a marker. The line and the text move with it. |
| `--nuv-timeline-gap` | `calc(var(--spacing) * 3)` | Space between the marker and the text. |
| `--nuv-timeline-space` | `calc(var(--spacing) * 6)` | Space between one event and the next. |
| `--nuv-timeline-line-width` | `var(--nuv-border-width)` | Thickness of the line. |
| `--nuv-timeline-line` | `var(--color-border)` | Color of the line. |
| `--nuv-timeline-marker-border` | `transparent`, `var(--color-border-strong)` | Border color of a marker. The strong border color on a ring, and transparent on a filled one. |
| `--nuv-timeline-marker-radius` | `var(--radius-full)` | Corner radius of a marker. A circle by default. |
| `--nuv-timeline-marker-bg` | `var(--color-surface)`, `var(--color-primary)`, `var(--color-success)`, `var(--color-warning)`, `var(--color-danger)` | Background color of a marker. Differs by intent. |
| `--nuv-timeline-marker-fg` | `var(--color-surface-foreground)`, `var(--color-primary-foreground)`, `var(--color-background)`, `var(--color-danger-foreground)` | Color of an icon in a marker. Differs by intent. Keep it at 3:1 against the marker. |
| `--nuv-timeline-muted-fg` | `var(--color-muted-foreground)` | Color of the description and the time. Keep it at 4.5:1 against the background. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-timeline` | Timeline |
| `.nuv-timeline__content` | TimelineContent |
| `.nuv-timeline__description` | TimelineDescription |
| `.nuv-timeline__item` | TimelineItem. The line is its `::before`. |
| `.nuv-timeline__marker` | TimelineMarker |
| `.nuv-timeline__marker--danger` | intent="danger" |
| `.nuv-timeline__marker--neutral` | intent="neutral", the default: a ring. |
| `.nuv-timeline__marker--primary` | intent="primary" |
| `.nuv-timeline__marker--success` | intent="success" |
| `.nuv-timeline__marker--warning` | intent="warning" |
| `.nuv-timeline__time` | TimelineTime |
| `.nuv-timeline__title` | TimelineTitle |

## Server components

No part has a `"use client"` directive or uses state, so all of them render in a server component as they are.

## Do and don't

**Do**

- Keep a title to one line that says what happened and, where it matters, who did it.
- Use an intent for the events that need to be found, and leave the rest as rings.

**Don't**

- Don't use it for steps someone still has to take. A timeline is for what has already happened, and has no way to say which step is the current one.
- Don't put the only copy of a fact in the marker. It's hidden from screen readers.
