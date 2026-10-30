<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/scheduler/event-timeline.mdx. Don't edit it here: run `pnpm skill`. -->

# EventTimeline

Resources down the side, time across, and events as bars along their rows. Only the rows and columns in view are drawn, so thousands of resources and years of days stay quick.

Use a timeline when the question is who or what is free: a fleet's vans, a team's people, a hospital's beds. It shows many resources at once, a row each, over hours, days, weeks, months or years. For one resource's week, or a few rooms' days, [EventCalendar](event-calendar.md) is easier to read.

```tsx
"use client";

import { EventTimeline } from "@nuvui/scheduler";
import { runs, vans } from "./fleet";

export default function Example() {
  return (
    <EventTimeline aria-label="Fleet" resources={vans} defaultEvents={runs} />
  );
}
```

## Install

```sh
pnpm add @nuvui/scheduler @nuvui/date-picker @nuvui/react
```

## Import

```tsx
import {
  type CalendarEvent,
  type CalendarResource,
  EventTimeline,
} from "@nuvui/scheduler";
```

The styles are in `@nuvui/scheduler/styles.css`, with the calendar's. [Scheduler](index.md) covers loading them.

```tsx
const resources: CalendarResource[] = [
  { id: "van-1", title: "Van 1" },
  { id: "van-2", title: "Van 2" },
];

const events: CalendarEvent[] = [
  {
    id: "market",
    title: "Market deliveries",
    start: "2026-10-12T05:30",
    end: "2026-10-12T13:00",
    resourceIds: ["van-1"],
  },
  {
    id: "service",
    title: "Service",
    start: "2026-10-13",
    end: "2026-10-14",
    allDay: true,
    resourceIds: ["van-2"],
  },
];

<EventTimeline aria-label="Fleet" resources={resources} events={events} />;
```

## Rows

Each resource is a row, and the resources inside one are rows under it, set in, with a button on the one they're in to fold them away. Folding a resource hides the rows inside it and their events. Which are folded is kept by the timeline, or by you with `collapsedResources` and `onCollapsedResourcesChange`.

An event is drawn in the row of each of its `resourceIds`, so one with two resources is in two rows. An event with no resource the timeline knows of is in a last row named "No resource", which is only there when such an event is. Events that overlap in a row are in lanes, and the row is as tall as its lanes.

The events and resources are the same as the calendar's, with the same fields: [EventCalendar](event-calendar.md#events) has the events, and [Resources](resources.md#a-resource) the resources, with how an event takes its color and rules from them.

`renderResource` draws what's in a row's header beside its fold button, with your own resource object. The row is still named by its title for a screen reader.

```tsx
"use client";

import { type CalendarEvent, EventTimeline } from "@nuvui/scheduler";
import { day } from "../event-calendar/events";

// A team's people, each with their role, held under the app's own names.
const people = [
  { slug: "ines", name: "Ines Porter", role: "Design" },
  { slug: "tomas", name: "Tomas Reyna", role: "Engineering" },
  { slug: "wren", name: "Wren Halloway", role: "Engineering" },
  { slug: "odile", name: "Odile Marsh", role: "Research" },
];

const work: CalendarEvent[] = [
  {
    id: "onboarding",
    title: "Onboarding flow",
    start: day(-10),
    end: day(12),
    allDay: true,
    resourceIds: ["ines", "tomas"],
  },
  {
    id: "leave",
    title: "Leave",
    start: day(15),
    end: day(26),
    allDay: true,
    color: "6",
    resourceIds: ["ines"],
  },
  {
    id: "billing",
    title: "Billing rewrite",
    start: day(-3),
    end: day(40),
    allDay: true,
    resourceIds: ["wren"],
  },
  {
    id: "interviews",
    title: "Customer interviews",
    start: day(4),
    end: day(18),
    allDay: true,
    resourceIds: ["odile"],
  },
  {
    id: "launch",
    title: "Launch",
    start: day(45),
    end: day(46),
    allDay: true,
    color: "3",
    resourceIds: ["ines", "tomas", "wren", "odile"],
  },
];

export default function Example() {
  return (
    <EventTimeline
      aria-label="Team plan"
      resources={people}
      resourceKeys={{ id: "slug", title: "name" }}
      renderResource={(person) => (
        <>
          {person.name}{" "}
          <small style={{ color: "var(--color-muted-foreground)" }}>
            {person.role}
          </small>
        </>
      )}
      defaultEvents={work}
      defaultScale="weeks"
      scales={["days", "weeks", "months"]}
    />
  );
}
```

