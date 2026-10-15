<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/animated-number.mdx. Don't edit it here: run `pnpm skill`. -->

# AnimatedNumber

A number that moves to its new value. The digits that change roll like a counter or pop in, and the rest stay still. It's still for anyone who asked for less motion.

Use an animated number for a figure that changes while someone is looking at it: a total that goes up as items are added, a count that's refreshed, a price that changes with the plan. The movement says the number changed, and roughly by how much. For a number that doesn't change on the page, use [FormattedNumber](formatted-number.md).

```tsx
"use client";

import { AnimatedNumber, Button } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [seats, setSeats] = useState(1280);

  return (
    <div style={{ display: "grid", gap: 16, justifyItems: "center" }}>
      <span style={{ fontSize: "var(--text-4xl)", fontWeight: 600 }}>
        <AnimatedNumber value={seats} />
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        <Button intent="secondary" onClick={() => setSeats((now) => now - 37)}>
          Remove 37
        </Button>
        <Button intent="secondary" onClick={() => setSeats((now) => now + 145)}>
          Add 145
        </Button>
      </div>
    </div>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { AnimatedNumber } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `format` | `"currency" \| "decimal" \| "percent"` | `"decimal"` | `"percent"` takes a ratio, so 0.25 is written as 25%. `"currency"` needs `currency`. |
| `value` (required) | `number` |  | The number. When it changes, the digits that differ move to it. |
| `animation` | `"pop" \| "roll"` | `"roll"` | How a digit that changes moves. `"roll"` turns it through the digits between, like a counter. `"pop"` lets the old digit rise out as the new one rises in, coming into focus. Either way it's still for anyone who asked for less motion. |
| `locale` | `string` | `"en-US"` | The language and region whose rules the number is written by, as a BCP 47 tag such as `"de-DE"`. It's `"en-US"` unless you say otherwise, and never the visitor's own: the server and the browser would then write two different texts for one page. |
| `currency` | `string` |  | The currency, as an ISO 4217 code such as `"EUR"`. Giving one is enough to get a currency: `format` can be left out. |
| `compact` | `boolean` | `false` | Writes a large number short, as in 1.2M. |
| `signDisplay` | `"always" \| "auto" \| "exceptZero" \| "never"` | `"auto"` | When the sign is written. `"exceptZero"` writes a plus on a gain, for a number that's a change. |
| `minimumFractionDigits` | `number` |  | The fewest digits after the decimal point. |
| `maximumFractionDigits` | `number` |  | The most digits after the decimal point. |
| `options` | `Intl.NumberFormatOptions` |  | Anything else `Intl.NumberFormat` takes, such as a unit. What's here wins over the props above. |

It's a `data` element, as `FormattedNumber` is, with the plain number in its `value`. It takes what a `data` element takes, including `ref` and `className`.

## Roll or pop

With `animation="roll"`, the default, each digit that changes turns through the digits between the old one and the new one, the way the number went: up through nine to zero when it rose, down when it fell. With `animation="pop"`, the old digit rises out of sight as the new one rises into place, coming into focus.

```tsx
"use client";

import { AnimatedNumber, Button } from "@nuvui/react";
import { useState } from "react";

const prices = [19, 24, 49];

export default function Example() {
  const [plan, setPlan] = useState(1);

  return (
    <div style={{ display: "grid", gap: 16, justifyItems: "center" }}>
      <span style={{ fontSize: "var(--text-4xl)", fontWeight: 600 }}>
        <AnimatedNumber
          value={prices[plan] ?? 0}
          animation="pop"
          currency="GBP"
          locale="en-GB"
          maximumFractionDigits={0}
        />
      </span>
      <Button
        intent="secondary"
        onClick={() => setPlan((now) => (now + 1) % prices.length)}
      >
        Next plan
      </Button>
    </div>
  );
}
```

Either way only the digits that changed move, from the left, each a moment after the one before. Separators, signs, currency symbols and the letters of a short form such as 1.2K stay where they are.

## What changes and what doesn't

The first value is drawn as it is. The page from the server has it, and nothing moves when the page opens. Only a change after that moves.

The number takes the width it ends at as soon as it changes, and keeps it while the digits move. With digits of one width, as the component gives them, a number with as many digits as before takes the same room, so nothing beside it moves.

## Languages and currencies

It writes the number as [FormattedNumber](formatted-number.md) does, with the same props: a language, a currency, a percentage, a short form. Any currency is given by its ISO 4217 code, such as `"EUR"`, `"GBP"` or `"JPY"`, and `locale` says how it's written: the sign before the number or after it, a comma or a point, and how many decimals the currency has. The sign stays where it is, and only the digits move.

```tsx
"use client";

import { AnimatedNumber, Button } from "@nuvui/react";
import { useState } from "react";

// One plan's price in four markets, each written the way its own
// customers write money: the sign before the number or after it, a comma
// or a point, and yen with no cents.
const markets = [
  { name: "Germany", currency: "EUR", locale: "de-DE", price: 49 },
  { name: "United Kingdom", currency: "GBP", locale: "en-GB", price: 42 },
  { name: "Japan", currency: "JPY", locale: "ja-JP", price: 7800 },
  { name: "India", currency: "INR", locale: "en-IN", price: 3999 },
];

