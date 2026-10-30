<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/scheduler/index.mdx. Don't edit it here: run `pnpm skill`. -->

# Scheduler

The @nuvui/scheduler package. An event calendar with day, week, month and agenda views, and a timeline of resources, edited in place and booked against resources, installed next to @nuvui/react and @nuvui/date-picker.

The scheduler is a package of its own, `@nuvui/scheduler`, since working out days and times in a time zone needs a date library the core doesn't have:

| Component | What it is |
| --- | --- |
| [EventCalendar](event-calendar.md) | Events in a day, a week, a month or a list, with a header to move through them and a month in a side panel to pick a day from. [Editing events](editing.md) covers making, changing, moving and deleting them in place, and [Resources](resources.md) booking them against rooms or people. |
| [EventTimeline](event-timeline.md) | Resources down the side and time across, with events as bars along their rows, over hours, days, weeks, months or years. It's edited the same way, and an event can be dragged from one resource's row to another's. |

```tsx
"use client";

import { EventCalendar } from "@nuvui/scheduler";
import { teamEvents } from "./events";

export default function Example() {
  return (
    <EventCalendar aria-label="Team calendar" defaultEvents={teamEvents} />
  );
}
```

## Install

```sh
pnpm add @nuvui/scheduler @nuvui/date-picker @nuvui/react
```

`@nuvui/react` and `@nuvui/date-picker` are peer dependencies. The calendar is drawn with the core's tokens and buttons, and the month in its side panel is date-picker's `Calendar`.

Days and times are worked out with [date-fns](https://date-fns.org) and `@date-fns/tz`, which are installed with the package, at the same versions as date-picker's, so an app has one copy of each.

## Load the styles

Import the package's stylesheet once, after the core's and date-picker's:

```tsx title="app/layout.tsx"
import "@nuvui/react/styles.css";
import "@nuvui/date-picker/styles.css";
import "@nuvui/scheduler/styles.css";
```

Each file opens with the same line naming the cascade layers, so the order you import them in doesn't decide which rule wins. Each component's styles are also on their own, at `@nuvui/scheduler/css/event-calendar.css` and `@nuvui/scheduler/css/event-timeline.css`. The timeline's take in the calendar's, since its events and popover are the calendar's.

## What it keeps and what you keep

The events are yours when you pass `events`, with `onEventsChange` to hear about each change, or the calendar's when you pass `defaultEvents`. It keeps which view is shown, the day it's on, what the person looking has chosen in its preferences menu, whether its side panel is open, and which resources are hidden or folded. The timeline keeps its scale, the period it's on and which resources are folded. Each of those can be yours instead, through a prop and a callback.

Events and resources can keep your own field names. `eventKeys` and `resourceKeys` say which field is which, and changes come back under the same names. [Resources](resources.md#your-own-field-names) has the details.

## What's coming

The calendar's views, [editing](editing.md), [resources](resources.md), [recurring events](recurring-events.md) and the [timeline](event-timeline.md) are in the package. One more is planned, and isn't in it yet:

- **Loading by range,** asking your server only for the days shown.
