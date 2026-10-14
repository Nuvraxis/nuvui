<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/right-to-left.mdx. Don't edit it here: run `pnpm skill`. -->

# Right-to-left

Use nuvui in Arabic, Hebrew, Persian and other languages that read from the right, with the dir attribute and DirectionProvider.

Every component works in a right-to-left layout. Two things turn it on, and both are needed: the `dir` attribute, which the styles follow, and `DirectionProvider`, which the keyboard behavior follows.

```tsx
"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  type Direction,
  DirectionProvider,
  Progress,
  Slider,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [dir, setDir] = useState<Direction>("rtl");

  return (
    <div style={{ display: "grid", gap: 16, width: "100%", maxWidth: 360 }}>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        aria-label="Direction"
        value={dir}
        onValueChange={(value) => value && setDir(value as Direction)}
      >
        <ToggleGroupItem value="ltr">Left to right</ToggleGroupItem>
        <ToggleGroupItem value="rtl">Right to left</ToggleGroupItem>
      </ToggleGroup>

      {/* In an app both of these go at the top: the attribute on <html>, and
          the provider around everything. */}
      <DirectionProvider dir={dir}>
        <div dir={dir} style={{ display: "grid", gap: 16 }}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">الرئيسية</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>الإعدادات</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Tabs defaultValue="first">
            <TabsList aria-label="Sections">
              <TabsTrigger value="first">الأول</TabsTrigger>
              <TabsTrigger value="second">الثاني</TabsTrigger>
              <TabsTrigger value="third">الثالث</TabsTrigger>
            </TabsList>
            <TabsContent value="first">المحتوى الأول</TabsContent>
            <TabsContent value="second">المحتوى الثاني</TabsContent>
            <TabsContent value="third">المحتوى الثالث</TabsContent>
          </Tabs>
          <Slider aria-label="Volume" defaultValue={[25]} />
          <Progress aria-label="Upload" value={25} />
        </div>
      </DirectionProvider>
    </div>
  );
}
```

## Setting it up

Put `dir="rtl"` on the `<html>` element, and `DirectionProvider` around the app with the same value.

```tsx title="app/layout.tsx"
import { DirectionProvider } from "@nuvui/react";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <DirectionProvider dir="rtl">{children}</DirectionProvider>
      </body>
    </html>
  );
}
```

`DirectionProvider` is a client component that adds no element of its own. It can be rendered from a server component, as here.

In an app with several languages, work the direction out from the language once and pass it to both places.

## Why there are two

**The attribute is what CSS sees.** The styles are written with logical properties, such as `padding-inline-start`, and with a selector on the `dir` attribute where something has to be mirrored. Both go by the `dir` of the element or of what's around it. So the layout flips with the attribute alone: text aligns to the right, icons move to the other side, a progress bar fills from the right.

**The provider is what the components' code sees.** Radix decides in JavaScript which arrow key moves to the next tab and which way a submenu opens, and it doesn't read the attribute. It reads a `dir` prop on the component, or this provider.

With the attribute and no provider, the tabs are laid out from the right and the left arrow still moves to the previous one. That's the mistake this page is here to prevent.

## What each one changes

| | With `dir="rtl"` | With `DirectionProvider` as well |
| --- | --- | --- |
| Text, padding, borders | Mirrored | |
| The arrows in Breadcrumb, Pagination and the rows that open a submenu | Point the other way | |
| Progress, and the sliding bar of an unknown amount | Fill and move from the right | |
| A sheet with `side="start"` | Comes from the right | |
| Tabs, RadioGroup, ToggleGroup, Toolbar, Menubar | Laid out from the right | The left arrow moves forward |
| Slider | | The low end is on the right, and the left arrow raises the value |
| A submenu in DropdownMenu, ContextMenu and Menubar | | Opens with the left arrow, to the left |
| ScrollArea | | The scrollbar is on the left |
| NavigationMenu | Laid out from the right | The left arrow moves forward |

The up and down arrows, <kbd>Home</kbd>, <kbd>End</kbd> and <kbd>Tab</kbd> do the same thing in both directions.

## One part of a page

A page can hold a section in the other direction, such as a quotation in Arabic on an English page. Give the section's element the attribute and wrap it in a provider. The nearest provider wins, so a section can also go back to left-to-right inside a right-to-left app.

```tsx
<DirectionProvider dir="rtl">
  <section dir="rtl" lang="ar">
    ...
  </section>
</DirectionProvider>
```

Overlays need one more step there. Dialogs, popovers, menus and tooltips render at the end of `<body>`, outside the section, so they get the page's direction and not the section's. Pass the section's element as the `container` prop of the overlay's content, and it renders inside.

With the attribute on `<html>`, there's nothing to do: `<body>` has the direction too.

## One component

Radix components that depend on the direction also take a `dir` prop, which wins over the provider. That's rarely the right tool, because the styles still follow the attribute, and the two then disagree. Use the attribute and the provider together.

## In your own components

`useDirection` returns the direction from the nearest provider, or `"ltr"` when there is none.

```tsx
"use client";

import { useDirection } from "@nuvui/react";

function NextArrow() {
  const dir = useDirection();
  return <span aria-hidden="true">{dir === "rtl" ? "←" : "→"}</span>;
}
```

Most of the time CSS is enough and no hook is needed:

- Use logical properties: `margin-inline-start`, `inset-inline-end`, `border-start-start-radius`, `text-align: start`.
- Mirror what can't be expressed that way with the `dir` attribute.

```css
[dir="rtl"] .back-arrow {
  transform: scaleX(-1);
}
```

In SCSS the library's [`rtl` mixin](scss.md) writes that selector for you, and leaves a part marked `dir="ltr"` inside a right-to-left page alone:

```scss
@use "@nuvui/react/scss/mixins";

.back-arrow {
  @include mixins.rtl {
    transform: scaleX(-1);
  }
}
```

The `:dir(rtl)` selector says the same in fewer words, and isn't used here for a reason. A build that supports browsers without it, which is Next.js by default, rewrites it to a list of `:lang()` selectors. After that nothing is mirrored on a page that sets `dir="rtl"` and not one of those languages.

## What shouldn't flip

Not everything mirrors. These stay as they are in a right-to-left layout:

- Numbers, phone numbers and code.
- Icons that don't show a direction, and icons of real things, such as a clock or a check mark.
- Media controls. Play points the same way everywhere, because it shows the direction of the tape and not of reading.
- A chart's axes, unless the people who read it expect otherwise.

Arrows that mean "back" and "forward", "previous" and "next" do flip.

## API

### DirectionProvider

| Prop | Type | What it does |
| --- | --- | --- |
| `dir` | `"ltr" \| "rtl"` | The reading direction of everything inside. Required. |
| `children` | `ReactNode` | The part of the app it applies to. |

### useDirection

```ts
function useDirection(dir?: "ltr" | "rtl"): "ltr" | "rtl";
```

Pass a component's own `dir` prop and it's returned when set. Otherwise the result is the nearest provider's direction, or `"ltr"`.

Both are exported from `@nuvui/react`, and from `@nuvui/react/direction` by themselves.

## Checking your work

- Tab through each page and press the arrow keys in every tab list, menu and slider. The key that points at the next item should move to it.
- Open every overlay. It should be mirrored like the rest.
- Look for anything pinned with `left` or `right` in your own CSS.
- Read a page with mixed text, such as an English product name inside an Arabic sentence. The browser's own algorithm orders it, and `<bdi>` around the foreign part keeps punctuation in place.

The library's tests cover each component with a direction in both layouts, in Chromium, Firefox and WebKit. They can't cover your content.
