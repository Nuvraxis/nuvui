---
"@nuvui/scheduler": minor
---

`EventTimeline` is new: resources down the side, time across, and events as bars along their rows. A column is an hour, a day, a week, a month or a year, picked with `scale`, and `spans` says how much each shows at once. Resources inside another are rows under it that fold away, an event is drawn in the row of each of its resources, and those with none are in a row of their own. Only the rows and columns in view are drawn, so thousands of resources and years of days stay quick, and the grid still counts them all for a screen reader.

It's edited the way the calendar is, with the same popover, dragging, keyboard and questions about repeating events. An event dragged to another row is given that row's resource in place of the one it left, and from the keyboard ↑ and ↓ move a picked-up event to the next resource. `renderResource` draws a row's header from your own resource object. It's also at `@nuvui/scheduler/event-timeline`, with its styles at `css/event-timeline.css`.

`labels` has four more words, for the timeline's name, its scale switch and each scale, and its row of events with no resource. A translation written as a whole `SchedulerLabels` needs them added.

The calendar's props are now shared with the timeline, with nothing about them changed but the wording of a few of their descriptions.
