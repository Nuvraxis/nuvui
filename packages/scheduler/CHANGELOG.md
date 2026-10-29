# @nuvui/scheduler

## 0.2.0

### Minor Changes

- [#107](https://github.com/Nuvraxis/nuvui/pull/107) [`13827e4`](https://github.com/Nuvraxis/nuvui/commit/13827e47c1ef3a0aad970d28a7e2e61aac5e5ca8) Thanks [@sajanv88](https://github.com/sajanv88)! - EventCalendar is edited in place. A click or a drag on empty time makes an event, which opens in a popover with its title, times, color and description, to be saved, changed or deleted. Events are dragged to move them, across days and between the times and the all-day row, and by their ends to resize them, snapped to `step`. A finger holds an event to pick it up, and a tap shows Edit and Delete. From the keyboard, Space picks an event up, the arrows move it, Shift and an arrow change its length, and each step is said in a live region.
  
  New props: `defaultEvents`, `onEventsChange`, `readOnly`, `creatable`, `createOn`, `defaultDuration`, `step`, `confirmDelete`, `eventFields`, `renderEventFields`, `onEditStart`, `onEventDropOutside` and `createId`. An event takes `readOnly`, `draggable` and `resizable`. `eventDragProps` makes an element of your own one that can be dragged onto the calendar as a new event. `labels` has the words for all of it.
  
  What to do: `events` is now optional, and a calendar given `events` without `onEventsChange` opens an event to be read when it's pressed. To keep only your own handling of a press, call `preventDefault` on the details `onEditStart` is given. To let the calendar change your events, pass `onEventsChange` and keep what it gives you.

## 0.1.0

### Minor Changes

- [#105](https://github.com/Nuvraxis/nuvui/pull/105) [`20f9c69`](https://github.com/Nuvraxis/nuvui/commit/20f9c696f944c91c1fd84fef58f5357f18bf46c0) Thanks [@sajanv88](https://github.com/sajanv88)! - A new package, for an event calendar.
  
  - `EventCalendar` shows events in a day, a week, a month or an agenda, with a header to move through them, a switch between the views and a side panel with a month to pick a day from.
  - Events that overlap are set side by side on the day and week views. Events that take whole days, or a day or longer, are bars across their days. A full day in a month shows what fits and a button for the rest.
  - Events are drawn in one time zone, the browser's or `timeZone`. A date written without a zone is a time on the clock, in the event's own `timeZone` when it has one, and stays at that time across a change to or from summer time.
  - `hours` shows only part of the day, and `scrollToHour` is where the day and week views open.
  - A preferences menu changes 12 or 24 hours, weekends, week numbers, the first day of the week and empty days in the agenda, each of which can be held by the app.
  - The grids move with the arrow keys, with one cell at a time in the tab order. Every event is a button named by its title, its time and its days, and the heading with the dates is a live region.
  - Narrower than 640 pixels the week shows three days and the views are a menu, and narrower than 1024 the side panel opens over the days.
  - `date-fns` and `@date-fns/tz` are dependencies. `@nuvui/date-picker` is a peer dependency, for the month in the side panel.

### Patch Changes

- Updated dependencies [[`20f9c69`](https://github.com/Nuvraxis/nuvui/commit/20f9c696f944c91c1fd84fef58f5357f18bf46c0)]:
  - @nuvui/react@0.10.0
  - @nuvui/date-picker@0.1.10
