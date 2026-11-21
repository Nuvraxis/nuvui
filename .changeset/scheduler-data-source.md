---
"@nuvui/scheduler": minor
---

`EventCalendar` and `EventTimeline` take a `dataSource`, for events that live on a server. Its `getEvents` is called with a range of days, as `from` and `to` in the time zone shown and as `start` and `end` moments, with an `AbortSignal`, and only for days that haven't been loaded: moving to the next week asks for that week, and going back asks for nothing. What's loaded is kept. A new time zone loads the days again, and new functions start again from nothing, so the data source is best made once.

While the days shown load, the header says so with a spinner, and the view has `aria-busy`. A failed load says the events couldn't be loaded, with Try again.

Its `saveEvents` is called with what was `created`, `updated` and `deleted`, the changes made in the same moment together. A change is drawn at once, and taken back if the promise is rejected, which the header and a screen reader are told. It can resolve with the server's own version of what was sent, such as a new event's id. Without `saveEvents`, events open to be read, unless `onEventsChange` is passed.

The agenda, with empty days left out, loads the 180 days after the ones shown to find the next day with something on.

There are four new labels, `loading`, `loadFailed`, `tryAgain` and `saveFailed`, and two new classes, `nuv-event-calendar__status` and `nuv-event-calendar__status-text`. The types `EventDataSource`, `EventRange`, `EventChanges` and `SavedEvents` are exported.
