<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/resizable.mdx. Don't edit it here: run `pnpm skill`. -->

# Resizable

Panels with a handle between them to drag, side by side or one above another.

Use resizable panels where the reader knows better than you how much room each part needs: a list beside what's chosen from it, an editor above its output, navigation beside a page. Where one size is right, set it and leave this out.

```tsx
import { Resizable, ResizableHandle, ResizablePanel } from "@nuvui/react";

const pane = { padding: 16 };

export default function Example() {
  return (
    <div
      style={{
        inlineSize: "100%",
        blockSize: 220,
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      <Resizable>
        <ResizablePanel defaultSize="35%" minSize="20%" style={pane}>
          Folders
        </ResizablePanel>
        <ResizableHandle withGrip aria-label="Resize folders" />
        <ResizablePanel minSize="30%" style={pane}>
          Messages
        </ResizablePanel>
      </Resizable>
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
import { Resizable, ResizablePanel, ResizableHandle } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Resizable` | The panels together. It keeps their sizes. |
| `ResizablePanel` | One panel. It scrolls what doesn't fit. |
| `ResizableHandle` | The line between two panels, which is dragged. |

Put a handle between each two panels. The panels and the handles have to be written straight inside `Resizable`, not inside something else that's inside it.

`Resizable` fills what it's in, both ways. Give that a height, or the panels have none.

It's built on [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels), which does the resizing.

## Sizes

A panel's `defaultSize`, `minSize` and `maxSize` are written the same way. A number is pixels. A string is a share of the whole, `"30%"`, or a length, `"20rem"`.

```tsx
<ResizablePanel defaultSize="30%" minSize={200} maxSize="40rem" />
```

Give every panel a `minSize`. Without one a panel can be dragged down to nothing, and what's in it is then out of reach.

A panel without a `defaultSize` takes a share of what's left. Leave it off at least one panel, so the sizes always add up.

## One above another

```tsx
import { Resizable, ResizableHandle, ResizablePanel } from "@nuvui/react";

const pane = { padding: 16 };

export default function Example() {
  return (
    <div
      style={{
        inlineSize: "100%",
        blockSize: 280,
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      <Resizable orientation="vertical">
        <ResizablePanel defaultSize="60%" minSize="25%" style={pane}>
          Query
        </ResizablePanel>
        <ResizableHandle aria-label="Resize query" />
        <ResizablePanel minSize="25%" style={pane}>
          Results
        </ResizablePanel>
      </Resizable>
    </div>
  );
}
```

## Inside one another

A panel can hold another `Resizable` that lies the other way.

```tsx
import { Resizable, ResizableHandle, ResizablePanel } from "@nuvui/react";

const pane = { padding: 16 };

export default function Example() {
  return (
    <div
      style={{
        inlineSize: "100%",
        blockSize: 300,
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      <Resizable>
        <ResizablePanel defaultSize="30%" minSize="15%" style={pane}>
          Files
        </ResizablePanel>
        <ResizableHandle aria-label="Resize files" />
        <ResizablePanel minSize="30%">
          <Resizable orientation="vertical">
            <ResizablePanel defaultSize="65%" minSize="20%" style={pane}>
              Editor
            </ResizablePanel>
            <ResizableHandle aria-label="Resize editor" />
            <ResizablePanel minSize="20%" style={pane}>
              Terminal
            </ResizablePanel>
          </Resizable>
        </ResizablePanel>
      </Resizable>
    </div>
  );
}
```

## A panel that folds away

A `collapsible` panel folds to nothing when it's dragged to well under its `minSize`, and opens again when it's dragged back. Enter on the handle after it does the same.

To fold it from a button, take a ref with `useResizablePanelRef` and give it to the panel as `panelRef`. It has `collapse`, `expand`, `isCollapsed`, `resize` and `getSize`.

```tsx
"use client";

import {
  Button,
  Resizable,
  ResizableHandle,
  ResizablePanel,
  useResizablePanelRef,
} from "@nuvui/react";
import { useState } from "react";

const pane = { padding: 16 };

export default function Example() {
  const panel = useResizablePanelRef();
  const [folded, setFolded] = useState(false);

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <div>
        <Button
          size="sm"
          intent="secondary"
          aria-expanded={!folded}
          aria-controls="resizable-example-nav"
          onClick={() =>
            folded ? panel.current?.expand() : panel.current?.collapse()
          }
        >
          {folded ? "Show navigation" : "Hide navigation"}
        </Button>
      </div>
      <div
        style={{
          blockSize: 220,
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <Resizable>
          <ResizablePanel
            id="resizable-example-nav"
            panelRef={panel}
            collapsible
            defaultSize="30%"
            minSize="20%"
            onResize={(size) => setFolded(size.asPercentage === 0)}
            style={pane}
          >
            Navigation
          </ResizablePanel>
          <ResizableHandle aria-label="Resize navigation" />
          <ResizablePanel minSize="40%" style={pane}>
            Page
          </ResizablePanel>
        </Resizable>
      </div>
    </div>
  );
}
```

