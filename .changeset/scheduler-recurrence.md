---
"@nuvui/scheduler": minor
---

EventCalendar draws events that repeat. An event's `recurrence` is an RRULE, such as `"FREQ=WEEKLY;BYDAY=MO,WE"`, or the same as an object: daily, weekly on chosen days, monthly on a date or a weekday in its week, or yearly, every so many, until a day or for so many times. `exceptions` lists the days it's left out. A rule is worked out on the event's own clock, in its `timeZone`, so it keeps its time across a change to or from summer time, and only for the days shown.

Moving, resizing, saving or deleting an occurrence asks which of the series it's for. This event leaves it out of the series and makes it an event of its own. This and the following events ends the series the day before and starts a new one. All events changes the series. The first two are two changes, so `onEventsChange` is called twice. Deleting one that repeats always asks, and that's the confirmation.

The popover has a field for how an event repeats, after its times, which `eventFields` can leave out with the rest: `"repeat"` is new among them, and on by default. An occurrence's name ends with "repeats", and its popover says how it repeats when it's read. A rule comes back the way it was given, as an RRULE or an object, and `eventKeys` can name `recurrence` and `exceptions`. `labels` has the words for all of it.
