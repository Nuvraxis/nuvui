<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/choice-card.mdx. Don't edit it here: run `pnpm skill`. -->

# ChoiceCard

A checkbox or a radio button drawn as a card, with room for a title and a description, where the whole card can be pressed.

Use choice cards where each option needs a few words to explain it: plans, add-ons, ways to pay. `RadioCard` is for one of several and `CheckboxCard` for any number. For options that are a word each, a plain [radio group](radio-group.md) or [checkbox](checkbox.md) takes less room.

```tsx
import {
  ChoiceCardDescription,
  ChoiceCardTitle,
  RadioCard,
  RadioGroup,
} from "@nuvui/react";

const plans = [
  { value: "starter", name: "Starter", text: "Up to 5 people. $0 a month." },
  { value: "team", name: "Team", text: "Up to 50 people. $12 a seat." },
  {
    value: "enterprise",
    name: "Enterprise",
    text: "Any number of people, single sign-on and an audit log.",
  },
];

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 420 }}>
      <span
        id="choice-plan-label"
        style={{ display: "block", marginBottom: 8 }}
      >
        Plan
      </span>
      <RadioGroup
        defaultValue="team"
        aria-labelledby="choice-plan-label"
        style={{ display: "grid", gap: 8 }}
      >
        {plans.map((plan) => (
          <RadioCard key={plan.value} value={plan.value}>
            <ChoiceCardTitle>{plan.name}</ChoiceCardTitle>
            <ChoiceCardDescription>{plan.text}</ChoiceCardDescription>
          </RadioCard>
        ))}
      </RadioGroup>
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
import {
  CheckboxCard,
  ChoiceCardDescription,
  ChoiceCardTitle,
  RadioCard,
  RadioGroup,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `RadioCard` | A card with a radio button in it. It goes in a `RadioGroup`. |
| `CheckboxCard` | A card with a checkbox in it. It stands alone. |
| `ChoiceCardTitle` | The choice's name, which names the control. |
| `ChoiceCardDescription` | More about it, which a screen reader reads after the name. |

A card can hold anything else as well: a price, a badge, an icon.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `indicator` | `"end" \| "start"` | `"start"` | Which end of the card the checkbox or the radio button is at. |
| `children` | `ReactNode` |  | The card's content: a `ChoiceCardTitle`, and anything else. |

`RadioCard` also takes everything a [`RadioGroupItem`](radio-group.md) does, such as `value` and `disabled`, and `CheckboxCard` everything a [`Checkbox`](checkbox.md) does, such as `checked`, `defaultChecked`, `onCheckedChange`, `name` and `disabled`. `ref` is the control's. `className` goes on the card.

## One of several

`RadioCard`s go in a [`RadioGroup`](radio-group.md), which holds the value, the name for a form and the arrow keys. The group lays its children out in a column. Give it a grid of your own for cards side by side.

## Any number

A `CheckboxCard` is a checkbox with a card around it, and each one stands alone. Group related ones in a `fieldset` with a `legend`, which is what names them together.

```tsx
import {
  CheckboxCard,
  ChoiceCardDescription,
  ChoiceCardTitle,
} from "@nuvui/react";

const addOns = [
  {
    name: "sso",
    title: "Single sign-on",
    text: "Sign in through your identity provider.",
    on: true,
  },
  {
    name: "audit",
    title: "Audit log",
    text: "Who changed what, kept for a year.",
    on: false,
  },
  {
    name: "support",
    title: "Priority support",
    text: "An answer within four working hours.",
    on: false,
    disabled: true,
  },
];

