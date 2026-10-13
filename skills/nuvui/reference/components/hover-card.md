<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/hover-card.mdx. Don't edit it here: run `pnpm skill`. -->

# Hover card

A card with a preview of where a link leads, shown when the pointer rests on the link. It doesn't appear on touch screens.

Use a hover card to show a little about what's behind a link before someone follows it: who a name refers to, what a document is about. Everything in the card should also be on the page the link leads to.

Hover cards don't show on touch screens, where there's no hover, and the keyboard can't reach inside one. Never put anything in one that people need.

```tsx
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@nuvui/react";

export default function Example() {
  return (
    <p style={{ margin: 0, fontSize: 14 }}>
      Reviewed by{" "}
      <HoverCard>
        <HoverCardTrigger href="/docs" style={{ textDecoration: "underline" }}>
          Ada Lovelace
        </HoverCardTrigger>
        <HoverCardContent>
          <strong>Ada Lovelace</strong>
          <p style={{ margin: 0, color: "var(--color-muted-foreground)" }}>
            Staff engineer, Payments. Joined in March 2021.
          </p>
        </HoverCardContent>
      </HoverCard>{" "}
      on 3 October.
    </p>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `HoverCard` | Holds the open state and the timing. Renders nothing itself. |
| `HoverCardTrigger` | The link the card belongs to. It renders an `a`, and takes `href` like one. |
| `HoverCardContent` | The card. |

These are separate exports, not properties of `HoverCard`. `HoverCard.Content` isn't available, because property access on a client component doesn't work from a server component.

## Props

### HoverCardContent

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `sideOffset` | `number` | `8` | The gap between the trigger and the card, in pixels. |
| `collisionPadding` | `number \| Partial<Record<"bottom" \| "left" \| "right" \| "top", number>>` | `8` | How close the card may get to the edge of the screen, in pixels. It moves or flips to keep this much room. |
| `container` | `DocumentFragment \| Element \| null` | `document.body` | The element the card is rendered into. Set this when the card should pick up a `data-theme` from a section of the page. |

These come from Radix and are the ones you're most likely to set:

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `side` | `"bottom" \| "left" \| "right" \| "top"` |  | The side of the link the card opens on. It's `"bottom"` unless you say otherwise, and it flips to the opposite side when there isn't room. |
| `align` | `"center" \| "end" \| "start"` |  | How the card lines up with the link along that side. It's `"center"` unless you say otherwise. |

### HoverCard

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `openDelay` | `number` |  | How long the pointer has to rest on the link before the card shows, in milliseconds. It's 700 unless you say otherwise. |
| `closeDelay` | `number` |  | How long the card stays after the pointer leaves, in milliseconds. It's 300 unless you say otherwise. |
| `open` | `boolean` |  | Whether it's showing, when you control it yourself. Use it with `onOpenChange`. |
| `defaultOpen` | `boolean` |  | Whether it starts out showing, when you don't control it. |
| `onOpenChange` | `((open: boolean) => void)` |  | Called when it shows or hides. |

`HoverCardTrigger` takes what an `a` takes, and `asChild` to render your router's link in its place. The [Radix Hover Card reference](https://www.radix-ui.com/primitives/docs/components/hover-card#api-reference) has the full list.

## Sides

```tsx
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@nuvui/react";

const sides = ["top", "right", "bottom", "left"] as const;

export default function Example() {
  return (
    <>
      {sides.map((side) => (
        <HoverCard key={side}>
          <HoverCardTrigger
            href="/docs"
            style={{ fontSize: 14, textDecoration: "underline" }}
          >
            {side}
          </HoverCardTrigger>
          <HoverCardContent side={side}>
            Asked to open on the {side}. It moves to another side when there
            isn't room on this one.
          </HoverCardContent>
        </HoverCard>
      ))}
    </>
  );
}
```

## Timing

The card waits 700 milliseconds before it shows, so that it doesn't flash up under a pointer that's only passing over. It stays for 300 after the pointer leaves, which is what lets the pointer cross the gap from the link to the card.

```tsx
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@nuvui/react";

