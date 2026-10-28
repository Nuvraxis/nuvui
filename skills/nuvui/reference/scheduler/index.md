<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/scheduler/index.mdx. Don't edit it here: run `pnpm skill`. -->

# Scheduler

The @nuvui/scheduler package. An event calendar with day, week, month and agenda views, installed next to @nuvui/react and @nuvui/date-picker.

The scheduler is a package of its own, `@nuvui/scheduler`, since working out days and times in a time zone needs a date library the core doesn't have:

| Component | What it is |
| --- | --- |
| [EventCalendar](event-calendar.md) | Events in a day, a week, a month or a list, with a header to move through them and a month in a side panel to pick a day from. |

```tsx
"use client";

import { EventCalendar } from "@nuvui/scheduler";
import { teamEvents } from "./events";

export default function Example() {
  return <EventCalendar aria-label="Team calendar" events={teamEvents} />;
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

Each file opens with the same line naming the cascade layers, so the order you import them in doesn't decide which rule wins. The calendar's styles are also on their own, at `@nuvui/scheduler/css/event-calendar.css`.

## What it keeps and what you keep

The events are yours: you pass them in, and the calendar draws them. It keeps which view is shown, the day it's on, what the person looking has chosen in its preferences menu, and whether its side panel is open. Each of those can be yours instead, through a prop and a callback.

## What's coming

This is the first part of the package. These are planned, in this order, and none is in it yet:

- **Editing.** Creating an event from an empty time, a popover to change one, and deleting with a confirmation.
- **Dragging.** Moving and resizing events with a mouse, a finger or the keyboard.
- **Resources,** such as rooms or people, with a panel to show or hide each.
- **Recurring events,** with this one, this and following, or all, when one is changed.
- **A timeline,** with resources as rows and time across.
- **Loading by range,** asking your server only for the days shown.
