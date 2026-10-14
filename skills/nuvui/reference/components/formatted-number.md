<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/formatted-number.mdx. Don't edit it here: run `pnpm skill`. -->

# FormattedNumber

A number written the way a language and region write it, as plain digits, a currency, a percentage or a short form.

Use it wherever a number is shown to a person: a total, a price, a count in a table. It groups the digits, puts the currency sign where the region puts it, and keeps the digits one width so a column lines up.

```tsx
import { FormattedNumber } from "@nuvui/react";

export default function Example() {
  return (
    <dl
      style={{
        display: "grid",
        gridTemplateColumns: "auto auto",
        gap: "0.5rem 2rem",
        margin: 0,
      }}
    >
      <dt>Seats</dt>
      <dd style={{ margin: 0, textAlign: "end" }}>
        <FormattedNumber value={12480} />
      </dd>
      <dt>Revenue</dt>
      <dd style={{ margin: 0, textAlign: "end" }}>
        <FormattedNumber value={48250.5} currency="USD" />
      </dd>
      <dt>Conversion</dt>
      <dd style={{ margin: 0, textAlign: "end" }}>
        <FormattedNumber
          value={0.0734}
          format="percent"
          maximumFractionDigits={1}
        />
      </dd>
      <dt>Requests</dt>
      <dd style={{ margin: 0, textAlign: "end" }}>
        <FormattedNumber value={3_482_900} compact />
      </dd>
    </dl>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { FormattedNumber, formatNumber } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` (required) | `number` |  | The number. |
| `locale` | `string` | `"en-US"` | The language and region whose rules the number is written by, as a BCP 47 tag such as `"de-DE"`. It's `"en-US"` unless you say otherwise, and never the visitor's own: the server and the browser would then write two different texts for one page. |
| `format` | `"currency" \| "decimal" \| "percent"` | `"decimal"` | `"percent"` takes a ratio, so 0.25 is written as 25%. `"currency"` needs `currency`. |
| `currency` | `string` |  | The currency, as an ISO 4217 code such as `"EUR"`. Giving one is enough to get a currency: `format` can be left out. |
| `compact` | `boolean` | `false` | Writes a large number short, as in 1.2M. |
| `signDisplay` | `"always" \| "auto" \| "exceptZero" \| "never"` | `"auto"` | When the sign is written. `"exceptZero"` writes a plus on a gain, for a number that's a change. |
| `minimumFractionDigits` | `number` |  | The fewest digits after the decimal point. |
| `maximumFractionDigits` | `number` |  | The most digits after the decimal point. |
| `options` | `Intl.NumberFormatOptions` |  | Anything else `Intl.NumberFormat` takes, such as a unit. What's here wins over the props above. |

Everything else is passed to the `<data>` element, including `ref` and `className`. It takes no children: the text is the number.

## Languages and regions

`locale` is a BCP 47 tag. The same number and the same props give each region its own digits, separators and place for the currency.

```tsx
import { FormattedNumber } from "@nuvui/react";

const places = [
  { locale: "en-US", currency: "USD", name: "United States" },
  { locale: "de-DE", currency: "EUR", name: "Germany" },
  { locale: "fr-CH", currency: "CHF", name: "Switzerland, in French" },
  { locale: "en-IN", currency: "INR", name: "India" },
  { locale: "ja-JP", currency: "JPY", name: "Japan" },
];

export default function Example() {
  return (
    <dl
      style={{
        display: "grid",
        gridTemplateColumns: "auto auto",
        gap: "0.5rem 2rem",
        margin: 0,
      }}
    >
      {places.map(({ locale, currency, name }) => (
        <div key={locale} style={{ display: "contents" }}>
          <dt>{name}</dt>
          <dd style={{ margin: 0, textAlign: "end" }}>
            <FormattedNumber
              value={1234567.5}
              locale={locale}
              currency={currency}
            />
          </dd>
        </div>
      ))}
    </dl>
  );
}
```

The default is `"en-US"`, and not the visitor's own language. A page is written once on the server and again in the browser, and the two can disagree about the visitor's language. React then reports that the two texts don't match. Pass the locale your app already knows, from its router or its translation library, to every number.

## As text

`formatNumber` gives the same text as a string, with the same options. It's for the places a component can't go: an `aria-label`, the axis of a chart, a page's title.

```tsx
import { formatNumber, Progress } from "@nuvui/react";

const used = 37.4;
const total = 50;

export default function Example() {
  const unit = { options: { style: "unit", unit: "gigabyte" } } as const;

  return (
    <div style={{ display: "grid", gap: "0.5rem", width: "16rem" }}>
      <Progress
        value={(used / total) * 100}
        aria-label={`Storage: ${formatNumber(used, unit)} of ${formatNumber(total, unit)} used`}
      />
      <span>
        {formatNumber(used, unit)} of {formatNumber(total, unit)}
      </span>
    </div>
  );
}
```

A unit, as here, goes through `options`, which takes anything `Intl.NumberFormat` does.

## Accessibility

A number has no keyboard behavior. It isn't a control and can't take focus.

### What the component handles

- It's a `<data>` element, read in place with the text around it. Its `value` attribute holds the plain number for anything that reads the page by machine.
- The digits are one width each, so a number that updates doesn't move the text after it.
- The number stays on one line. A currency sign is never left alone at the end of one.

### What you need to handle

- A short form is read as it's written: a screen reader says "1.2 M", not "1.2 million". Where that matters, give the long form in an `aria-label`, written with `formatNumber` and `options={{ notation: "compact", compactDisplay: "long" }}`.
- Say what the number counts. "48,250" alone means nothing. A label, a table heading or the sentence around it has to say.
- A number that changes while the page is open isn't announced. If the change matters, say it in an element with `role="status"`.

## CSS variables

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-formatted-number-numeric` | `tabular-nums` | The `font-variant-numeric` of the digits. Set it to `normal` to give each digit its own width back, in running text set in a font whose even digits look loose. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-formatted-number` | Every formatted number. |

## Server components

FormattedNumber has no `"use client"` directive and uses no state, so it renders in a server component as it is. `formatNumber` is a plain function and runs anywhere.

## Do and don't

**Do**

- Pass the same `locale` to every number on a page.
- Use `compact` where room is short, and the full number where someone will act on it.

**Don't**

- Don't format a number yourself and then pass the text. The component needs the number.
- Don't use `format="percent"` on a number that's already a percentage. It takes a ratio: 0.25 for 25%.
