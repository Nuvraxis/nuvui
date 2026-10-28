---
"@nuvui/scheduler": minor
---

EventCalendar is edited in place. A click or a drag on empty time makes an event, which opens in a popover with its title, times, color and description, to be saved, changed or deleted. Events are dragged to move them, across days and between the times and the all-day row, and by their ends to resize them, snapped to `step`. A finger holds an event to pick it up, and a tap shows Edit and Delete. From the keyboard, Space picks an event up, the arrows move it, Shift and an arrow change its length, and each step is said in a live region.

New props: `defaultEvents`, `onEventsChange`, `readOnly`, `creatable`, `createOn`, `defaultDuration`, `step`, `confirmDelete`, `eventFields`, `renderEventFields`, `onEditStart`, `onEventDropOutside` and `createId`. An event takes `readOnly`, `draggable` and `resizable`. `eventDragProps` makes an element of your own one that can be dragged onto the calendar as a new event. `labels` has the words for all of it.

What to do: `events` is now optional, and a calendar given `events` without `onEventsChange` opens an event to be read when it's pressed. To keep only your own handling of a press, call `preventDefault` on the details `onEditStart` is given. To let the calendar change your events, pass `onEventsChange` and keep what it gives you.
