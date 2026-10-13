<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/avatar.mdx. Don't edit it here: run `pnpm skill`. -->

# Avatar

A small picture of a person or a thing, with initials or an icon in its place when there's no picture.

Use an avatar next to a name, in a list of people or at the top of a profile. It shows the picture once the picture has loaded, and the fallback until then, or for good if the picture can't be had.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@nuvui/react";

// A picture kept in the file, so the example doesn't depend on another site.
const picture =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23314158'/%3E%3Ccircle cx='40' cy='30' r='14' fill='%23e2e8f0'/%3E%3Cpath d='M12 80a28 28 0 0 1 56 0z' fill='%23e2e8f0'/%3E%3C/svg%3E";

export default function Example() {
  return (
    <>
      <Avatar>
        <AvatarImage src={picture} alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="data:image/png;base64,AAAA" alt="Grace Hopper" />
        <AvatarFallback>GH</AvatarFallback>
      </Avatar>
    </>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Avatar` | The frame. It sets the size and the shape. |
| `AvatarImage` | The picture. It's only in the page once it has loaded. |
| `AvatarFallback` | What shows while there's no picture. |
| `AvatarGroup` | A row of avatars that overlap. |

## Props

### Avatar

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `size` | `"lg" \| "md" \| "sm"` | `"md"` |  |
| `shape` | `"circle" \| "square"` | `"circle"` | A circle suits a person. A rounded square suits a company, a team or a project. |

### AvatarImage

It takes what an `<img>` takes, `src` and `alt` included, and one prop from Radix.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `onLoadingStatusChange` | `((status: ImageLoadingStatus) => void)` |  | Called with `"loading"`, `"loaded"` or `"error"` as the picture's state changes. |

### AvatarFallback

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `delayMs` | `number` |  | How long to wait before showing the fallback, in milliseconds. A few hundred keeps it from flashing before a picture that loads quickly. |

`AvatarGroup` takes what a `<div>` takes.

## Sizes and shapes

```tsx
import { Avatar, AvatarFallback } from "@nuvui/react";

export default function Example() {
  return (
    <>
      <Avatar size="sm">
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar size="md">
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar size="lg" shape="square">
        <AvatarFallback>NT</AvatarFallback>
      </Avatar>
    </>
  );
}
```

The sizes are 32, 40 and 56 pixels. Use a circle for a person and a rounded square for a company, a team or a project, so the two can be told apart in a list that has both.

Any other size is `--nuv-avatar-size`, with `--nuv-avatar-font-size` for the initials.

## A group

`AvatarGroup` overlaps its avatars and draws a ring in the page's color around each, which reads as a gap between them.

```tsx
import { Avatar, AvatarFallback, AvatarGroup } from "@nuvui/react";

const people = [
  ["AL", "Ada Lovelace"],
  ["GH", "Grace Hopper"],
  ["KJ", "Katherine Johnson"],
] as const;

export default function Example() {
  return (
    <AvatarGroup role="group" aria-label="Assigned to">
      {people.map(([initials, name]) => (
        <Avatar key={initials} role="img" aria-label={name}>
          <AvatarFallback aria-hidden="true">{initials}</AvatarFallback>
        </Avatar>
      ))}
      <Avatar role="img" aria-label="and 4 more">
        <AvatarFallback aria-hidden="true">+4</AvatarFallback>
      </Avatar>
    </AvatarGroup>
  );
}
```

On a surface that isn't the page's background, such as a card, set `--nuv-avatar-group-ring` to that surface's color.

## While the picture loads

`AvatarImage` isn't rendered until the browser has the picture. So a slow or broken address never shows as a broken-image icon, or as an empty frame that fills in from the top.

The fallback shows from the start by default. With a picture that's usually cached, that's a flash of initials on every page. `delayMs` on `AvatarFallback` holds the fallback back, and the frame stays empty for that long.

The frame has its size from the start, so nothing on the page moves when the picture arrives.

## Accessibility

An avatar has no keyboard behavior. It isn't a control.

### What the component handles

- The picture is an `<img>`, so its `alt` is what a screen reader reads.
- The fallback is text in the page, read as it's written.
- The fallback's text has at least 4.5:1 against its background in every theme.
- Where the browser forces its own colors, the fallback gets a border in place of its fill.

### What you need to handle

- **Next to the person's name, the avatar is decoration.** Give the picture `alt=""` and the fallback `aria-hidden="true"`, or a screen reader says the name twice, or says "AL, Ada Lovelace".
- **Where the avatar is the only thing that says who it is,** as in the group above, give the picture the person's name as its `alt`. Initials alone don't name anyone, so for a fallback put `role="img"` and `aria-label` on `Avatar` and hide the initials, as the group example does.
- An avatar that opens a menu or a profile goes inside a button or a link, and that element gets the name.

## CSS variables

Set any of these on `Avatar` or `AvatarGroup`, or on anything around them.

```css
.comment {
  --nuv-avatar-size: 1.5rem;
  --nuv-avatar-font-size: 0.625rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-avatar-size` | `2.5rem`, `2rem`, `3.5rem` | Width and height. Differs by size. |
| `--nuv-avatar-radius` | `var(--radius-full)`, `var(--radius-md)` | Corner radius. A circle by default. |
| `--nuv-avatar-font-size` | `var(--text-sm)`, `var(--text-xs)`, `var(--text-lg)` | Font size of the fallback. Differs by size. |
| `--nuv-avatar-bg` | `var(--color-muted)` | Background color of the fallback. |
| `--nuv-avatar-fg` | `var(--color-foreground)` | Text color of the fallback. |
| `--nuv-avatar-group-ring-width` | `2px` | Thickness of the ring around each avatar in a group. |
| `--nuv-avatar-group-ring` | `var(--color-background)` | Color of that ring. Set it to the color of the surface the group sits on. |
| `--nuv-avatar-group-overlap` | `calc(var(--spacing) * -2)` | How far each avatar in a group sits over the one before. A negative length. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-avatar` | Avatar. |
| `.nuv-avatar--lg` | size="lg" |
| `.nuv-avatar--sm` | size="sm" |
| `.nuv-avatar--square` | shape="square" |
| `.nuv-avatar-group` | AvatarGroup. |
| `.nuv-avatar__fallback` | AvatarFallback. |
| `.nuv-avatar__image` | AvatarImage. |

A medium avatar also has the class `nuv-avatar--md`. It has no rules of its own, because medium is how every avatar starts.

## Server components

Avatar is a client component, because it has to know when the picture has loaded. It carries `"use client"`, and the build checks that the directive is still there in the published files. You can render it from a server component, as the examples on this page do.

On the server, and in the first paint, an avatar shows its fallback, or nothing where `delayMs` is set. The picture comes in once the browser has loaded it.

## Do and don't

**Do**

- Always give a fallback. Pictures fail to load.
- Use two initials at most. Three don't fit the small size.

**Don't**

- Don't rely on a picture to say who someone is. Show the name too, wherever there's room.
- Don't use the picture's file name or "avatar" as its `alt`.
