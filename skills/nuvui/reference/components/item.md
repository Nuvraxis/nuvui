<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/item.mdx. Don't edit it here: run `pnpm skill`. -->

# Item

A row with a picture, a title, a description and something to do at its end, and a list that groups rows into a panel.

Use an item for one thing in a list of things: a setting with its switch, a person with their role, a page to go to. `ItemGroup` turns several into a list.

```tsx
import {
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@nuvui/react";

export default function Example() {
  return (
    <Item variant="outline" style={{ maxInlineSize: "32rem" }}>
      <ItemMedia variant="icon">
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
          <rect x="3" y="7" width="10" height="7" rx="1.5" />
          <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
        </svg>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Two-step sign-in</ItemTitle>
        <ItemDescription>
          Ask for a code from your phone as well as your password.
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button intent="secondary" size="sm">
          Set up
        </Button>
      </ItemActions>
    </Item>
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
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Item` | The row. |
| `ItemMedia` | What's at the start: an icon, an avatar or a picture. |
| `ItemContent` | The title and the description. It takes the room the rest leaves. |
| `ItemTitle` | The row's name. |
| `ItemDescription` | A line or two under it. |
| `ItemActions` | What's at the end: a switch, a button, a badge, an arrow. |
| `ItemGroup` | A list of items. A `ul`, with each item in an `li`. |

Only `Item` is needed, and it can hold anything. The parts are there for the usual layout.

## Props

### Item

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | Render the single child element instead of a `div`, and give it the item's class and props. This is how a whole row becomes a link or a button: it then has a hover color and a focus ring. |
| `variant` | `"muted" \| "outline" \| "plain"` | `"plain"` | `"outline"` draws an edge around the row and `"muted"` fills it. In an outlined `ItemGroup` leave it plain: the group draws the edges. |
| `size` | `"md" \| "sm"` | `"md"` | `"sm"` has less padding, for a dense list. |

### ItemMedia

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `variant` | `"icon" \| "plain"` | `"plain"` | `"icon"` draws a small filled square behind an icon. `"plain"` draws nothing, for an avatar or a picture. |

### ItemGroup

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `variant` | `"outline" \| "plain"` | `"plain"` | `"outline"` puts one edge around all the rows and a line between them, as a settings panel has. |

The other parts add no props of their own. Each takes what its element takes, including `ref` and `className`.

## Variants and sizes

`variant` is how one row is drawn: `"plain"` with nothing around it, `"outline"` with an edge, `"muted"` with a fill. `size="sm"` takes padding off, for a dense list.

```tsx
import {
  Avatar,
  AvatarFallback,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@nuvui/react";

const people = [
  { initials: "AO", name: "Ada Osei", role: "Owner", variant: "plain" },
  {
    initials: "GL",
    name: "Grace Lindqvist",
    role: "Admin",
    variant: "outline",
  },
  { initials: "TM", name: "Tomás Marín", role: "Member", variant: "muted" },
] as const;

export default function Example() {
  return (
    <ItemGroup
      aria-label="The three variants"
      style={{ inlineSize: "100%", maxInlineSize: "24rem", gap: "0.5rem" }}
    >
      {people.map((person) => (
        <Item key={person.name} variant={person.variant} size="sm">
          <ItemMedia>
            <Avatar size="sm">
              <AvatarFallback>{person.initials}</AvatarFallback>
            </Avatar>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{person.name}</ItemTitle>
            <ItemDescription>
              {person.role}, as variant="{person.variant}"
            </ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  );
}
```

## A settings panel

An `ItemGroup` with `variant="outline"` puts one edge around all its rows and a line between them. Leave the items plain inside it: the group draws the edges.

