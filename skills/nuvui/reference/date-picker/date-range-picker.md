<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/date-picker/date-range-picker.mdx. Don't edit it here: run `pnpm skill`. -->

# DateRangePicker

Two date fields in one box, for the first and the last day, with one calendar that picks both. Each day can be typed, and each is submitted under its own name.

Use a date range picker for a span of days: a stay, a reporting period, the dates of a leave request. It's a [date picker](date-picker.md) with two fields, and most of that page applies here.

```tsx
"use client";

import { DateRangePicker } from "@nuvui/date-picker";
import { Label } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 340,
      }}
    >
      <Label id="range-stay-label" htmlFor="range-stay">
        Stay
      </Label>
      <DateRangePicker id="range-stay" aria-labelledby="range-stay-label" />
    </div>
  );
}
```

## Install

```sh
pnpm add @nuvui/date-picker @nuvui/react
```

## Import

```tsx
import { DateRangePicker } from "@nuvui/date-picker";
```

The styles come from `@nuvui/date-picker/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Dates](index.md) covers that.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `DateRange \| null` |  | The picked range, or `null` for none. Use it with `onValueChange`. |
| `defaultValue` | `DateRange \| null` |  | The range picked to begin with. |
| `onValueChange` | `((range: DateRange \| null) => void)` |  | Called with the new range when a day is picked or typed. While only the first day has been chosen, `to` is `undefined`. |
| `startName` | `string` |  | The name the first day is submitted under, as `yyyy-MM-dd`. |
| `endName` | `string` |  | The name the last day is submitted under, as `yyyy-MM-dd`. |
| `startLabel` | `string` | `"Start date"` | Accessible name of the field for the first day. |
| `endLabel` | `string` | `"End date"` | Accessible name of the field for the last day. |
| `orderMessage` | `string` | `"The end date is before the start date."` | What the browser is told when the last day comes before the first. |
| `numberOfMonths` | `number` | `2` | How many months the calendar shows side by side. On a phone it's always one. |
| `calendar` | `DateRangePickerCalendarProps` |  | More of the calendar's own options. `min` and `max` here are the fewest and the most days the range may span. |
| `open` | `boolean` |  | Whether the calendar is open. Use it with `onOpenChange`. |
| `defaultOpen` | `boolean` | `false` | Whether the calendar starts out open. |
| `onOpenChange` | `((open: boolean) => void)` |  | Called when the calendar opens or closes. |
| `min` | `Date` |  | The earliest day that can be picked or typed. |
| `max` | `Date` |  | The latest day that can be picked or typed. |
| `disabledDates` | `Matcher[] \| Matcher` |  | Days that can't be picked or typed: a date, a list of them, a range, `{ dayOfWeek: [0, 6] }` for weekends, or a function that's given a date. |
| `locale` | `CalendarLocale` | `enUS` | The language of the calendar, and the order a typed date is read in. Take one from `@nuvui/date-picker/locale`. |
| `weekStartsOn` | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6` |  | The day a week starts on, from 0 for Sunday. Left out, it's the locale's. |
| `timeZone` | `string` |  | The time zone the days are in, as an IANA name such as `"Asia/Tokyo"`. Left out, it's the browser's. Dates are then handed back as `TZDate`s. |
| `format` | `string` | `"P"` | The pattern a typed date is read and written in, in date-fns' tokens. `"P"` is the locale's own short date, `MM/dd/yyyy` in the United States. |
| `invalidMessage` | `string` | `"Enter a valid date."` | What the browser is told when the text isn't a date, or is one that can't be picked. It's shown when a form with the field is submitted. |
| `calendarLabel` | `string` | `"Choose date"` | Accessible name of the button that opens the calendar. The picked date is read after it. |
| `title` | `string` | `"Choose date"` | Accessible name of the calendar's panel, and the heading of the sheet it opens in on a phone. |
| `closeLabel` | `string` | `"Close"` | Accessible name of the sheet's close button. |
| `form` | `string` |  | The `id` of the form the value belongs to, when the field is outside it. |
| `container` | `DocumentFragment \| Element \| null` | `document.body` | The element the calendar is rendered into. Set this when it should pick up a `data-theme` from a section of the page. |

Everything else goes to both text fields, apart from `id`, which goes to the first, and `aria-label` and `aria-labelledby`, which name the group around the two. The ref is the first field.

## The value

The value is an object with the two days, or `null` for none:

```ts
{ from: Date | undefined, to: Date | undefined }
```

`onValueChange` is called each time either day changes. After the first press in the calendar, `to` is still `undefined`. Check for both before using the range.

## Picking a range

The first press in the calendar sets the first day, and the calendar stays open. The second sets the last day and closes it. If the second day is earlier than the first, the two swap.

With a whole range already picked, the next press starts a new one. It doesn't move the nearer end. That keeps it clear when someone has finished: the calendar closes on the press that completes a range, and only then.

The calendar shows two months side by side. `numberOfMonths` changes that, and on a phone it's always one.

## Typing a range

