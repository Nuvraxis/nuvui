<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/stepper.mdx. Don't edit it here: run `pnpm skill`. -->

# Stepper

Where someone is in a row of steps, with the ones that are done, the current one and the ones still to come, across or down.

Use a stepper to show progress through something with a known number of steps: setting up an account, checking out, an order on its way. It shows where things stand. Moving between steps is your app's.

```tsx
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperTitle,
} from "@nuvui/react";

const steps = ["Account", "Team", "Billing", "Review"];

export default function Example() {
  return (
    <Stepper value={3} aria-label="Setting up" style={{ inlineSize: "100%" }}>
      {steps.map((title, index) => (
        <StepperItem key={title} step={index + 1}>
          <StepperIndicator />
          <StepperContent>
            <StepperTitle>{title}</StepperTitle>
          </StepperContent>
        </StepperItem>
      ))}
    </Stepper>
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
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperTitle,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Stepper` | The list. An `ol`. It's told which step is current. |
| `StepperItem` | One step. An `li`. It's told which step it is. |
| `StepperIndicator` | The circle: the step's number, or a tick once it's done. |
| `StepperContent` | The title and the description. |
| `StepperTitle` | The step's name. |
| `StepperDescription` | More about it. |

`StepperItem` needs its indicator first and its content second.

## Props

### Stepper

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` (required) | `number` |  | The step someone is on, counted from 1. The steps before it are done, and the ones after it are still to come. One more than the last step means all of them are done. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | `"vertical"` stacks the steps, with their text beside them. Use it on a narrow screen, and wherever steps have descriptions. |
| `variant` | `"dot" \| "number"` | `"number"` | `"dot"` draws a small circle with nothing in it in place of the step's number. |
| `completedLabel` | `string` | `"Completed"` | What a screen reader says after the title of a step that's done. The tick is a picture. Translate it with the rest of your interface. |

### StepperItem

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `step` (required) | `number` |  | Which step this is, counted from 1. |

The other parts add no props of their own. Each takes what its element takes, including `ref` and `className`.

## Which step is current

`value` on the `Stepper` is the step someone is on, counted from 1, and `step` on each item is which one it is. An item works out the rest: before the value it's done, at the value it's current, after it it's still to come. One more than the last step means every step is done.

The stepper keeps no state. Your form, your router or your order's status decides the value, and the stepper draws it.

## Down the page

`orientation="vertical"` stacks the steps with their text beside them. It's the one to use on a narrow screen, and wherever steps have descriptions: across, four titles fit and four paragraphs don't.

```tsx
"use client";

import {
  Button,
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperTitle,
} from "@nuvui/react";
import { useState } from "react";

const steps = [
  { title: "Order placed", text: "We have your order and your payment." },
  { title: "Packed", text: "Two parcels, leaving from Rotterdam." },
  { title: "On its way", text: "With the carrier, due on Thursday." },
  { title: "Delivered", text: "Signed for at the front desk." },
];