```tsx
"use client";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
  NativeSelect,
  Slider,
  Switch,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [volume, setVolume] = useState([60]);

  return (
    <div style={{ inlineSize: "100%", maxInlineSize: "32rem" }}>
      <h4 id="item-settings-heading" style={{ margin: "0 0 0.5rem" }}>
        Notifications
      </h4>
      <ItemGroup variant="outline" aria-labelledby="item-settings-heading">
        <Item>
          <ItemContent>
            <ItemTitle id="item-settings-digest">Weekly digest</ItemTitle>
            <ItemDescription id="item-settings-digest-text">
              A summary of your team's week, every Monday.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Switch
              defaultChecked
              aria-labelledby="item-settings-digest"
              aria-describedby="item-settings-digest-text"
            />
          </ItemActions>
        </Item>
        <Item>
          <ItemContent>
            <ItemTitle id="item-settings-mentions">Mentions</ItemTitle>
            <ItemDescription>Where to tell you about them.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <NativeSelect
              defaultValue="email"
              aria-labelledby="item-settings-mentions"
            >
              <option value="email">Email</option>
              <option value="push">Push</option>
              <option value="none">Nowhere</option>
            </NativeSelect>
          </ItemActions>
        </Item>
        <Item>
          <ItemContent>
            <ItemTitle id="item-settings-volume">Alert volume</ItemTitle>
            <ItemDescription>{volume[0]}%</ItemDescription>
          </ItemContent>
          <ItemActions style={{ inlineSize: "9rem" }}>
            <Slider
              value={volume}
              onValueChange={setVolume}
              step={10}
              aria-labelledby="item-settings-volume"
            />
          </ItemActions>
        </Item>
      </ItemGroup>
    </div>
  );
}
```

A control in `ItemActions` has no label of its own. Give the title an `id` and point the control at it with `aria-labelledby`, and the title is the control's name. `aria-describedby` does the same for the description.

Any control works at the end of a row: a [switch](switch.md), a [native select](native-select.md), a [slider](slider.md). Give `ItemActions` a width when the control fills what it's given, as a slider does.

## Rows that go somewhere

With `asChild`, the row is the element you give it. A row that's a link or a button gets a hover color, a pointer and a focus ring, and is at least 44 pixels tall on a touch screen.

```tsx
import {
  Badge,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@nuvui/react";

const pages = [
  {
    href: "#profile",
    title: "Profile",
    text: "Your name, your picture and your time zone.",
  },
  {
    href: "#billing",
    title: "Billing",
    text: "Cards, invoices and the plan.",
    badge: "Past due",
  },
  {
    href: "#members",
    title: "Members",
    text: "Who's on the team, and what each can do.",
  },
];

function Arrow() {
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
      <path d="M6 3.5l4.5 4.5L6 12.5" />
    </svg>
  );
}

export default function Example() {
  return (
    <ItemGroup
      variant="outline"
      aria-label="Settings"
      style={{ inlineSize: "100%", maxInlineSize: "28rem" }}
    >
      {pages.map((page) => (
        <Item key={page.href} asChild>
          <a href={page.href}>
            <ItemContent>
              <ItemTitle>{page.title}</ItemTitle>
              <ItemDescription>{page.text}</ItemDescription>
            </ItemContent>
            <ItemActions>
              {page.badge ? <Badge intent="danger">{page.badge}</Badge> : null}
              <Arrow />
            </ItemActions>
          </a>
        </Item>
      ))}
    </ItemGroup>
  );
}
```

Don't put another control inside such a row. A button inside a link can't be reached by itself, and a screen reader reads the whole row as one name. If a row needs both, leave it a plain row and put a link in its title.

## In a group

`ItemGroup` is a list, and a screen reader says how many rows it has. Inside one, each `Item` is wrapped in an `li` for you. That works however deep the item is: a component of your own that renders an `Item` is still a row of the list.

Put only items in a group. A heading goes above it, and names it through `aria-labelledby`.

## Accessibility

An item has no keyboard behavior of its own. A row that's a link or a button is reached with Tab and works as that element does.

### What the component handles

- A group is a `ul` with an `li` around each row. It says it's a list in so many words, because Safari stops treating a list as one once its bullets are styled away.
- A row that's a link stays a link: the list item is the box around it, not the row.
- The focus ring of a row is drawn inside it, so a group that clips its corners doesn't clip the ring.
- A filled row and the square behind an icon each have a border that can't be seen until the browser forces its own colors. It's drawn there in place of the fill.
- The description has at least 4.5:1 against the page, a surface and a filled row in every theme.

