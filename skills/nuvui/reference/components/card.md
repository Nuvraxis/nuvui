<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/card.mdx. Don't edit it here: run `pnpm skill`. -->

# Card

A box with an edge that groups a title, some content and the actions that go with them.

Use a card to set one thing apart from the things around it: a plan, a server, a customer. A page of settings that all belong together doesn't need a card around each one. A heading and some space do that with less on the screen.

```tsx
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@nuvui/react";

export default function Example() {
  return (
    <Card style={{ width: "100%", maxWidth: 380 }}>
      <CardHeader>
        <CardTitle>Team plan</CardTitle>
        <CardDescription>Billed once a year, on 1 March.</CardDescription>
      </CardHeader>
      <CardContent>
        Twelve seats, four of them in use. Seats you don't use aren't charged
        until someone is invited to them.
      </CardContent>
      <CardFooter>
        <Button intent="secondary">Change plan</Button>
        <Button>Add seats</Button>
      </CardFooter>
    </Card>
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Card` | The box. |
| `CardHeader` | The title and description, with room at the end for an action. |
| `CardTitle` | The title. An `h3` unless you say otherwise. |
| `CardDescription` | A line under the title, in a paler color. |
| `CardAction` | Something to do with the whole card, at the end of the header. |
| `CardContent` | The body. |
| `CardFooter` | The buttons. |

Every part is optional. Leave out what a card doesn't need.

## Props

### CardTitle

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | Render the single child element instead of an `h3`, and give it the title's class and props. This is how you pick the heading level that fits the page. |

The other parts add no props of their own. Each takes what its element takes, including `ref` and `className`.

## The heading level

`CardTitle` renders an `h3`, which is right for a card under an `h2`. Where that isn't the level the page needs, pass `asChild` and put the right heading inside. It gets the title's look.

```tsx
<CardTitle asChild>
  <h2>Team plan</h2>
</CardTitle>
```

The level is about the page's outline, not about size. Screen reader users move through a page by its headings, and a level that skips or repeats sends them to the wrong place. The size is `--nuv-card-title-size`.

## An action in the header

`CardAction` goes inside `CardHeader` and sits at the end of it, level with the title. Use it for a status, a menu button or one small action that applies to the whole card.

```tsx
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@nuvui/react";

export default function Example() {
  return (
    <Card style={{ width: "100%", maxWidth: 380 }}>
      <CardHeader>
        <CardTitle>Production</CardTitle>
        <CardDescription>eu-west, deployed 12 minutes ago</CardDescription>
        <CardAction>
          <Badge intent="success">Healthy</Badge>
          <Button intent="ghost" size="sm">
            Logs
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        All 14 checks passed on the last deploy. The next one is scheduled for
        tonight.
      </CardContent>
    </Card>
  );
}
```

## Content that reaches the edges

The card has no padding at its sides. Each part has it instead. So anything you put straight inside `Card`, outside the parts, runs from edge to edge: a picture, a table, a list with dividers.

A picture at the top also needs the card's top padding gone and its corners clipped.

```tsx
import {
  AspectRatio,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@nuvui/react";

export default function Example() {
  return (
    <Card
      style={{
        width: "100%",
        maxWidth: 320,
        paddingBlockStart: 0,
        overflow: "hidden",
      }}
    >
      <AspectRatio ratio={16 / 9}>
        <div
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary), var(--color-success))",
          }}
        />
      </AspectRatio>
      <CardHeader>
        <CardTitle asChild>
          <h4>Quarterly report</h4>
        </CardTitle>
        <CardDescription>Updated on 4 July</CardDescription>
      </CardHeader>
    </Card>
  );
}
```

## On small screens

The padding is 16 pixels on a phone and 24 from the `sm` breakpoint up.

The footer's buttons stack on a phone, each as wide as the card, with the last one in the code on top. From the `sm` breakpoint they sit in a row at the end. Write the main action last, and it's on top on a phone and at the end of the row on a wider screen.

A long word in the title or the description breaks, so a card never grows wider than the room it has.

## Accessibility

A card has no keyboard behavior of its own. The buttons and links inside it work as they do anywhere.

### What the component handles

- The title is a heading, so the card shows up in the page's outline.
- The description is a paragraph.
- The edge is a border, which is still drawn where the browser forces its own colors, as Windows high contrast does.
- The description's color has at least 4.5:1 against the card in every theme.

### What you need to handle

- Pick the heading level that fits the page, with `asChild`.
- Don't make the whole card a link or a button with other controls inside it. A control inside a control can't be reached from the keyboard in every browser, and a screen reader reads the whole card as the link's name. Make the title the link.
- A card that's a region of the page people will want to jump to can be a `section` with `aria-labelledby` pointing at its title. Most cards don't need it.

## CSS variables

Set any of these on `Card`, or on anything around it.

```css
.dashboard {
  --nuv-card-padding: calc(var(--spacing) * 4);
  --nuv-card-shadow: none;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-card-gap` | `calc(var(--spacing) * 4)`, `calc(var(--spacing) * 6)` | Space between the header, the content and the footer. Larger from the sm breakpoint. |
| `--nuv-card-padding` | `calc(var(--spacing) * 4)`, `calc(var(--spacing) * 6)` | Padding at the top and bottom of the card, and at the sides of each part. Larger from the sm breakpoint. |
| `--nuv-card-border` | `var(--color-border)` | Border color. |
| `--nuv-card-radius` | `var(--radius-lg)` | Corner radius. |
| `--nuv-card-bg` | `var(--color-surface)` | Background color. |
| `--nuv-card-shadow` | `var(--shadow-xs)` | Shadow. Set it to none for a flat card. |
| `--nuv-card-fg` | `var(--color-surface-foreground)` | Text color. |
| `--nuv-card-title-size` | `var(--text-base)` | Font size of the title. |
| `--nuv-card-muted-fg` | `var(--color-muted-foreground)` | Color of the description. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-card` | Card. |
| `.nuv-card__action` | CardAction. |
| `.nuv-card__content` | CardContent. |
| `.nuv-card__description` | CardDescription. |
| `.nuv-card__footer` | CardFooter. |
| `.nuv-card__header` | CardHeader. |
| `.nuv-card__title` | CardTitle. |

## Server components

The card parts have no `"use client"` directive and use no state, so they render in a server component as they are.

## Do and don't

**Do**

- Give every card in a set the same parts in the same order.
- Keep one main action per card.

**Don't**

- Don't put a card inside a card. Use a [separator](separator.md) or a heading inside the one card.
- Don't use a card only to get a border around a whole page section.
