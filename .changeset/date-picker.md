---
"@nuvui/date-picker": minor
---

A new package, `@nuvui/date-picker`, with `Calendar`, `DatePicker` and `DateRangePicker`. It's installed next to `@nuvui/react` and has a stylesheet of its own, `@nuvui/date-picker/styles.css`.

- `Calendar` picks one day, several, or a range. It's react-day-picker 10 with this library's styles.
- `DatePicker` is a field a date can be typed into, with a button that opens the calendar: in a popover, or in a sheet on a phone. With a `name` it submits the date as `yyyy-MM-dd`.
- `DateRangePicker` has a field for each end of the range and submits each under its own name.
- Locales come from `@nuvui/date-picker/locale`, and `timeZone` puts the days in a time zone other than the browser's.