## Scales

The scale is what each column is, and how much the timeline shows at once:

| Scale | A column | Grouped by | Shows at once |
| --- | --- | --- | --- |
| `hours` | An hour | Day | 3 days, from the date |
| `days` | A day | Month | 1 month |
| `weeks` | A week, from the locale's first day | Month | 3 months |
| `months` | A month | Year | 1 year |
| `years` | A year | | 10 years, from a year ending in 0 |

The header switches between them. `scales` limits which are offered, and with one there's no switch. `spans` changes how much a scale shows, and so how far Previous and Next go, in days for `hours`, months for `days` and `weeks`, and years for `months` and `years`:

```tsx
<EventTimeline
  defaultScale="days"
  scales={["days", "weeks"]}
  spans={{ days: 3 }}
/>
```

`scale` and `onScaleChange` keep the scale with you, and `date` and `onDateChange` the period, as on the calendar.

A column is never narrower than its scale's CSS variable. When the columns would be narrower than the timeline, they widen to fill it, and when they're wider, the timeline scrolls across. It opens at now when now is in the period, with the column before it at the start.

## Hours

`hours` limits the hours of each day the hours scale shows, from the first to the last, which isn't included. An event that's partly outside them is cut where they end, and its square end marks the cut. An event wholly outside them isn't drawn. An all-day event takes the hours shown of its days.

```tsx
"use client";

import { EventTimeline } from "@nuvui/scheduler";
import { runs, vans } from "./fleet";

export default function Example() {
  return (
    <EventTimeline
      aria-label="Fleet by the hour"
      resources={vans}
      defaultEvents={runs}
      defaultScale="hours"
      scales={["hours", "days"]}
      hours={[6, 20]}
      spans={{ hours: 2 }}
    />
  );
}
```

When now isn't in the days shown, the hours scale opens at `scrollToHour`.

## Editing