export default function Example() {
  const [current, setCurrent] = useState(2);

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        inlineSize: "100%",
        maxInlineSize: 360,
      }}
    >
      <Stepper value={current} orientation="vertical" aria-label="Order 1042">
        {steps.map((step, index) => (
          <StepperItem key={step.title} step={index + 1}>
            <StepperIndicator />
            <StepperContent>
              <StepperTitle>{step.title}</StepperTitle>
              <StepperDescription>{step.text}</StepperDescription>
            </StepperContent>
          </StepperItem>
        ))}
      </Stepper>
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          intent="secondary"
          disabled={current === 1}
          onClick={() => setCurrent(current - 1)}
        >
          Back
        </Button>
        <Button
          disabled={current > steps.length}
          onClick={() => setCurrent(current + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
```

To switch at a breakpoint, render it twice and hide one with CSS, or read the width in your own code. The component doesn't change direction by itself, because where it should is a decision about your layout.

## Dots

`variant="dot"` draws a small circle with nothing in it, for a quiet row where the place in the order is enough.

```tsx
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperTitle,
} from "@nuvui/react";

const steps = ["Draft", "In review", "Approved", "Published"];

export default function Example() {
  return (
    <Stepper
      value={2}
      variant="dot"
      aria-label="Where the article is"
      style={{ inlineSize: "100%" }}
    >
      {steps.map((title, index) => (
        <StepperItem key={title} step={index + 1}>
          <StepperIndicator />
          <StepperContent>
            <StepperTitle>{title}</StepperTitle>
          </StepperContent>
        </StepperItem>
      ))}
    </Stepper>
  );
}
```

## An icon in the circle

Children of `StepperIndicator` replace the number and the tick. The circle keeps its look for each state, so an icon is filled over once the step is done unless you change it by state yourself.

## Going back to a step

The parts are plain elements. To let someone go back, put a link or a button in `StepperTitle` for the steps that are done. Keep steps that can't be reached yet as text.

## Accessibility

A stepper has no keyboard behavior of its own. Links and buttons you put in it work as they do anywhere.

### What the component handles

- It's an ordered list, so a screen reader says how many steps there are and where it is among them. The list says it's a list in so many words, because Safari stops treating a list as one once its numbers are styled away.
- The current step has `aria-current="step"`.
- A step that's done has "Completed" after its title, in the page and drawn for nobody. The tick is a picture.
- The circle is hidden from screen readers. The list already gives the step's number.
- The three states differ by shape as well as color: filled with a tick, a ring with a number, a ring in a quieter color. Where the browser forces its own colors the fill is gone, and the tick and the words still say which steps are done.
- The lines are borders, which are still drawn there.

### What you need to handle

- Name the list with `aria-label` or `aria-labelledby`, such as "Setting up".
- Translate `completedLabel`. [Translation](../translation.md) lists it.
- When the step changes, move focus to the new step's heading or its first field. A screen reader user isn't told that the stepper changed.
- An icon you put in the circle is hidden with it. Don't make it the only place something is said.

## On small screens

Across, each step takes an equal share of the width and its title wraps inside its share. Four short titles fit on a phone. More steps, longer titles or any description call for `orientation="vertical"`.

## CSS variables

Set any of these on the `Stepper`, or on anything around it.

```css
.checkout {
  --nuv-stepper-indicator-size: 1.5rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-stepper-fg` | `var(--color-foreground)` | Text color. |
| `--nuv-stepper-gap` | `calc(var(--spacing) * 2)`, `calc(var(--spacing) * 3)` | Space between the circle and the text. |
| `--nuv-stepper-space` | `calc(var(--spacing) * 2)`, `calc(var(--spacing) * 6)` | Space between one step and the next. Across, it's the room at each end of a line. Down, it's the room under a step's text. |
| `--nuv-stepper-indicator-size` | `2rem`, `0.875rem` | Width and height of the circle. The line and the text move with it. Smaller by default with variant="dot". |
| `--nuv-stepper-line-width` | `2px` | Thickness of the line and of the circle's edge. |
| `--nuv-stepper-line` | `var(--color-border)` | Color of the line after a step that isn't done. |
| `--nuv-stepper-line-complete` | `var(--color-primary)` | Color of the line after a step that's done. |
| `--nuv-stepper-indicator-border` | `var(--color-border-strong)`, `var(--color-primary)` | Border color of the circle. Differs by state. Keep it at 3:1 against the background. |
| `--nuv-stepper-indicator-radius` | `var(--radius-full)` | Corner radius of the circle. |
| `--nuv-stepper-indicator-bg` | `var(--color-surface)`, `var(--color-primary)` | Background color of the circle. Differs by state. |
| `--nuv-stepper-indicator-fg` | `var(--color-muted-foreground)`, `var(--color-surface-foreground)`, `var(--color-primary-foreground)` | Color of the number or the tick. Differs by state. |
| `--nuv-stepper-muted-fg` | `var(--color-muted-foreground)` | Color of the description, and of the title of a step still to come. Keep it at 4.5:1 against the background. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-stepper` | Stepper |
| `.nuv-stepper--dot` | variant="dot" |
| `.nuv-stepper--vertical` | orientation="vertical" |
| `.nuv-stepper__check` | The tick in the circle of a step that's done. |
| `.nuv-stepper__content` | StepperContent |
| `.nuv-stepper__description` | StepperDescription |
| `.nuv-stepper__indicator` | StepperIndicator |
| `.nuv-stepper__item` | StepperItem. The line is its `::after`. |
| `.nuv-stepper__status` | "Completed", drawn for nobody. |
| `.nuv-stepper__title` | StepperTitle |

A step's state is in a `data-state` attribute on its item: `complete`, `current` or `upcoming`. The direction is in `data-orientation` on the list.

## Server components

The stepper starts with `"use client"`: each step has to find out which one is current. You can still render it from a server component, with a number for `value`.

## Do and don't

**Do**

- Keep titles to a word or two.
- Show every step from the start, so people know how long it is.

**Don't**

- Don't use it for more than about six steps across. Group them, or go vertical.
- Don't use it for a history of what happened. That's a [timeline](timeline.md).
