<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/scheduler/editing.mdx. Don't edit it here: run `pnpm skill`. -->

# Editing events

Making, changing, moving and deleting events in an EventCalendar, with a pointer, a finger or the keyboard.

An [EventCalendar](event-calendar.md) can be edited in place. Empty time is clicked or dragged across to make an event, an event opens in a popover to be changed, and it's dragged to move it or by its ends to change how long it lasts.

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

## Where changes go

The calendar edits its events when it has somewhere to keep the change:

- **`defaultEvents`** gives it the events to keep itself. Changes stay in the calendar.
- **`events` with `onEventsChange`** leaves them with you. `onEventsChange` is called with every event after a change, and the change itself, for you to keep and send on.
- **`events` alone** shows them to be read. An event opens in its popover with its time and description, and nothing can be changed.

```tsx
const [events, setEvents] = useState(initialEvents);

<EventCalendar
  events={events}
  onEventsChange={(next, change) => {
    setEvents(next);
    save(change);
  }}
/>;
```

The change is `{ type: "create", event }`, `{ type: "update", event, previous }` or `{ type: "delete", event }`.

```tsx
"use client";

import {
  type CalendarEvent,
  EventCalendar,
  type EventChange,
} from "@nuvui/scheduler";
import { useState } from "react";
import { teamEvents } from "./events";

export default function Example() {
  const [events, setEvents] = useState<CalendarEvent[]>(teamEvents);
  const [last, setLast] = useState<EventChange | null>(null);

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <EventCalendar
        aria-label="Team calendar"
        events={events}
        onEventsChange={(next, change) => {
          setEvents(next);
          setLast(change);
        }}
        defaultPanelOpen={false}
      />
      <p role="status" style={{ margin: 0 }}>
        {last
          ? `Last change: ${last.type}, ${last.event.title || "Untitled"}.`
          : "Nothing changed yet."}
      </p>
    </div>
  );
}
```

An event's dates come back the way they were given: a `Date` stays a `Date`, a string with a zone stays a moment, and a clock time without a zone is written as one, `"2026-10-14T09:30"`, on the event's own clock. A whole day is written `"2026-10-14"`. A new event's id comes from `createId`, a random UUID by default.

## Making an event

A click on empty time makes an event that lasts `defaultDuration`, an hour by default, starting at the time clicked to the nearest `step` before it. A click on the all-day row or a day in a month makes an all-day event. Dragging across empty time makes one that long. The new event opens in its popover, and it's added when it's saved.

`createOn="doubleClick"` makes events with a double click instead, so a single click only moves the focus. `creatable={false}` stops events being made at all, while the ones there can still be changed.

From the keyboard, <kbd>Enter</kbd> on an empty cell makes an event there.

## The popover

An event opens in a popover beside it, with its title, whether it's all day, when it starts and ends, its [resource](resources.md#in-the-popover) when the calendar has resources, its color and its description. It isn't modal: a click elsewhere closes it without saving. An event that can't be changed opens with its time and description to be read.

`eventFields` chooses the parts and their order, and `renderEventFields` adds your own after them. Your fields are given the event, the changes made so far and `onChange`, and what's passed to `onChange` is kept on the event when it's saved.

```tsx
"use client";

import { Input, Label } from "@nuvui/react";
import { type CalendarEvent, EventCalendar } from "@nuvui/scheduler";
import { teamEvents } from "./events";

// The app's own field, kept on its events beside the calendar's.
type Booking = CalendarEvent & { room?: string };

export default function Example() {
  return (
    <EventCalendar
      aria-label="Team calendar"
      defaultEvents={teamEvents}
      defaultPanelOpen={false}
      eventFields={["title", "time", "description"]}
      renderEventFields={({ event, changes, onChange, readOnly }) => {
        const room = (changes.room ?? (event as Booking).room ?? "") as string;
        if (readOnly) return room ? <p>Room: {room}</p> : null;
        return (
          <div style={{ display: "grid", gap: 6 }}>
            <Label htmlFor="booking-room">Room</Label>
            <Input
              id="booking-room"
              value={room}
              onChange={(input) => onChange({ room: input.target.value })}
            />
          </div>
        );
      }}
    />
  );
}
```

`onEditStart` is called before the popover opens, however it's opened, with whether the event is new. Call `preventDefault` on its details to keep the popover closed and open a form of your own.

```tsx
<EventCalendar
  defaultEvents={events}
  onEditStart={(event, details) => {
    details.preventDefault();
    openBookingForm(event, details.isNew);
  }}
/>
```

## Deleting

Delete is in the popover, and <kbd>Delete</kbd> or <kbd>Backspace</kbd> deletes the event that has the focus. The calendar asks first, in an alert dialog, unless `confirmDelete={false}`. The focus goes back to the cell the event was in, or to the next event in a list.

## Read-only

`readOnly` on the calendar makes every event open to be read. On an event, it does the same for that one. On a [resource](resources.md), it does the same for its events, unless an event says otherwise. `draggable={false}` on an event keeps it where it is while it can still be changed in its popover, and `resizable` says which of its ends can be dragged: `true`, `false`, `"start"` or `"end"`. Both can be set on a resource too, for all its events.

