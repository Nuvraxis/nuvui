# @nuvui/date-picker

A calendar, a date field and a date range field for [`@nuvui/react`](https://github.com/Nuvraxis/nuvui/tree/main/packages/ui). The calendar is [react-day-picker](https://daypicker.dev) with nuvui's styles, and the fields are built from nuvui's input group, popover and dialog.

This is early, and the package hasn't been released. See the [repository README](https://github.com/Nuvraxis/nuvui#readme) for where things stand.

```sh
pnpm add @nuvui/date-picker @nuvui/react
```

```tsx
import "@nuvui/react/styles.css";
import "@nuvui/date-picker/styles.css";
import { DatePicker } from "@nuvui/date-picker";

export default function Page() {
  return <DatePicker aria-label="Due date" name="due" />;
}
```

## What's in it

- `Calendar`: a month of days to pick from. One day, several, or a range.
- `DatePicker`: a field a date is typed into, with a button that opens a calendar. In a popover on a wide screen, and in a sheet on a phone. With a `name`, it submits the date as `yyyy-MM-dd`.
- `DateRangePicker`: a field for each end of a range, and one calendar for both.
- `@nuvui/date-picker/locale`: every locale react-day-picker has.
- `TZDate`, from `@date-fns/tz`, for days in a time zone other than the browser's.

`@nuvui/react` is a peer dependency. `react-day-picker`, `date-fns` and `@date-fns/tz` are installed with the package.

It's a package of its own so that an app which only wants buttons and dialogs doesn't have to install a date library.

Docs will live at https://nuvui.nuvraxis.com.

## License

MIT
