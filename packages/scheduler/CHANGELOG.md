# @nuvui/scheduler

## 0.5.1

### Patch Changes

- [#116](https://github.com/Nuvraxis/nuvui/pull/116) [`90e7570`](https://github.com/Nuvraxis/nuvui/commit/90e7570ebd750c5e4db8773dfe3d9058e9f36b43) Thanks [@sajanv88](https://github.com/sajanv88)! - A calendar or timeline on a page built ahead of time no longer makes React throw the page's HTML away when it's opened on another day. The server drew the day it was built, and the browser the day it was opened. Now, with no `date`, `defaultDate` or `today`, the days and the heading are hidden until the browser has the page, even with `timeZone` set. The server still draws them when it's told which day to show.

## 0.5.0

### Minor Changes

- [#114](https://github.com/Nuvraxis/nuvui/pull/114) [`fcd08cf`](https://github.com/Nuvraxis/nuvui/commit/fcd08cf3d053025988204354f4747ceeaeaaf322) Thanks [@sajanv88](https://github.com/sajanv88)! - `EventTimeline` is new: resources down the side, time across, and events as bars along their rows. A column is an hour, a day, a week, a month or a year, picked with `scale`, and `spans` says how much each shows at once. Resources inside another are rows under it that fold away, an event is drawn in the row of each of its resources, and those with none are in a row of their own. Only the rows and columns in view are drawn, so thousands of resources and years of days stay quick, and the grid still counts them all for a screen reader.
  
  It's edited the way the calendar is, with the same popover, dragging, keyboard and questions about repeating events. An event dragged to another row is given that row's resource in place of the one it left, and from the keyboard ↑ and ↓ move a picked-up event to the next resource. `renderResource` draws a row's header from your own resource object. It's also at `@nuvui/scheduler/event-timeline`, with its styles at `css/event-timeline.css`.
  
  `labels` has four more words, for the timeline's name, its scale switch and each scale, and its row of events with no resource. A translation written as a whole `SchedulerLabels` needs them added.
  
  The calendar's props are now shared with the timeline, with nothing about them changed but the wording of a few of their descriptions.

## 0.4.0

### Minor Changes

- [#112](https://github.com/Nuvraxis/nuvui/pull/112) [`e90d6d2`](https://github.com/Nuvraxis/nuvui/commit/e90d6d2352fb8afaeb4fc29ba0786ac3ad1cedce) Thanks [@sajanv88](https://github.com/sajanv88)! - EventCalendar draws events that repeat. An event's `recurrence` is an RRULE, such as `"FREQ=WEEKLY;BYDAY=MO,WE"`, or the same as an object: daily, weekly on chosen days, monthly on a date or a weekday in its week, or yearly, every so many, until a day or for so many times. `exceptions` lists the days it's left out. A rule is worked out on the event's own clock, in its `timeZone`, so it keeps its time across a change to or from summer time, and only for the days shown.
  
  Moving, resizing, saving or deleting an occurrence asks which of the series it's for. This event leaves it out of the series and makes it an event of its own. This and the following events ends the series the day before and starts a new one. All events changes the series. The first two are two changes, so `onEventsChange` is called twice. Deleting one that repeats always asks, and that's the confirmation.
  
  The popover has a field for how an event repeats, after its times, which `eventFields` can leave out with the rest: `"repeat"` is new among them, and on by default. An occurrence's name ends with "repeats", and its popover says how it repeats when it's read. A rule comes back the way it was given, as an RRULE or an object, and `eventKeys` can name `recurrence` and `exceptions`. `labels` has the words for all of it.

## 0.3.0

### Minor Changes

- [#109](https://github.com/Nuvraxis/nuvui/pull/109) [`cf45d37`](https://github.com/Nuvraxis/nuvui/commit/cf45d37c6ea3dad425774061a4a6ced523703031) Thanks [@sajanv88](https://github.com/sajanv88)! - EventCalendar takes resources, such as rooms or people, that events are booked against. An event lists its resources in `resourceIds`, and takes its color, `readOnly`, `draggable` and `resizable` from them when it doesn't say, and a resource inside another takes them from the one it's in. The side panel lists the resources, nested, each with a checkbox to show or hide its events and a button to fold those inside it. An event's popover has a resource to choose, or several with `multipleResources`, and `resourceRequired` makes every event need one. An event's name says its resources, and the agenda shows them.
  
  `eventKeys` and `resourceKeys` read events and resources from your own field names, and changes come back under the same names, with your other fields kept. `onEventsChange`, `onEditStart`, `onEventClick`, `onEventDropOutside` and `renderEventFields` are given your own objects.
  
  New props: `resources`, `resourceKeys`, `eventKeys`, `resourceRequired`, `multipleResources`, `hiddenResources`, `defaultHiddenResources`, `onHiddenResourcesChange`, `collapsedResources`, `defaultCollapsedResources` and `onCollapsedResourcesChange`. `eventFields` takes `"resource"`, and has it after the times by default. An item dragged in with `eventDragProps` can carry `resourceIds`. `labels` has the words for all of it.

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