A panel folded to nothing still has its content in the page. It's made `inert` while there's no room for it, so Tab and a screen reader pass it by. `collapsedSize` leaves some of the panel showing, for a rail of icons, and then what's in it stays in reach.

## Remembering the sizes

`useResizableLayout` keeps the sizes in the browser's `localStorage` under a name, and gives them back on the next visit. It does without, quietly, where storage is missing or refused. Each panel needs an `id`, which is what its size is kept under. Resize these and load the page again.

```tsx
"use client";

import {
  Resizable,
  ResizableHandle,
  ResizablePanel,
  useResizableLayout,
} from "@nuvui/react";

const pane = { padding: 16 };

export default function Example() {
  // Kept in the browser's own storage, under this name.
  const { defaultLayout, onLayoutChanged } = useResizableLayout({
    id: "docs-resizable-saved",
  });

  return (
    <div
      style={{
        inlineSize: "100%",
        blockSize: 220,
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      <Resizable
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
      >
        <ResizablePanel id="list" minSize="20%" style={pane}>
          List
        </ResizablePanel>
        <ResizableHandle withGrip aria-label="Resize list" />
        <ResizablePanel id="detail" minSize="20%" style={pane}>
          Detail
        </ResizablePanel>
      </Resizable>
    </div>
  );
}
```

It takes a `storage` of your own, anything with `getItem` and `setItem`, for keeping them in a cookie or on your server. To save them yourself, `onLayoutChanged` is called with every panel's size once a drag has ended. `onLayoutChange`, without the d, is called all through the drag.

A page drawn on a server doesn't know what the browser kept, so it draws the default sizes and the kept ones are put in place once the browser has the page. With a `storage` of yours that reads a cookie, the server knows them too, and nothing moves.

## Resizable props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Which way the panels are set out: side by side, or one above another. |
| `defaultLayout` | `Layout` |  | The size of each panel at first, by its `id`, as a share of 100. For putting back sizes you saved. Without it each panel's `defaultSize` is used. |
| `onLayoutChange` | `((layout: Layout) => void)` |  | Called with every panel's size while they change: for each pixel of a drag, many times a second. |
| `onLayoutChanged` | `((layout: Layout, meta: LayoutChangedMeta) => void)` |  | Called once the sizes have settled: when a drag ends, or a key is pressed. This is the one to save from. |
| `disabled` | `boolean` | `false` | Panels that can't be resized. The handles stay where they are and can't be moved or reached with Tab. |
| `groupRef` | `Ref<GroupImperativeHandle \| null>` |  | A ref to read every panel's size from, and to set them. |

It also takes what a `div` takes, including `ref` and `className`, and the rest of what react-resizable-panels' `Group` takes.

## useResizableLayout

| Option | What it is |
| --- | --- |
| `id` | A name for these panels. Their sizes are kept under `nuv-resizable:` and the name. |
| `storage` | Where to keep them: anything with `getItem` and `setItem`. `localStorage` unless you say. |

It returns `defaultLayout` and `onLayoutChanged`, to give to the `Resizable`. `useResizablePanelRef` and `useResizableRef` make the refs for `panelRef` and `groupRef`.

## ResizablePanel props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `id` | `string` |  | What the panel is known by in a layout. Give one to every panel whose size you save or set. |
| `defaultSize` | `string \| number` |  | The panel's size at first. A number is pixels, and a string is a share of the whole (`"30%"`) or a length (`"20rem"`). Without it the panels share the room equally. |
| `minSize` | `string \| number` | `"0%"` | The least it can be, written the same way. |
| `maxSize` | `string \| number` | `"100%"` | The most it can be. |
| `collapsible` | `boolean` | `false` | Whether the panel folds away when it's dragged to well under its `minSize`. Enter on the handle after it folds it and opens it again. |
| `collapsedSize` | `string \| number` | `"0%"` | How much of a folded panel is left showing. |
| `onResize` | `((size: PanelSize, id: string \| number \| undefined, before: PanelSize \| undefined) => void)` |  | Called with the panel's size, in pixels and as a share, when it changes. |
| `panelRef` | `Ref<PanelImperativeHandle \| null>` |  | A ref to fold the panel and open it from, to resize it, and to ask whether it's folded. |
| `disabled` | `boolean` | `false` | A panel that keeps its size, whatever is dragged. |

