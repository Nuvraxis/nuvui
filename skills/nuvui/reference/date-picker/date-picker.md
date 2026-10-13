<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/date-picker/date-picker.mdx. Don't edit it here: run `pnpm skill`. -->

# DatePicker

A date field you can type into, with a button that opens a calendar. It works with a label, the keyboard and plain forms, and opens as a sheet on a phone.

Use a date picker for one date in a form: a due date, a start date, a delivery day. The date can be typed or picked, whichever is quicker for the person. For a first and a last day, use a [date range picker](date-range-picker.md).

```tsx
"use client";

import { DatePicker } from "@nuvui/date-picker";
import { Label } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 280,
      }}
    >
      <Label htmlFor="picker-due">Due date</Label>
      <DatePicker id="picker-due" />
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
import { DatePicker } from "@nuvui/date-picker";
```

The styles come from `@nuvui/date-picker/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Dates](index.md) covers that.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `Date \| null` |  | The picked date, or `null` for none. Use it with `onValueChange`. |
| `defaultValue` | `Date \| null` |  | The date picked to begin with. |
| `onValueChange` | `((date: Date \| null) => void)` |  | Called with the new date when one is picked or typed. |
| `name` | `string` |  | The name the date is submitted under, as `yyyy-MM-dd`. Without one, nothing is submitted. |
| `calendar` | `DatePickerCalendarProps` |  | More of the calendar's own options, such as `captionLayout` and `showWeekNumber`. |
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

Everything else goes to the text field, which is an `input`: `id`, `required`, `disabled`, `readOnly`, `placeholder`, `aria-label` and so on. The ref is the text field too. `className` and `style` go on the box around the field and the button.

## Typing a date

The field takes a date in the order the locale writes it. In the United States that's month, day, year, and the placeholder says so: `mm/dd/yyyy`.

- A date typed in full, such as `10/15/2026`, becomes the value at the last keystroke.
- A looser form is taken when the person leaves the field or presses <kbd>Enter</kbd>, and rewritten in full. `1/5/26` becomes `01/05/2026`.
- Text that isn't a date by then stays as it was typed, so that it can be corrected. The value becomes `null` and the field is marked invalid.
- Clearing the field clears the value.

A year of two digits is read as the nearest one to today, so `26` is 2026. To mean the year 26, write `0026`.

`format` sets another pattern, in [date-fns' tokens](https://date-fns.org/docs/format). `"yyyy-MM-dd"` suits a tool for people who work with data. `"P"`, the default, is the locale's own short date.

## Controlling it

`value` is a `Date`, or `null` for no date. `onValueChange` is called with one or the other.

```tsx
"use client";

import { DatePicker } from "@nuvui/date-picker";
import { Button, Label } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [date, setDate] = useState<Date | null>(null);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 280,
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <Label htmlFor="picker-start">Start date</Label>
        <DatePicker id="picker-start" value={date} onValueChange={setDate} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Button intent="secondary" onClick={() => setDate(new Date())}>
          Today
        </Button>
        <Button intent="ghost" onClick={() => setDate(null)}>
          Clear
        </Button>
      </div>
      <p style={{ margin: 0, fontSize: 14 }}>
        {date ? date.toDateString() : "No date picked."}
      </p>
    </div>
  );
}
```

Without `value`, the field keeps its own date, starting from `defaultValue`.

## Earliest, latest and days ruled out

`min` and `max` are the first and the last day allowed. `disabledDates` rules out more: a date, a list, a range, days of the week, or a function. All three apply to the calendar and to what's typed.

```tsx
"use client";

import { DatePicker } from "@nuvui/date-picker";
import { Label } from "@nuvui/react";

// Midnight at the start of today, and of the day 90 days on.
const today = new Date();
today.setHours(0, 0, 0, 0);
const last = new Date(today);
last.setDate(last.getDate() + 90);

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 280,
      }}
    >
      <Label htmlFor="picker-delivery">Delivery date</Label>
      <DatePicker
        id="picker-delivery"
        min={today}
        max={last}
        disabledDates={{ dayOfWeek: [0, 6] }}
        invalidMessage="Enter a weekday in the next 90 days."
      />
    </div>
  );
}
```

A typed date that isn't allowed is invalid in the same way as text that isn't a date. Say what is allowed, in `invalidMessage` and in the field's description, because the message is all the person gets.

## In a form

Give the field a `name` and it submits the date as `yyyy-MM-dd`. An empty field submits an empty value. The text field itself has no name, so what's typed isn't submitted a second time.

Inside a [field](../components/field.md), wrap the picker in `FieldControl`. The label, the description and the error are then tied to the text field.

```tsx
"use client";

