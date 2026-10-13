<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/toggle.mdx. Don't edit it here: run `pnpm skill`. -->

# Toggle

A button that stays pressed until it's pressed again, for turning one thing on and off.

Use a toggle for an option that's on or off and reads as a button: bold in an editor, a pinned item, a filter. For a setting in a list of settings, a [switch](switch.md) is the usual control. For several toggles that belong together, use a [toggle group](toggle-group.md).

```tsx
import { Toggle } from "@nuvui/react";

export default function Example() {
  return <Toggle variant="outline">Show archived</Toggle>;
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { Toggle } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `variant` | `"ghost" \| "outline"` | `"ghost"` | `"ghost"` has no edge until it's pressed, which suits a row of them in a toolbar. `"outline"` has one, for a toggle that stands alone. |
| `size` | `"lg" \| "md" \| "sm"` | `"md"` |  |

These come from Radix.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `pressed` | `boolean` |  | Whether it's pressed, when you control it yourself. Use it with `onPressedChange`. |
| `defaultPressed` | `boolean` |  | Whether it starts pressed, when you don't control it. |
| `onPressedChange` | `((pressed: boolean) => void)` |  | Called with the new state when it's pressed or released. |
| `disabled` | `boolean` |  | Stops it from being focused or pressed. |

Everything else is passed to the `<button>` Radix renders, including `ref`, `className` and `aria-label`.

## With icons

A toggle that holds only an icon is square. It needs an `aria-label`, since there's no text to name it.

```tsx
import { Toggle } from "@nuvui/react";
import type { ReactNode } from "react";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export default function Example() {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      <Toggle aria-label="Bold" defaultPressed>
        <Icon>
          <path d="M4.5 3h4a2.5 2.5 0 010 5h-4zm0 5h4.5a2.5 2.5 0 010 5H4.5z" />
        </Icon>
      </Toggle>
      <Toggle aria-label="Italic">
        <Icon>
          <path d="M6.5 3h5M4.5 13h5M9.5 3l-3 10" />
        </Icon>
      </Toggle>
      <Toggle aria-label="Underline">
        <Icon>
          <path d="M4.5 3v4.5a3.5 3.5 0 007 0V3M4 13.5h8" />
        </Icon>
      </Toggle>
    </div>
  );
}
```

## Sizes

```tsx
import { Toggle } from "@nuvui/react";

export default function Example() {
  return (
    <>
      <Toggle variant="outline" size="sm">
        Small
      </Toggle>
      <Toggle variant="outline" size="md">
        Medium
      </Toggle>
      <Toggle variant="outline" size="lg">
        Large
      </Toggle>
    </>
  );
}
```

On a touch screen every size is at least 44 pixels tall and wide, and `lg` is 48. The smaller heights (32, 40 and 48 pixels) only apply when a mouse or trackpad is the main input, and [density](../theming.md#density) moves them.

## Why pressed is a solid fill

A pressed toggle is filled with the primary color. A pale gray fill would be quieter, and `--color-muted` differs from the page by far less than the 3:1 that WCAG asks of something that shows a control's state. The primary color has at least 3:1 against the page in every theme, and its text color at least 4.5:1 against it.

Change it with `--nuv-toggle-on-bg` and `--nuv-toggle-on-fg` if your design calls for something else, and check the contrast when you do.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves focus to the toggle. Disabled ones are skipped. |
| <kbd>Space</kbd> or <kbd>Enter</kbd> | Presses or releases it. |

### What the component handles

- It renders a `<button>` with `aria-pressed`, so a screen reader says whether it's pressed. This part is Radix.
- Its `type` is `"button"`, so it doesn't submit a form around it.
- Where the browser forces its own colors, as Windows high contrast does, a pressed toggle takes the system's colors for something selected.
- Keyboard focus shows a 2 pixel ring in `--color-ring`. A mouse click doesn't.
- The color change is only animated when the visitor hasn't asked for reduced motion.

### What you need to handle

- Name what it turns on, and keep the name the same in both states. `aria-pressed` already says which state it's in, so a label that changes from "Mute" to "Unmute" says it twice and gets it wrong half the time.
- Give an icon-only toggle an `aria-label`.

## CSS variables

Set any of these on the toggle, or on anything around it.

```css
.editor {
  --nuv-toggle-radius: var(--radius-sm);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-toggle-gap` | `calc(var(--spacing) * 2)` | Space between an icon and the label. |
| `--nuv-toggle-padding-inline` | `calc(var(--spacing) * 2.5)`, `calc(var(--spacing) * 1.5)`, `calc(var(--spacing) * 3.5)` | Padding left and right. Differs by size. |
| `--nuv-toggle-border` | `transparent`, `var(--color-border)` | Border color while not pressed. Only the outline variant shows one by default. |
| `--nuv-toggle-radius` | `var(--radius-md)` | Corner radius. |
| `--nuv-toggle-bg` | `transparent` | Background color while not pressed. |
| `--nuv-toggle-fg` | `var(--color-foreground)` | Text color while not pressed. |
| `--nuv-toggle-font-size` | `var(--text-sm)`, `var(--text-base)` | Font size. Larger on the lg size. |
| `--nuv-toggle-height` | `var(--nuv-touch-size)`, `var(--nuv-control-height-sm)`, `var(--nuv-control-height-md)`, `max(var(--nuv-touch-size), var(--nuv-control-height-lg))`, `var(--nuv-control-height-lg)` | Minimum height, and minimum width. Differs by size and by whether the device is touch. |
| `--nuv-toggle-bg-hover` | `var(--color-muted)` | Background color while hovered and not pressed. |
| `--nuv-toggle-on-bg` | `var(--color-primary)` | Background and border color while pressed. Keep it at 3:1 against the page. |
| `--nuv-toggle-on-fg` | `var(--color-primary-foreground)` | Text color while pressed. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-toggle` | Every toggle. |
| `.nuv-toggle--lg` | size="lg" |
| `.nuv-toggle--md` | size="md" |
| `.nuv-toggle--outline` | variant="outline" |
| `.nuv-toggle--sm` | size="sm" |

A ghost toggle also has the class `nuv-toggle--ghost`. It has no rules of its own, because ghost is how every toggle starts. Radix sets `data-state` to `on` or `off`, and `data-disabled` when the toggle is disabled.

## Server components

Toggle is a client component. It carries `"use client"`, and the build checks that the directive is still there in the published files. You can render it from a server component, as the examples on this page do.

## Do and don't

**Do**

- Use it for something that takes effect at once.
- Use the outline variant when a toggle stands alone, so it reads as a control before it's pressed.

**Don't**

- Don't use a toggle for an action, such as "Save". That's a [button](button.md).
- Don't swap the label when it's pressed.