export default function Example() {
  const [yearly, setYearly] = useState(false);

  return (
    <div style={{ display: "grid", gap: 16, justifyItems: "start" }}>
      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto",
          gap: "0.5rem 2rem",
          margin: 0,
        }}
      >
        {markets.map((market) => (
          <div key={market.name} style={{ display: "contents" }}>
            <dt>{market.name}</dt>
            <dd style={{ margin: 0, textAlign: "end", fontWeight: 600 }}>
              <AnimatedNumber
                value={yearly ? market.price * 10 : market.price}
                currency={market.currency}
                locale={market.locale}
              />
            </dd>
          </div>
        ))}
      </dl>
      <Button
        intent="secondary"
        aria-pressed={yearly}
        onClick={() => setYearly((now) => !now)}
      >
        Show yearly prices
      </Button>
    </div>
  );
}
```

The two have to agree with your customer, not with each other: a price in euros for someone in Ireland is `locale="en-IE"`, and for someone in Germany `locale="de-DE"`. In a language whose numbers have digits of their own, such as Arabic or Hindi, those are the digits that roll. In a language read from the right, the number is laid out the way the browser lays it out, and what moves is drawn over it.

## Saying that it changed

A screen reader doesn't read out a number because it changed. That's on purpose: a dashboard where every refresh was read out would be hard to use. For a number whose change someone needs to hear, such as the items in a cart, put it in an element with `aria-live="polite"`. It's read once, when the number has changed, and the moving digits aren't read at all.

```tsx
"use client";

import { AnimatedNumber, Button } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [items, setItems] = useState(2);

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Button onClick={() => setItems((now) => now + 1)}>Add to cart</Button>
      {/* Read out once, when the number has changed. */}
      <span aria-live="polite">
        <AnimatedNumber value={items} /> items in your cart
      </span>
    </div>
  );
}
```

## Accessibility

An animated number has no role and no keyboard behavior. It can't take focus.

### What the component handles

- The number is ordinary text, read as one number while it moves and after. What moves is a copy drawn over it, which is hidden from screen readers.
- A copy and paste gets the number once. The moving copy can't be selected.
- For a visitor who asked for less motion, the new number is there at once and nothing moves.
- Where the browser forces its own colors, the digits are drawn in the browser's text color while they move and after.
- Only position, opacity and a slight blur move. Nothing around the number is laid out again.

### What you need to handle

- Say a change out loud where it matters, with `aria-live` around it, as above.
- Don't change it every second. A number that never stops moving can't be read, and motion that goes on for more than five seconds beside other content is something WCAG asks for a way to stop.

## CSS variables

Set any of these on the `AnimatedNumber`, or on anything around it.

```css
.revenue {
  --nuv-animated-number-duration: 1.2s;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-animated-number-numeric` | `tabular-nums` | The digits' font-variant-numeric. Digits of one width keep a changing number from pushing what's next to it. |
| `--nuv-animated-number-to` |  | Where a rolling column stops. The component writes this. Don't set it. |
| `--nuv-animated-number-duration` | `800ms`, `500ms` | How long one digit takes to move. The first default is for roll, the second for pop. |
| `--nuv-animated-number-easing` | `var(--ease-out)` | How a digit speeds up and slows down. |
| `--nuv-animated-number-order` | `0` | Which of the digits that change this is, from the left. The component writes this. Don't set it. |
| `--nuv-animated-number-stagger` | `40ms` | How long each digit that changes waits after the one before it. |
| `--nuv-animated-number-from` |  | Where a rolling column starts. The component writes this. Don't set it. |
| `--nuv-animated-number-blur` | `0.12em` | With pop, how out of focus a digit is as it comes in or goes out. |
| `--nuv-animated-number-sign` | `1` | 1 for a digit that went up and -1 for one that went down, which turns pop over. Set by the component's stylesheet. |
| `--nuv-animated-number-rise` | `0.6em` | With pop, how far a digit travels as it comes in or goes out. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-animated-number` | AnimatedNumber. |
| `.nuv-animated-number--roll` | With animation="roll". |
| `.nuv-animated-number__digit` | A digit that moves, over its place. |
| `.nuv-animated-number__gap` | In the copy, the place a moving digit ends up. |
| `.nuv-animated-number__motion` | The copy that moves, over the text. Only there while it moves. |
| `.nuv-animated-number__new` | With pop, the digit that comes in. |
| `.nuv-animated-number__numeral` | With roll, one digit in the column. |
| `.nuv-animated-number__old` | With pop, the digit that leaves. |
| `.nuv-animated-number__reel` | With roll, the column of digits that turns. |
| `.nuv-animated-number__text` | The number as text. See-through while it moves. |

While it moves, the element has `data-state="moving"`, and `data-state="still"` otherwise. The copy has `data-direction`: `up` or `down`.

## Server components

AnimatedNumber starts with `"use client"`: it remembers the last number to move from it. It takes no functions, so a server component can render it, and the page from the server has the number written out.

## Do and don't

**Do**

- Use it for a figure that changes in front of someone, after they did something or when it's refreshed.
- Keep its format the same from one value to the next, so the places line up.

**Don't**

- Don't use it for a number that's only drawn once. There's nothing to move from.
- Don't put many on a screen that all change at once. Movement draws the eye, and twenty numbers moving together draw it nowhere.