Each field takes a date the way a [date picker's](date-picker.md#typing-a-date) does. A last day that's before the first is refused, and so is a first day after the last. The field that was typed in is marked invalid, with `orderMessage` as the browser's message.

## In a form

`startName` and `endName` are the names the two days are submitted under, each as `yyyy-MM-dd`.

Inside a [field](../components/field.md), wrap the picker in `FieldControl`. The label names the group, a click on it goes to the first field, and the description and the error are read with both.

```tsx
"use client";

import { type DateRange, DateRangePicker } from "@nuvui/date-picker";
import {
  Button,
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [range, setRange] = useState<DateRange | null>(null);
  const [sent, setSent] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);
  const complete = Boolean(range?.from && range.to);
  const error = submitted && !complete ? "Enter both dates." : undefined;

  return (
    <form
      noValidate
      style={{ display: "grid", gap: 16, width: "100%", maxWidth: 340 }}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        const data = new FormData(event.currentTarget);
        setSent(
          complete
            ? `from=${data.get("from")} to=${data.get("to")}`
            : undefined,
        );
      }}
    >
      <Field required>
        <FieldLabel>Report period</FieldLabel>
        <FieldControl>
          <DateRangePicker
            startName="from"
            endName="to"
            max={new Date()}
            value={range}
            onValueChange={setRange}
          />
        </FieldControl>
        <FieldDescription>Up to today.</FieldDescription>
        <FieldError>{error}</FieldError>
      </Field>
      <Button type="submit">Run report</Button>
      <output style={{ fontSize: 14 }}>{sent ? `Sent: ${sent}` : null}</output>
    </form>
  );
}
```

`required` goes on both text fields. As with a date picker, a form with `noValidate` leaves the checking to you.

## The length of a range

`min`, `max` and `disabledDates` limit which days can be picked, as on a date picker. How long the range may be is a calendar option: `calendar={{ min: 2, max: 14 }}` allows from two to fourteen days between the ends.

```tsx
"use client";

import { DateRangePicker } from "@nuvui/date-picker";
import { Label } from "@nuvui/react";

const today = new Date();
today.setHours(0, 0, 0, 0);

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 340,
      }}
    >
      <Label id="range-trip-label" htmlFor="range-trip">
        Trip
      </Label>
      <DateRangePicker
        id="range-trip"
        aria-labelledby="range-trip-label"
        min={today}
        startLabel="Check-in"
        endLabel="Check-out"
        // At least two nights and at most fourteen.
        calendar={{ min: 2, max: 14 }}
      />
    </div>
  );
}
```

A second press that would make the range too short or too long starts a new range from that day. `excludeDisabled`, also in `calendar`, does the same for a range that would run across a day that can't be picked.

The length isn't checked for typed dates. Check it in your own validation, where you can also say what the limit is.

## On small screens

Both fields, the dash and the button fit a 360 pixel phone with the usual margins, with a date such as `10/15/2026` in each. A longer `format` needs more room. Give the picker a line to itself there.

The calendar opens as a sheet with one month in it. The box is 44 pixels tall on a touch screen and 40 with a mouse.

## Accessibility

### Keyboard

The keys are the [date picker's](date-picker.md#keyboard). <kbd>Tab</kbd> goes through the first field, the second field and the button. In the calendar, the first <kbd>Enter</kbd> on a day sets the first day and the second sets the last.

### What the component handles

- The box has `role="group"` and takes the label's name. The two fields inside are named by `startLabel` and `endLabel`, so a screen reader says "Stay, group", then "Start date" and "End date".
- The button's name is `calendarLabel` followed by the days that are picked, written out.
- The calendar's grid has `aria-multiselectable`, and every day in the range has `aria-selected`.
- The days between the two ends are joined by a fill. Where the browser forces its own colors, that fill is the system's color for something selected.
- The dash between the fields is hidden from screen readers.

### What you need to handle

- Give the group a name: a [field](../components/field.md), or `aria-label`. With a plain `<label>`, point `htmlFor` at the picker's `id` and name the group with `aria-labelledby`, as the first example does.
- Translate `startLabel`, `endLabel`, `orderMessage` and the strings a date picker has.
- When a range is refused for its length, say what's allowed in text.

### What hasn't been checked

The tests check the roles, names and states that a browser passes on to a screen reader. What each screen reader then says hasn't been checked by a person.

## CSS variables and classes

They're the [date picker's](date-picker.md#css-variables). The box has `nuv-date-picker--range` as well, and `--nuv-date-picker-separator-fg` colors the dash.

## Do and don't

**Do**

- Name the two fields for what they are: "Check-in" and "Check-out" say more than "Start date" and "End date".
- Set `max` to today for a report on the past, and `min` to today for a booking.
- Say how long a range may be before people pick one.

**Don't**

- Don't use one where the two dates aren't a span, such as a date of issue and a date of expiry years apart. Two date pickers are clearer.
- Don't treat a range with only its first day as finished. `to` is `undefined` until the second day is picked.