It also takes what a `div` takes. A panel is two boxes: `ref`, `id` and the rest go on the outer one, which is sized, and `className` and `style` on the inner one, around your content.

## ResizableHandle props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `withGrip` | `boolean` | `false` | Whether the handle shows a grip: a mark in the middle of the line that says it can be dragged. |
| `disabled` | `boolean` | `false` | A handle that can't be moved. The panels either side can still change size when another handle is. |
| `aria-label` | `string` | `"Resize"` | What a screen reader calls the handle. Say what it resizes when the page has more than one. |
| `children` | `ReactNode` |  | Something of yours in place of the grip. |

It also takes what a `div` takes, including `ref` and `className`.

## Accessibility

It follows the [window splitter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/) of the ARIA Authoring Practices.

### Keyboard

A handle is a stop for Tab. On it:

| Key | What it does |
| --- | --- |
| Right, Left | Between panels side by side: moves the handle that way, by 5 in 100. |
| Down, Up | Between panels one above another: the same. |
| Home | Makes the panel before the handle as small as it can be. |
| End | Makes it as large as it can be. |
| Enter | Folds a `collapsible` panel before the handle, or opens it. |
| F6 | Moves to the next handle. With Shift, to the one before. |

In a right-to-left page the panels are the other way round. Right and Left still move the handle the way they point, and the handle says the size of the panel on its left, which is then the one after it.

### What the component handles

- A handle is a `separator` that can take focus, with the size of the panel before it as its value, from 0 to 100, and that panel named in `aria-controls`.
- What takes a press is wider than the line that's drawn: 44 pixels with a finger and 10 with a mouse.
- The line is a border, which is still drawn where the browser forces its own colors.
- A disabled handle is out of the Tab order and says it's disabled. So is every handle of a disabled `Resizable`.
- A panel that scrolls and has nothing in it to focus takes focus itself, so it can be scrolled from the keyboard. Then it's a `group`, with the `aria-label` you gave the panel.
- A panel folded to nothing is `inert`: what's in it can't be reached while it can't be seen.
- A double press on a handle puts the panel before it back to its `defaultSize`.

### What you need to handle

- Name each handle with `aria-label` after the panel it resizes, such as "Resize navigation". It's called "Resize" until you do, which says little where there's more than one.
- Give every panel a `minSize` that still fits what's in it.
- Don't make a drag the only way to a size that matters. The arrow keys are one other way. A button that folds a panel, or a few sizes to choose from, is one for people who use a pointer and can't drag.
- The line is as faint as any other border. Where people have to find it, give the handle `withGrip`, or make `--nuv-resizable-line` darker.
- Give a panel that may scroll an `aria-label` that says what's in it.

## On small screens

Panels side by side on a phone leave neither enough room. Put them one above another there, or show one at a time. `orientation` is a prop, so change it from a media query of your own.

A drag on a handle moves the handle and not the page. Inside a panel the page still scrolls the other way.

## CSS variables

Set any of these on the `Resizable`, or on anything around it.

```css
.workspace {
  --nuv-resizable-line-width: 2px;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-resizable-fg` | `var(--color-foreground)` | Color of the text in the panels. |
| `--nuv-resizable-line` | `var(--color-border)` | Color of the line between two panels. |
| `--nuv-resizable-line-width` | `1px` | Thickness of that line. |
| `--nuv-resizable-line-active` | `var(--color-primary)` | Color of the line under the pointer, and while it's dragged. |
| `--nuv-resizable-grip-bg` | `var(--color-background)` | Background of the grip. |
| `--nuv-resizable-grip-fg` | `var(--color-muted-foreground)` | Color of the dots in the grip. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-resizable` | Resizable |
| `.nuv-resizable__grip` | The grip in the middle of a handle. |
| `.nuv-resizable__handle` | ResizableHandle |
| `.nuv-resizable__panel` | The box around a ResizablePanel's content. |

A handle has `data-separator`, which is `inactive`, `hover`, `active` while it's dragged, `focus` or `disabled`, and `aria-orientation`, which says which way the line itself lies. A disabled panel has `data-disabled`.

## Server components

Resizable starts with `"use client"`: it keeps the panels' sizes. You can render it from a server component with panels written there, as long as you leave out `onLayoutChange`, `onLayoutChanged` and `onResize`, since a function can't be passed from the server.

## Do and don't

**Do**

- Start with sizes that suit most people. Most never touch a handle.
- Save the sizes someone chose. Having to set them again on every visit is worse than not being able to.

**Don't**

- Don't use it for a table's columns. [DataTable](../table/index.md) resizes its own.
- Don't put more than three or four panels in a row. Each handle moved changes the room the others have.