import { DatePicker } from "@nuvui/date-picker";
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
  const [date, setDate] = useState<Date | null>(null);
  const [sent, setSent] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);
  const error = submitted && !date ? "Enter the date you start." : undefined;

  return (
    <form
      noValidate
      style={{ display: "grid", gap: 16, width: "100%", maxWidth: 280 }}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        const data = new FormData(event.currentTarget);
        setSent(date ? String(data.get("start")) : undefined);
      }}
    >
      <Field required>
        <FieldLabel>Start date</FieldLabel>
        <FieldControl>
          <DatePicker name="start" value={date} onValueChange={setDate} />
        </FieldControl>
        <FieldDescription>Your first day with us.</FieldDescription>
        <FieldError>{error}</FieldError>
      </Field>
      <Button type="submit">Save</Button>
      <output style={{ fontSize: 14 }}>
        {sent ? `Sent: start=${sent}` : null}
      </output>
    </form>
  );
}
```

The component works with the browser's own validation:

- `required` goes on the text field, so an empty one stops the form.
- Text that isn't a date gives the field a custom validity message, `invalidMessage`. A plain form with such text in it isn't submitted, and the browser shows the message.

A form with `noValidate`, as in the example and as a form library sets, doesn't do either. There the value is `null` for bad text, and your own check on the value decides what to say.

A form's reset button puts the field back to its `defaultValue`.

## Languages

A locale sets the language of the calendar and the order a date is typed in. The four strings the field adds are props. The placeholder is the pattern in date-fns' letters, `dd.mm.y` for German, so write one in the language too.

```tsx
"use client";

import { DatePicker } from "@nuvui/date-picker";
import { de } from "@nuvui/date-picker/locale";
import { Label } from "@nuvui/react";

export default function Example() {
  return (
    <div
      lang="de"
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 280,
      }}
    >
      <Label htmlFor="picker-termin">Termin</Label>
      <DatePicker
        id="picker-termin"
        locale={de}
        placeholder="TT.MM.JJJJ"
        calendarLabel="Datum wählen"
        title="Datum wählen"
        closeLabel="Schließen"
        invalidMessage="Geben Sie ein gültiges Datum ein."
      />
    </div>
  );
}
```

## Time zones

With `timeZone`, the day is a day in that place. The date you get back is midnight there, and the form value is the day there, whatever the browser's own zone is.

```tsx
"use client";

import { DatePicker } from "@nuvui/date-picker";
import { Label } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [date, setDate] = useState<Date | null>(null);

  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 280,
      }}
    >
      <Label htmlFor="picker-tokyo">Launch day in Tokyo</Label>
      <DatePicker
        id="picker-tokyo"
        timeZone="Asia/Tokyo"
        value={date}
        onValueChange={setDate}
      />
      <p style={{ margin: 0, fontSize: 14 }}>
        {date
          ? `Midnight in Tokyo is ${new Date(date.getTime()).toISOString()} in UTC.`
          : "No date picked."}
      </p>
    </div>
  );
}
```

[Dates](index.md#time-zones) says when to use it and how to pass `min` and `max`.

## More of the calendar

`calendar` takes the [calendar's](calendar.md) own options for the ones the picker doesn't set: `captionLayout`, `showWeekNumber`, `showOutsideDays`, `numberOfMonths`, `labels` and the rest.

```tsx
<DatePicker
  aria-label="Date of birth"
  max={new Date()}
  calendar={{ captionLayout: "dropdown", defaultMonth: new Date(1990, 0) }}