```tsx
"use client";

import { type CalendarEvent, EventCalendar } from "@nuvui/scheduler";
import { teamEvents } from "./events";

// The stand-ups are fixed, the planning session can be moved and not made
// longer, and the rest can be changed freely.
const events: CalendarEvent[] = teamEvents.map((event) =>
  event.id.startsWith("stand-up")
    ? { ...event, readOnly: true }
    : event.id === "planning"
      ? { ...event, resizable: false }
      : event,
);

export default function Example() {
  return (
    <EventCalendar
      aria-label="Team calendar"
      defaultEvents={events}
      defaultPanelOpen={false}
    />
  );
}
```

## Dragging

An event is dragged to move it, to another time or another day, from the times to the all-day row or back. Its top and bottom, or its ends on a bar across days, are dragged to change how long it lasts. Times snap to `step`, 15 minutes by default. Where it would go is drawn faintly while it's dragged, and <kbd>Esc</kbd> puts it back.

A mouse drags once it has moved a few pixels, so a click still opens the event. A finger is held on an event for half a second to pick it up, so a swipe still scrolls the calendar. A tap on an event shows a small toolbar with Edit and Delete, since a touch screen has no right click.

## From the keyboard

<kbd>Space</kbd> picks up the event that has the focus. Then:

| Key | What it does |
| --- | --- |
| <kbd>↑</kbd> <kbd>↓</kbd> | Earlier or later by a `step`, on the time grid. A week back or on, everywhere else. |
| <kbd>←</kbd> <kbd>→</kbd> | A day back or on. |
| <kbd>Shift</kbd> and an arrow | Moves only its end, to make it longer or shorter. |
| <kbd>Space</kbd> or <kbd>Enter</kbd> | Drops it there. |
| <kbd>Esc</kbd> | Puts it back where it was. |

A screen reader hears each step: picked up, its new time as it moves, and dropped or put back. Moved off the days shown, the calendar goes with it. <kbd>Enter</kbd> on an event opens its popover.

## From elsewhere on the page

`eventDragProps` makes an element of your own one that can be dragged onto the calendar, where it's added as an event when it's dropped. It takes the title, and optionally `duration` in minutes, `allDay`, `color`, `resourceIds` and `description`. Anything else on it, such as your own id, is copied onto the event.

An event dragged out of the calendar and let go calls `onEventDropOutside` with what's under the pointer. Return `true` to take it off the calendar.

```tsx
"use client";

import {
  type CalendarEvent,
  EventCalendar,
  type ExternalEvent,
  eventDragProps,
} from "@nuvui/scheduler";
import { useState } from "react";
import { teamEvents } from "./events";

const start: ExternalEvent[] = [
  { title: "Write the release notes", duration: 90, color: "5" },
  { title: "Review the hiring plan", duration: 30, color: "7" },
  { title: "Book the venue", duration: 60, color: "8" },
];

export default function Example() {
  const [tasks, setTasks] = useState(start);
  const [events, setEvents] = useState<CalendarEvent[]>(teamEvents);

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: "minmax(12rem, 1fr) 4fr",
        inlineSize: "100%",
      }}
    >
      <section aria-labelledby="tasks-heading" data-task-list="">
        <h3 id="tasks-heading" style={{ marginBlockStart: 0 }}>
          To schedule
        </h3>
        <ul style={{ display: "grid", gap: 8, margin: 0, padding: 0 }}>
          {tasks.map((task) => (
            <li
              key={task.title}
              {...eventDragProps(task)}
              style={{
                listStyle: "none",
                padding: "8px 12px",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                cursor: "grab",
              }}
            >
              {task.title}, {task.duration} minutes
            </li>
          ))}
        </ul>
      </section>
      <EventCalendar
        aria-label="Team calendar"
        events={events}
        defaultPanelOpen={false}
        onEventsChange={(next, change) => {
          setEvents(next);
          // A task dropped on the calendar is scheduled, and off the list.
          if (change.type === "create") {
            setTasks((list) =>
              list.filter((task) => task.title !== change.event.title),
            );
          }
        }}
        // An event dragged back onto the list is unscheduled again.
        onEventDropOutside={(event, { target }) => {
          if (!target?.closest("[data-task-list]")) return false;
          const minutes =
            (new Date(event.end).getTime() - new Date(event.start).getTime()) /
            60_000;
          setTasks((list) => [
            ...list,
            { title: event.title, duration: minutes, color: event.color },
          ]);
          return true;
        }}
      />
    </div>
  );
}
```

This uses the browser's own drag and drop, which works with a mouse and not with a finger or the keyboard. Give people another way to do the same, such as a button on each item that adds it to the calendar.

## Props for editing

They're listed with the rest of [EventCalendar's props](event-calendar.md#eventcalendar-props): `defaultEvents`, `onEventsChange`, `readOnly`, `creatable`, `createOn`, `defaultDuration`, `step`, `confirmDelete`, `eventFields`, `renderEventFields`, `onEditStart`, `onEventDropOutside` and `createId`.

## Accessibility

### What the component handles

- Every way of making, moving and resizing an event with a pointer can also be done from the keyboard, and each step is said in a live region.
- The faint copy of an event being dragged is hidden from screen readers.
- The popover is labelled by its heading, and the focus goes into it when it opens and back to the event when it closes.
- Delete asks first in an alert dialog, whose focus starts on Cancel.
- The colors in the popover are radios, each named "Color 1" to "Color 8", since the theme decides what they look like.

### What you need to handle

- Say what the calendar's colors mean somewhere on the page, if they mean something.
- Offer a way other than dragging to add something from elsewhere on the page.
- Translate the words the popover and the announcements use, in `labels`. [Translation](../translation.md#scheduler) lists them.