### What you need to handle

- Name a group, with `aria-label` or `aria-labelledby`.
- Name each control in `ItemActions` by the row's title, with `aria-labelledby`.
- An icon in `ItemMedia` that only decorates needs `aria-hidden="true"`. A picture that says something needs an `alt`.

## On small screens

The row doesn't wrap. The text takes what's left after the picture and the action, and wraps inside its own column, so the action stays at the end of the row. Keep what's in `ItemActions` small: one control, or a badge and an arrow.

## CSS variables

Set any of these on an `Item`, on an `ItemGroup`, or on anything around them.

```css
.member-list {
  --nuv-item-padding-inline: 0;
  --nuv-item-group-gap: 0;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-item-gap` | `calc(var(--spacing) * 3)`, `calc(var(--spacing) * 2)` | Space between the picture, the text and the action. |
| `--nuv-item-padding-block` | `calc(var(--spacing) * 3)`, `calc(var(--spacing) * 2)` | Padding above and below. Less at size="sm". |
| `--nuv-item-padding-inline` | `calc(var(--spacing) * 4)`, `calc(var(--spacing) * 3)` | Padding left and right. Less at size="sm". |
| `--nuv-item-border` | `transparent`, `var(--color-border)` | Border color. Transparent unless the variant is "outline". |
| `--nuv-item-radius` | `var(--radius-md)` | Corner radius of a row. Square inside an outlined group. |
| `--nuv-item-bg` | `transparent`, `var(--color-muted)` | Background color. Transparent unless the variant is "muted". |
| `--nuv-item-fg` | `inherit` | Text color. The color of what's around it by default. |
| `--nuv-item-hover-bg` | `var(--color-muted)` | Background color of a row that's a link or a button, under the pointer. |
| `--nuv-item-media-size` | `2.25rem` | Width and height of the square behind an icon. |
| `--nuv-item-media-bg` | `var(--color-muted)` | Background color of that square. |
| `--nuv-item-media-fg` | `var(--color-foreground)` | Color of the icon in it. |
| `--nuv-item-muted-fg` | `var(--color-muted-foreground)` | Color of the description. Keep it at 4.5:1 against the background. |
| `--nuv-item-group-gap` | `calc(var(--spacing) * 1)` | Space between rows in a plain group. |
| `--nuv-item-group-border` | `var(--color-border)` | Color of an outlined group's edge and of the lines between its rows. |
| `--nuv-item-group-radius` | `var(--radius-lg)` | Corner radius of an outlined group. |
| `--nuv-item-group-bg` | `var(--color-surface)` | Background color of an outlined group. |
| `--nuv-item-group-fg` | `var(--color-surface-foreground)` | Text color in an outlined group. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-item` | Every item. |
| `.nuv-item--muted` | variant="muted" |
| `.nuv-item--outline` | variant="outline" |
| `.nuv-item--sm` | size="sm" |
| `.nuv-item-group` | ItemGroup |
| `.nuv-item-group--outline` | ItemGroup with variant="outline" |
| `.nuv-item-group__row` | The `li` around each item in a group. |
| `.nuv-item__actions` | ItemActions |
| `.nuv-item__content` | ItemContent |
| `.nuv-item__description` | ItemDescription |
| `.nuv-item__media` | ItemMedia |
| `.nuv-item__media--icon` | ItemMedia with variant="icon" |
| `.nuv-item__title` | ItemTitle |

## Server components

`Item` and `ItemGroup` start with `"use client"`: an item has to find out whether it's in a group. You can still use them from a server component, with server-rendered content inside. The other parts are in the same file, so they're client components too.

## Do and don't

**Do**

- Keep one kind of thing at the end of every row in a list: all switches, or all arrows.
- Use an outlined group for settings, and plain rows for a list of people or files.

**Don't**

- Don't nest a control in a row that's a link.
- Don't use an item where the rows have columns to compare. That's a [table](../table/index.md).