/>
```

## Width

The box fills its container. Set `--nuv-date-picker-width`, or a width on the element around it, to make it narrower.

## On small screens

Below 640 pixels wide, the calendar opens as a sheet across the bottom of the screen, with a heading and a close button. That's the [dialog](../components/dialog.md) from `@nuvui/react`. Wider than that, it opens in a [popover](../components/popover.md) under the field.

The box is 44 pixels tall on a touch screen and 40 with a mouse. The field's text is 16 pixels on a touch screen, because iOS zooms the page in when a field with smaller text takes focus. A day in the calendar is 44 pixels each way.

The field has no `inputMode`. A numeric keypad on a phone has no slash or dot to type between the numbers. People on a phone mostly use the button.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves from the field to the button, and on. |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | On the button, opens the calendar with focus on the picked day, or on today. |
| <kbd>Alt</kbd> with <kbd>↓</kbd> | In the field, opens the calendar. |
| <kbd>Enter</kbd> | In the field, takes what was typed. In a form it then submits. |
| Arrow keys and the rest | In the calendar, move between days. The [calendar's page](calendar.md#keyboard) lists them. |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | On a day, picks it, closes the calendar and puts focus back on the button. |
| <kbd>Esc</kbd> | Closes the calendar, keeps the date and puts focus back on the button. |

### What the component handles

- The field is a plain text `input`, so it's read, labelled and autofilled like any other.
- The button has `aria-haspopup="dialog"` and `aria-expanded`. Its name is `calendarLabel` followed by the picked date written out, such as "Choose date, Thursday, October 15th, 2026".
- The calendar opens in a dialog named by `title`. On a phone that's a modal sheet, and the page behind is hidden from screen readers while it's open.
- Focus moves into the calendar when it opens and back to the button when it closes, however it was closed.
- Text that isn't a date sets `aria-invalid` on the field and turns the box's edge to the danger color. That happens when the person leaves the field, not while they're still typing.
- The ring that shows keyboard focus goes around the whole box.
- The calendar only animates when the visitor hasn't asked for reduced motion.

### What you need to handle

- Give the field a name. Use a `<label>` whose `htmlFor` matches the picker's `id`, a [field](../components/field.md), or `aria-label`.
- The placeholder shows the pattern, and a placeholder goes away at the first keystroke. If people get the order wrong, put the pattern in the field's description as well.
- When a date is refused, say why in text. `aria-invalid` only says that something is wrong.
- Translate `calendarLabel`, `title`, `closeLabel` and `invalidMessage` with the rest of your interface, and pass a `locale`.

### What hasn't been checked

The tests check the roles, names and states that a browser passes on to a screen reader. What each screen reader then says hasn't been checked by a person.

## CSS variables

The box is an [input group](../components/input-group.md), and its variables apply here too: `--nuv-input-group-height`, `--nuv-input-group-border` and the rest. The panel is a popover, so `--nuv-popover-radius` and its other variables apply to it. These are the ones the date picker adds:

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-date-picker-width` | `100%` | Width of the box. Set a length to stop it filling its container. |
| `--nuv-date-picker-separator-fg` | `var(--color-muted-foreground)` | Color of the dash between the two fields of a range. |
| `--nuv-date-picker-icon-fg` | `var(--color-muted-foreground)` | Color of the calendar icon. |
| `--nuv-date-picker-padding` | `calc(var(--spacing) * 3)` | Space between the edge of the calendar's panel and the calendar. |

The panel renders at the end of `<body>`, so set `--nuv-date-picker-padding` and the [calendar's variables](calendar.md#css-variables) on `:root` or `body` to reach it.

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-date-picker` | The box around the field and the button. It also has nuv-input-group. |
| `.nuv-date-picker--range` | Added to the box of a DateRangePicker. |
| `.nuv-date-picker__button` | The button that opens the calendar. It also has nuv-input-group__button. |
| `.nuv-date-picker__popover` | The panel the calendar opens in next to the field. It also has nuv-popover. |
| `.nuv-date-picker__separator` | The dash between the two fields of a range. |
| `.nuv-date-picker__sheet` | The sheet the calendar opens in on a phone. It also has nuv-dialog. |

## Themed sections

The calendar's panel is rendered at the end of the page, so one opened from inside a `data-theme="dark"` section doesn't inherit that theme. Pass the section's element as `container` and it will.

## Do and don't

**Do**

- Put a visible label above the field.
- Let people type. Someone entering a date of birth knows it and doesn't want a calendar.
- Set `min` and `max` when only some dates make sense, and say which in the description.

**Don't**

- Don't make the field read-only to force people through the calendar. That's slower, and harder with a screen reader.
- Don't use one for a date and a time together. Add a separate field for the time.
- Don't use the placeholder as the label.