export default function Example() {
  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger
        href="/docs/theming"
        style={{ fontSize: 14, textDecoration: "underline" }}
      >
        Theming guide
      </HoverCardTrigger>
      <HoverCardContent>
        <strong>Theming</strong>
        <p style={{ margin: 0, color: "var(--color-muted-foreground)" }}>
          Presets, density, and how to change a token for one section of a page.
        </p>
      </HoverCardContent>
    </HoverCard>
  );
}
```

Shorten `openDelay` where the cards are the point of the page. Don't set `closeDelay` to zero: the card would close before the pointer could reach it.

## On touch screens

A tap on the link doesn't open the card. The link goes where it goes. That's how Radix handles touch, and this library doesn't change it.

So treat the card as a preview and nothing more. Whatever it shows has to be on the page the link opens.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves focus to the link, which shows the card after the same delay as the pointer. Moving on hides it. |
| <kbd>Enter</kbd> | Follows the link. |
| <kbd>Esc</kbd> | Hides the card. Focus stays on the link. |

<kbd>Tab</kbd> doesn't go into the card. Radix takes any link or button inside it out of the tab order, because the card closes as soon as focus leaves its link.

### What the component handles

Most of this is Radix. The library doesn't change it.

- The card shows on keyboard focus as well as on hover.
- It stays while the pointer moves from the link onto the card, and <kbd>Esc</kbd> hides it without moving the pointer. WCAG 1.4.13 asks for both.
- Text in the card can be selected with the mouse, and the card stays open while it is.
- It never runs off the screen. A card with more in it than fits scrolls inside itself.
- It only fades in when the visitor hasn't asked for reduced motion.

### What you need to handle

- The card isn't tied to its link for screen readers: it has no role, and the link isn't described by it. Someone using a screen reader may never come across it. This is the main reason the card can only repeat what the linked page says.
- Don't put the only way to do something in the card. A "Follow" button there can't be reached by keyboard or on a phone.
- The link needs text that makes sense without the card.
- Style the link yourself. `HoverCardTrigger` adds no class, so it looks like the other links on your page.

## CSS variables

Hover cards render at the end of `<body>`, so set these on `:root` or `body`, or straight on `HoverCardContent` with `style` or a class.

```css
:root {
  --nuv-hover-card-width: 22rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-hover-card-width` | `18rem` | Width of the card. It's never wider than the room beside the link. |
| `--nuv-hover-card-padding` | `calc(var(--spacing) * 4)` | Padding inside the card. |
| `--nuv-hover-card-border` | `var(--color-border)` | Border color. |
| `--nuv-hover-card-radius` | `var(--radius-lg)` | Corner radius. |
| `--nuv-hover-card-bg` | `var(--color-surface)` | Background color. |
| `--nuv-hover-card-shadow` | `var(--shadow-lg)` | Shadow under the card. |
| `--nuv-hover-card-fg` | `var(--color-surface-foreground)` | Text color. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-hover-card` | HoverCardContent. |

Radix sets `data-state="open"` or `data-state="closed"` on the link and the card, and `data-side` on the card for where it ended up. The animation hangs off `data-state`.

## Server components

The hover card parts are client components. They carry `"use client"`, and the build checks that the directive is still there in the published files.

You can put a hover card together inside a server component, as the examples on this page do.

## Themed sections

A card opened from inside a `data-theme="dark"` section doesn't inherit that theme, because it isn't rendered inside the section. Pass the section's element as `container` and it will be.

## Do and don't

**Do**

- Keep the card to a few lines: a name, a role, a sentence.
- Use it on links, where there's a page to fall back on.
- Load what the card shows before it opens, or keep its size steady while it loads.

**Don't**

- Don't put anything in the card that isn't on the linked page.
- Don't put buttons, forms or menus in it. For those, use a [popover](popover.md), which opens on a click.
- Don't use one to explain a button. That's a [tooltip](tooltip.md).
