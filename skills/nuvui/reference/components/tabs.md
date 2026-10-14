<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/tabs.mdx. Don't edit it here: run `pnpm skill`. -->

# Tabs

Panels of content with a row of tabs to switch between them. The row scrolls sideways when it doesn't fit the screen.

Use tabs to split one subject into a few views of equal weight, where people look at one at a time: the sections of a settings page, or the details and reviews of a product.

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@nuvui/react";

export default function Example() {
  return (
    <Tabs defaultValue="account" style={{ inlineSize: "100%" }}>
      <TabsList aria-label="Settings">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Your name, email and password.</TabsContent>
      <TabsContent value="team">
        The people who can see this project.
      </TabsContent>
      <TabsContent value="billing">Your plan and past invoices.</TabsContent>
    </Tabs>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Tabs` | Holds which tab is selected, and lays out the list and the panels. |
| `TabsList` | The row of tabs. |
| `TabsTrigger` | One tab. Its `value` ties it to a panel. |
| `TabsContent` | The panel for one tab. Only the selected panel's content is rendered. |

These are separate exports, not properties of `Tabs`. `Tabs.List` isn't available, because property access on a client component doesn't work from a server component.

## Props

### Tabs

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `string` |  | The selected tab, when you control it yourself. Use it with `onValueChange`. |
| `defaultValue` | `string` |  | The tab selected at first, when you don't control it. Without it, no tab is selected and no panel shows. |
| `onValueChange` | `((value: string) => void)` |  | Called with the new tab's value when the selection changes. |
| `orientation` | `"horizontal" \| "vertical"` |  | Whether the tabs sit in a row above the panel or in a column beside it. It also decides which arrow keys move between them. |
| `activationMode` | `"automatic" \| "manual"` |  | With `"manual"`, the arrow keys only move focus, and Enter or Space selects the tab. |
| `dir` | `"ltr" \| "rtl"` |  | The reading direction. With `"rtl"`, the left and right arrow keys swap. |

### TabsList

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `loop` | `boolean` |  | Whether the arrow keys wrap from the last tab to the first and back. On unless you pass `false`. |

### TabsTrigger

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` (required) | `string` |  | Matches the `value` of the panel this tab shows. |
| `disabled` | `boolean` |  | Stops the tab from being selected. The arrow keys skip it. |

### TabsContent

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` (required) | `string` |  | Matches the `value` of the tab that shows this panel. |
| `forceMount` | `true` |  | Keeps the panel's content rendered while its tab isn't selected. The panel is then no longer hidden for you. |

Every part also takes what its element takes, including `ref`, `className` and `asChild`. The [Radix Tabs reference](https://www.radix-ui.com/primitives/docs/components/tabs#api-reference) has the full list.

## Vertical

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@nuvui/react";

export default function Example() {
  return (
    <Tabs
      defaultValue="account"
      orientation="vertical"
      style={{ inlineSize: "100%" }}
    >
      <TabsList aria-label="Settings">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Your name, email and password.</TabsContent>
      <TabsContent value="team">
        The people who can see this project.
      </TabsContent>
      <TabsContent value="billing">Your plan and past invoices.</TabsContent>
    </Tabs>
  );
}
```

A vertical list takes its width from the panel. On a phone that leaves little room for the content, so the horizontal layout is usually the better fit there.

## On small screens

When the tabs don't fit, the list scrolls sideways inside itself and the page stays put. There's no scrollbar. The tab that's cut off at the edge is the hint that there are more.

That hint is easy to miss, so keep the labels short and the number of tabs small.

## When the arrow keys select

By default, moving to a tab with the arrow keys selects it, so the panel changes as you go. Set `activationMode="manual"` if showing a panel is slow or loads data. The arrow keys then only move focus, and the tab is selected with <kbd>Enter</kbd> or <kbd>Space</kbd>.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves focus to the selected tab. Pressed again, it moves to the panel. |
| <kbd>→</kbd> and <kbd>←</kbd> | Move to the next or previous tab and select it. From the last tab it goes to the first. In a vertical list, <kbd>↓</kbd> and <kbd>↑</kbd> do this. |
| <kbd>Home</kbd> | Moves to the first tab. |
| <kbd>End</kbd> | Moves to the last tab. |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | Selects the focused tab. Only needed with `activationMode="manual"`. |

### What the component handles

Most of this is Radix. The library doesn't change it.

- The parts have the `tablist`, `tab` and `tabpanel` roles. Each tab has `aria-selected` and `aria-controls`, and each panel is named by its tab.
- Only the selected tab is in the tab order. The arrow keys move between tabs and skip disabled ones.
- The panel can take focus, so a keyboard user can reach a panel that has nothing focusable in it.
- Tabs are at least 44 pixels tall on a touch screen and 40 with a mouse.
- The focus ring is drawn inside the tab, because the scrolling list would clip one drawn outside.
- The selected tab is marked by a line as well as by its text color, so it doesn't depend on telling two colors apart.
- Where the browser forces its own colors, as Windows high contrast does, the line is still only under the selected tab.

### What you need to handle

- Name the list with `aria-label` or `aria-labelledby`, as the examples do.
- In a right-to-left layout, pass `dir="rtl"` so the arrow keys follow the reading direction.

## CSS variables

Set any of these on `Tabs`, or on anything around it.

```css
.product {
  --nuv-tabs-indicator: var(--color-foreground);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-tabs-gap` | `calc(var(--spacing) * 4)` | Space between the list and the panel. |
| `--nuv-tabs-border` | `var(--color-border)` | Color of the line under the list, or beside it when vertical. |
| `--nuv-tabs-indicator-width` | `2px` | Thickness of that line. |
| `--nuv-tabs-fg` | `var(--color-muted-foreground)` | Text color of the tabs that aren't selected. |
| `--nuv-tabs-active-fg` | `var(--color-foreground)` | Text color of the selected tab, and of any tab while hovered. |
| `--nuv-tabs-indicator` | `var(--color-primary)` | Color of the line that marks the selected tab. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-tabs` | Tabs. |
| `.nuv-tabs__content` | TabsContent. |
| `.nuv-tabs__list` | TabsList. |
| `.nuv-tabs__trigger` | TabsTrigger. |

Radix sets `data-orientation` on every part, `data-state="active"` or `data-state="inactive"` on the tabs and the panels, and `data-disabled` on a disabled tab. The vertical layout and the selected styles hang off those.

## Server components

The tabs parts are client components. They carry `"use client"`, and the build checks that the directive is still there in the published files.

You can put tabs together inside a server component, as both examples on this page do. They only need a client component of your own when you control `value`.

Only the selected panel's content is in the HTML the server sends. If the other panels have to be in the page too, for search engines or for the browser's find, pass `forceMount` to each `TabsContent` and hide the ones with `data-state="inactive"` in your own CSS.

## Do and don't

**Do**

- Keep the labels to a word or two.
- Put the tab people need most first, and select it by default.
- Use tabs for views of the same thing.

**Don't**

- Don't use tabs for steps that have to be done in order.
- Don't use them to move between pages. Those are links.
- Don't put tabs inside tabs.