export default function Example() {
  return (
    <fieldset
      style={{
        display: "grid",
        gap: 8,
        gridTemplateColumns: "repeat(auto-fit, minmax(min(12rem, 100%), 1fr))",
        inlineSize: "100%",
        margin: 0,
        padding: 0,
        border: 0,
      }}
    >
      <legend style={{ marginBottom: 8, padding: 0 }}>Add-ons</legend>
      {addOns.map((addOn) => (
        <CheckboxCard
          key={addOn.name}
          name={addOn.name}
          defaultChecked={addOn.on}
          disabled={addOn.disabled}
          indicator="end"
        >
          <ChoiceCardTitle>{addOn.title}</ChoiceCardTitle>
          <ChoiceCardDescription>{addOn.text}</ChoiceCardDescription>
        </CheckboxCard>
      ))}
    </fieldset>
  );
}
```

Here `indicator="end"` puts the checkbox at the far end of the card.

## Accessibility

The keys are the control's own. A radio card is reached with Tab and changed with the arrow keys. A checkbox card is reached with Tab and changed with Space.

### What the component handles

- The card is a `label`, so pressing anywhere on it presses the control.
- The control is named by the `ChoiceCardTitle` and described by the `ChoiceCardDescription`. A screen reader says "Team, radio button, 2 of 3", then "Up to 50 people", and doesn't run the two together as one long name.
- With no `ChoiceCardTitle`, the control is named by everything in the card.
- A chosen card has a thicker edge in the primary color. The checkbox or the radio button inside says the same thing without color, and where the browser forces its own colors.
- The card's edge has at least 3:1 against the page in every theme.
- A disabled card fades as a whole and can't be pressed.

### What you need to handle

- Name the group: `aria-labelledby` on a `RadioGroup`, a `legend` in a `fieldset` of checkbox cards.
- Don't put a link or a button in a card. Pressing it would press the card as well.

## On small screens

A card is at least 44 pixels tall with one line in it, and the whole of it takes a tap. Stack cards in one column on a phone: side by side, descriptions wrap into tall narrow cards.

## CSS variables

Set any of these on a card, or on anything around it.

```css
.plans {
  --nuv-choice-card-padding: calc(var(--spacing) * 6);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-choice-card-gap` | `calc(var(--spacing) * 3)` | Space between the control and the content. |
| `--nuv-choice-card-padding` | `calc(var(--spacing) * 4)` | Padding of the card. |
| `--nuv-choice-card-border` | `var(--color-border-strong)` | Border color. Keep it at 3:1 against the background: it's what says the card is a control. |
| `--nuv-choice-card-radius` | `var(--radius-lg)` | Corner radius. |
| `--nuv-choice-card-bg` | `var(--color-surface)` | Background color. |
| `--nuv-choice-card-fg` | `var(--color-surface-foreground)` | Text color. |
| `--nuv-choice-card-hover-bg` | `var(--color-muted)` | Background color under the pointer. |
| `--nuv-choice-card-checked-border` | `var(--color-primary)` | Color of a chosen card's edge, which is twice as thick. |
| `--nuv-choice-card-muted-fg` | `var(--color-muted-foreground)` | Color of the description. Keep it at 4.5:1 against the background. |

The control inside keeps its own variables: [`--nuv-checkbox-*`](checkbox.md#css-variables) and [`--nuv-radio-group-*`](radio-group.md#css-variables).

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-choice-card` | Every card. A `label`. |
| `.nuv-choice-card--end` | indicator="end" |
| `.nuv-choice-card__body` | The box around the card's content. |
| `.nuv-choice-card__control` | The checkbox or the radio button, next to its own class. |
| `.nuv-choice-card__description` | ChoiceCardDescription |
| `.nuv-choice-card__title` | ChoiceCardTitle |

## Server components

All four parts start with `"use client"`. You can render them from a server component with server-rendered content inside. `onCheckedChange` needs a client component.

## Do and don't

**Do**

- Keep every card in a set to the same parts, in the same order.
- Choose one for people when there's a sensible default, as with a plan.

**Don't**

- Don't use cards for a long list. Past six or so, a [select](select.md) or a [combobox](combobox.md) is easier to scan.
- Don't hide what a choice costs or does behind the card. Say it in the description.