Everything [Editing events](editing.md) says of the calendar holds here: the popover, making an event with a click or a drag on empty time, `readOnly`, `confirmDelete`, `onEditStart`, things dragged in from elsewhere on the page, and the question about a [repeating event](recurring-events.md#changing-one).

What's new is the row. An event dragged up or down to another row is given that row's resource in place of the one it left, and keeps any others it has. One dragged to the row for none loses the one it left. With `resourceRequired`, it can't go there. An event made on empty time is given the resource of the row it's made in.

On the days, weeks, months and years scales, a drag moves an event by whole days and keeps its times on the clock, and an event made on empty time takes whole days. On the hours scale, both snap to `step`.

```tsx
"use client";

import { type EventChange, EventTimeline } from "@nuvui/scheduler";
import { useState } from "react";
import { runs, vans } from "./fleet";

// A change in words: what it was, the event, and the vans it's on.
function describe(change: EventChange): string {
  const { event } = change;
  const on = event.resourceIds?.length
    ? `on ${event.resourceIds.join(", ")}`
    : "on no van";
  return `${change.type}, ${event.title}, ${on}`;
}

let made = 0;

export default function Example() {
  const [events, setEvents] = useState(runs);
  const [log, setLog] = useState<{ id: number; text: string }[]>([]);

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <EventTimeline
        aria-label="Fleet you hold"
        resources={vans}
        events={events}
        onEventsChange={(next, change) => {
          setEvents(next);
          made += 1;
          const entry = { id: made, text: describe(change) };
          setLog((was) => [...was, entry]);
        }}
      />
      <ol aria-label="Changes" style={{ margin: 0, paddingInlineStart: 20 }}>
        {log.length === 0 ? (
          <li>Nothing changed yet.</li>
        ) : (
          log.slice(-4).map((entry) => <li key={entry.id}>{entry.text}</li>)
        )}
      </ol>
    </div>
  );
}
```

## Many resources

Only the rows and the columns in view are drawn, and a few past each edge, so the page holds the same few hundred elements however many resources and days there are. The rows and columns that aren't drawn are still counted, with `aria-rowcount` and `aria-colcount`, and a screen reader hears where it is in the whole.

```tsx
"use client";

import {
  type CalendarEvent,
  type CalendarResource,
  EventTimeline,
} from "@nuvui/scheduler";
import { useMemo } from "react";
import { day } from "../event-calendar/events";

// Two thousand machines, each booked for a few days at a time over three
// years. Only the rows and columns in view are drawn.
function plant() {
  const resources: CalendarResource[] = [];
  const events: CalendarEvent[] = [];
  for (let machine = 1; machine <= 2000; machine += 1) {
    resources.push({ id: `m${machine}`, title: `Machine ${machine}` });
    // The same bookings every time, without anything random.
    for (let at = -540 + (machine % 9); at < 540; at += 12 + (machine % 5)) {
      events.push({
        id: `m${machine}-${at}`,
        title: `Job ${machine}.${at + 540}`,
        start: day(at),
        end: day(at + 1 + (machine % 4)),
        allDay: true,
        color: String((machine % 8) + 1),
        resourceIds: [`m${machine}`],
      });
    }
  }
  return { resources, events };
}

export default function Example() {
  const { resources, events } = useMemo(plant, []);
  return (
    <EventTimeline
      aria-label="Machines"
      resources={resources}
      defaultEvents={events}
      spans={{ days: 36 }}
    />
  );
}
```

Every event in the period is still worked out, to know how tall each row is. Tens of thousands of events are fine. For more, give the timeline the events of the period it shows, from `onDateChange` and `onScaleChange`.

## Language and dates

`locale` writes the dates and the times, and sets the first day of a week. The words the timeline writes itself are in `labels`, with the calendar's. [Translation](../translation.md#scheduler) lists them.

## EventTimeline props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `events` | `readonly TEvent[]` |  | The events, when you hold them. Pass `onEventsChange` too for them to be changed: without it, they open to be read. |
| `defaultEvents` | `readonly TEvent[]` |  | The events at first, when the component holds them. |
| `onEventsChange` | `((events: TEvent[], change: EventChange<TEvent>) => void)` |  | Called with every event after one is made, changed or deleted, and what the change was. |
| `eventKeys` | `Partial<Record<keyof CalendarEvent, string>>` |  | The names your events' fields have where they aren't these, such as `{ title: "name", resourceIds: "roomId" }`. Events are read from them, and changes are written back to them, with every other field of yours kept. |
| `resourceKeys` | `Partial<Record<keyof CalendarResource, string>>` |  | The names your resources' fields have where they aren't these. |
| `resourceRequired` | `boolean` | `false` | Every event needs a resource, and the popover offers no choice of none. On the calendar, a new event is given the first resource shown. |
| `multipleResources` | `boolean` | `false` | An event can be given several resources in its popover, not just one. |
| `readOnly` | `boolean` | `false` | Events open to be read, and can't be made, changed, moved or deleted. An event's own `readOnly` wins over this. |
| `creatable` | `boolean` | `true` | Whether new events can be made on empty time, with a click or by dragging across it. Something dropped from elsewhere on the page is still added. |
| `createOn` | `"click" \| "doubleClick"` | `"click"` | What makes an event on empty time: a click, or a double click. |
| `resources` | `readonly TResource[]` |  | What events are booked against, a row each: vehicles, people, rooms. Those inside a resource are rows under it, which fold away. An event is drawn in the row of each of its resources. |
| `collapsedResources` | `readonly string[]` |  | The ids of the folded resources, when you control them. |
| `defaultCollapsedResources` | `readonly string[]` |  | The resources folded at first, when you don't control them. |
| `onCollapsedResourcesChange` | `((collapsed: string[]) => void)` |  | Called with the ids of every folded resource when one folds or opens. |
| `scale` | `"days" \| "hours" \| "months" \| "weeks" \| "years"` |  | What a column is, when you control it. |
| `defaultScale` | `"days" \| "hours" \| "months" \| "weeks" \| "years"` | `"days"` | What a column is at first, when you don't control it: an hour, a day, a week, a month or a year. |
| `onScaleChange` | `((scale: TimelineScale) => void)` |  | Called with the scale chosen. |
| `scales` | `readonly TimelineScale[]` | `["hours", "days", "weeks", "months", "years"]` | The scales offered in the header, in order. With one, there's no choice to make, and no switch. |
| `spans` | `Partial<Record<TimelineScale, number>>` | `{ hours: 3, days: 1, weeks: 3, months: 1, years: 10 }` | How much each scale shows at once, and how far Previous and Next go: days for `hours`, months for `days` and `weeks`, and years for `months` and `years`. Those left out keep theirs. |
| `hours` | `readonly [number, number]` | `[0, 24]` | The hours of each day the hours scale shows, from the first to the last, which isn't included. Whole hours from 0 to 24. An event partly outside them is cut where they end, and marked so. |
| `scrollToHour` | `number` | `7` | The hour the hours scale opens scrolled to, when now isn't in the days shown. |
| `renderResource` | `((resource: TResource) => ReactNode)` |  | What a resource's row shows beside its fold button: its title by default. The row is still named by the title. |
| `headingLevel` | `2 \| 3 \| 4 \| 5` | `2` | The level of the heading with the period shown. |
| `defaultDuration` | `number` | `60` | Minutes a new event lasts when it's made with a click on a time, and an all-day one dragged onto a time. |
| `step` | `number` | `15` | Minutes that times snap to while an event is dragged, and that the arrow keys move it by. |
| `confirmDelete` | `boolean` | `true` | Asks before an event is deleted. An event that repeats is always asked about, since which of its occurrences go is the question. |
| `eventFields` | `readonly EventField[]` | `["title", "time", "repeat", "resource", "color", "description"]` | The parts of an event's popover, in order. Leave one out to take it away. |
| `renderEventFields` | `((props: EventFieldsProps<TEvent>) => ReactNode)` |  | Fields of your own, shown in an event's popover after the rest. |
| `onEditStart` | `((event: TEvent, details: EditStartDetails) => void)` |  | Called before an event's popover opens, however it's opened. Call `preventDefault` on the details to open your own form instead. |
| `onEventDropOutside` | `((event: TEvent, details: EventDropOutsideDetails) => boolean \| undefined)` |  | Called when an event is dragged out of the component and let go, with what's under the pointer. Return `true` to take it off. |
| `createId` | `(() => string)` |  | Makes the id of a new event. A random UUID by default. |
| `date` | `Date` |  | A moment in the period shown, when you control it. |
| `defaultDate` | `Date` |  | A moment in the period shown at first, when you don't control it. Today by default. |
| `onDateChange` | `((date: Date) => void)` |  | Called with the start of the day moved to. |
| `timeZone` | `string` |  | The time zone events are shown in, such as `"Europe/Paris"`. It changes how they're drawn, not when they happen. The browser's own by default. |
| `locale` | `DayPickerLocale` |  | The language dates and times are written in, and the first day of the week. Any locale from `@nuvui/date-picker/locale`. |
| `today` | `Date` |  | The moment taken as now. Set it for a server, a screenshot or a test. The browser's clock by default. |
| `color` | `EventColor` | `"1"` | The color of events that have none of their own, and none from a resource. |
| `labels` | `Partial<SchedulerLabels>` |  | The words it shows and says. Translate them with the rest of your interface. |
| `onEventClick` | `((event: TEvent, element: HTMLElement) => void)` |  | Called when an event is pressed, with the element pressed, before its popover opens. |

It also takes the attributes of a `section`, and passes `ref` to it.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Into the grid at its current cell, then to the events that start in that cell, then out of the grid. |
| <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> | To the next cell that way. From the first column, <kbd>←</kbd> goes to the row's resource. |
| <kbd>Home</kbd> <kbd>End</kbd> | To the first or last column of the row. With <kbd>Ctrl</kbd>, of the first or last row. |
| <kbd>Page Up</kbd> <kbd>Page Down</kbd> | Up or down by the rows in view. |
| <kbd>Enter</kbd> | On an event, opens it. On an empty cell, makes an event there. On a resource with others inside it, folds or opens them. |
| <kbd>Space</kbd> | On an event that can be moved, picks it up. |
| <kbd>Delete</kbd> or <kbd>Backspace</kbd> | On an event, asks to delete it. |

With an event picked up, <kbd>←</kbd> and <kbd>→</kbd> move it along its row, by `step` on the hours scale and by a day on the others, and <kbd>↑</kbd> and <kbd>↓</kbd> move it to the row above or below. <kbd>Shift</kbd> with <kbd>←</kbd> or <kbd>→</kbd> changes when it ends. <kbd>Space</kbd> or <kbd>Enter</kbd> drops it, and <kbd>Esc</kbd> puts it back.

The arrows go by where things are on the screen. Where the page reads right to left, time runs from the right, and <kbd>←</kbd> goes later.

### What the component handles

- The timeline is a region named by `aria-label`, "Timeline" by default.
- The rows and columns are a grid, with the header's rows of column headers, and each resource as the header of its row. Each cell is named by its resource and its time, and only one cell at a time is in the tab order.
- The grid counts every row and column, and each one drawn says where it is, so a screen reader hears the whole grid though only part of it is drawn.
- Every event is a button whose name has its title, its time or "All day", its days, and its resources.
- The button that folds a resource says whether it's open.
- Today is marked as the current date.
- The heading with the period shown is a live region.
- The line at the time now is hidden from screen readers.
- A bar, the fold buttons and the buttons in the header are 44 pixels on a touch screen.

### What you need to handle

- Name the timeline with `aria-label`, after what it shows: "Fleet", "Team plan".
- Give events titles that tell them apart, since a screen reader hears the title first.
- What `renderResource` draws is seen, and the row is named by the resource's title, so put what a screen reader needs in the title.

## On small screens

Narrower than 640 pixels, measured on the timeline and not the window, the resources' column is narrower and the scales are a menu. The rows and columns scroll under it both ways, and a finger held still on an event picks it up to drag, so a swipe still scrolls.

## CSS variables

Set any of these on an `EventTimeline`, or on anything around it. Its events and their popover are the calendar's, and take [its variables](event-calendar.md#css-variables) for events.

```css
.fleet {
  --nuv-event-timeline-height: 48rem;
  --nuv-event-timeline-resource-width: 16rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-event-timeline-resource-width` | `12rem`, `8rem` | Width of the resources' column. Narrower on a narrow timeline. |
| `--nuv-event-timeline-height` | `36rem` | Height of the timeline. The grid fills it. |
| `--nuv-event-timeline-radius` | `var(--radius-lg)` | Corner radius of the timeline. |
| `--nuv-event-timeline-bg` | `var(--color-surface)` | Background of the timeline, and of what stays in place as it scrolls. |
| `--nuv-event-timeline-fg` | `var(--color-surface-foreground)` | Color of the text. |
| `--nuv-event-timeline-day-width` | `2.75rem` | The narrowest a column is on the days scale. |
| `--nuv-event-timeline-bar-pitch` | `2.875rem`, `1.75rem` | Height of a lane of bars, with the gap below a bar. |
| `--nuv-event-timeline-hour-width` | `4rem` | The narrowest a column is on the hours scale. |
| `--nuv-event-timeline-week-width` | `5rem` | The narrowest a column is on the weeks scale. |
| `--nuv-event-timeline-month-width` | `4.5rem` | The narrowest a column is on the months scale. |
| `--nuv-event-timeline-year-width` | `6rem` | The narrowest a column is on the years scale. |
| `--nuv-event-timeline-today` | `var(--color-primary)` | Background of today's date, behind --color-primary-foreground. |
| `--nuv-event-timeline-resource-indent` | `1rem` | How far a resource inside another is set in. |
| `--nuv-event-timeline-weekend-bg` | `color-mix(in oklab, var(--color-muted) 50%, transparent)` | Background of the weekends on the days scale. |
| `--nuv-event-timeline-today-bg` | `color-mix(in oklab, var(--color-primary) 4%, transparent)` | Background of today's column. |
| `--nuv-event-timeline-now` | `var(--color-danger)` | Color of the line at the time now. |

## Classes

The events, the popover and the dialogs have the calendar's classes, such as `nuv-event-calendar__event`.

| Class | What it's on |
| --- | --- |
| `.nuv-event-timeline` | EventTimeline |
| `.nuv-event-timeline__body` | The rows. |
| `.nuv-event-timeline__cell` | A column of a row. |
| `.nuv-event-timeline__cell--group-start` | The first column of a day, a month or a year. |
| `.nuv-event-timeline__cell--today` | Today's column. |
| `.nuv-event-timeline__cell--weekend` | A weekend's column on the days scale. |
| `.nuv-event-timeline__chevron` | The arrow in each. |
| `.nuv-event-timeline__column-head` | A column's header. |
| `.nuv-event-timeline__column-head--group-start` | The first column of a day, a month or a year. |
| `.nuv-event-timeline__column-head--today` | Today's. |
| `.nuv-event-timeline__corner` | Where the header's rows meet the resources' column. |
| `.nuv-event-timeline__date` | A day's number in its header. |
| `.nuv-event-timeline__event` | An event, with the calendar's classes, along its row. |
| `.nuv-event-timeline__fold` | The button that folds the resources inside one. |
| `.nuv-event-timeline__fold-space` | Its place, kept in a resource with none inside it. |
| `.nuv-event-timeline__grid` | The grid, which scrolls both ways. |
| `.nuv-event-timeline__group` | A day, a month or a year over its columns. |
| `.nuv-event-timeline__group-name` | Its name, which keeps to the start of what's seen of it. |
| `.nuv-event-timeline__head` | The header's rows, which stay at the top. |
| `.nuv-event-timeline__head-row` | A row of the header. |
| `.nuv-event-timeline__head-row--groups` | The row of days, months or years over the columns. |
| `.nuv-event-timeline__header` | The header. |
| `.nuv-event-timeline__icon-button` | A button in the header with only an icon. |
| `.nuv-event-timeline__now` | The line at the time now. |
| `.nuv-event-timeline__probe` | A hidden column and lane, measured to lay out the grid. |
| `.nuv-event-timeline__resource` | The resource at the start of a row. |
| `.nuv-event-timeline__resource-name` | A resource's title, or what renderResource draws. |
| `.nuv-event-timeline__row` | A resource's row. |
| `.nuv-event-timeline__scale-select` | The scale switch as a menu, on a narrow timeline. |
| `.nuv-event-timeline__steps` | The previous and next buttons. |
| `.nuv-event-timeline__swatch` | The dot of a resource's color. |
| `.nuv-event-timeline__title` | The heading with the period shown. |
| `.nuv-event-timeline__tools` | The scale switch. |
| `.nuv-event-timeline__view` | Around the grid. |
