---
"@nuvui/scheduler": minor
---

A new package, for an event calendar.

- `EventCalendar` shows events in a day, a week, a month or an agenda, with a header to move through them, a switch between the views and a side panel with a month to pick a day from.
- Events that overlap are set side by side on the day and week views. Events that take whole days, or a day or longer, are bars across their days. A full day in a month shows what fits and a button for the rest.
- Events are drawn in one time zone, the browser's or `timeZone`. A date written without a zone is a time on the clock, in the event's own `timeZone` when it has one, and stays at that time across a change to or from summer time.
- `hours` shows only part of the day, and `scrollToHour` is where the day and week views open.
- A preferences menu changes 12 or 24 hours, weekends, week numbers, the first day of the week and empty days in the agenda, each of which can be held by the app.
- The grids move with the arrow keys, with one cell at a time in the tab order. Every event is a button named by its title, its time and its days, and the heading with the dates is a live region.
- Narrower than 640 pixels the week shows three days and the views are a menu, and narrower than 1024 the side panel opens over the days.
- `date-fns` and `@date-fns/tz` are dependencies. `@nuvui/date-picker` is a peer dependency, for the month in the side panel.
