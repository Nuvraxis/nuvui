<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/dialog.mdx. Don't edit it here: run `pnpm skill`. -->

# Dialog

A modal window that takes over the page until it's closed. A sheet on phones, centered on larger screens.

Use a dialog when someone has to answer or finish something before going on: confirming a delete, filling in a short form. It blocks the rest of the page, so don't use it for information people may want to keep open while they work.

```tsx
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@nuvui/react";

export default function Example() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Delete project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete this project?</DialogTitle>
        <DialogDescription>
          The project and its 12 files will be removed. This can't be undone.
        </DialogDescription>
        <DialogFooter>
          <DialogClose asChild>
            <Button intent="secondary">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button intent="danger">Delete project</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that.

## Parts

| Part | What it is |
| --- | --- |
| `Dialog` | Holds the open state. Renders nothing itself. |
| `DialogTrigger` | The button that opens the dialog. |
| `DialogContent` | The panel. It also renders the overlay behind it and the close button in its corner. |
| `DialogTitle` | The heading. Required, because it's the dialog's accessible name. |
| `DialogDescription` | A sentence or two under the title, announced when the dialog opens. |
| `DialogHeader` | Optional. Holds the title and description when the dialog has a `DialogBody`. |
| `DialogBody` | Optional. The part that scrolls when the content is taller than the screen. |
| `DialogFooter` | A row for the action buttons. |
| `DialogClose` | Closes the dialog when pressed. Wrap your own button with `asChild`. |

These are separate exports, not properties of `Dialog`. `Dialog.Content` isn't available, because property access on a client component doesn't work from a server component.

## Props

`DialogContent` adds these to what Radix provides:

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `size` | `"lg" \| "md" \| "sm"` | `"md"` | The widest the dialog gets once the screen is big enough to center it. On a phone it's always a full-width sheet. |
| `showCloseButton` | `boolean` | `true` | Whether to render the close button in the corner. If you turn it off, give people another visible way to close the dialog. |
| `closeLabel` | `string` | `"Close"` | Accessible name of the close button. Translate it with the rest of your interface. |
| `container` | `DocumentFragment \| Element \| null` | `document.body` | The element the dialog is rendered into. Set this when the dialog should pick up a `data-theme` from a section of the page. |

`Dialog`, `DialogTrigger`, `DialogClose`, `DialogTitle` and `DialogDescription` take the same props as the Radix parts they wrap, including `open`, `defaultOpen`, `onOpenChange`, `modal` and `asChild`. The [Radix Dialog reference](https://www.radix-ui.com/primitives/docs/components/dialog#api-reference) lists them.

`DialogHeader`, `DialogBody` and `DialogFooter` are plain `div` elements. They take `ref`, `className` and anything else a `div` does.

## Sizes

```tsx
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@nuvui/react";

const sizes = ["sm", "md", "lg"] as const;

export default function Example() {
  return (
    <>
      {sizes.map((size) => (
        <Dialog key={size}>
          <DialogTrigger asChild>
            <Button intent="secondary">Open {size}</Button>
          </DialogTrigger>
          <DialogContent size={size}>
            <DialogTitle>Size {size}</DialogTitle>
            <DialogDescription>
              On a phone every size is the same full-width sheet. The sizes only
              differ once there's room to center the dialog.
            </DialogDescription>
          </DialogContent>
        </Dialog>
      ))}
    </>
  );
}
```

`size` sets the maximum width once the screen is at least 40rem wide: 24rem for `sm`, 32rem for `md` and 48rem for `lg`. Below that, the dialog is a sheet across the bottom of the screen whatever the size.

It's never taller than the screen. If the content is longer, it scrolls. [Long content](#long-content) covers which part does.

## Long content

Put the title and description in `DialogHeader`, the content in `DialogBody` and the buttons in `DialogFooter`. The header and footer stay where they are, and the body scrolls between them, so the title and the buttons are always in view.

```tsx
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@nuvui/react";

const changes = [
  ["Billing", "Invoices are now sent on the first working day of the month."],
  ["Seats", "A seat is counted from the day an invitation is accepted."],
  ["Exports", "Exports include archived projects unless you leave them out."],
  ["Sign-in", "Single sign-on can be required for everyone in a workspace."],
  ["Storage", "Files in the trash count towards storage until it's emptied."],
  ["Roles", "A project can have more than one owner."],
  ["Audit log", "Entries are kept for a year, then removed."],
  ["Notifications", "Email digests are sent weekly unless you change it."],
  ["API", "Tokens expire after 90 days and can be renewed before they do."],
  ["Support", "Replies come within one working day on every plan."],
];

export default function Example() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button intent="secondary">What's changing</Button>
      </DialogTrigger>
      {/* Kept short here, so that the body scrolls on a large screen too. */}
      <DialogContent style={{ maxBlockSize: "26rem" }}>
        <DialogHeader>
          <DialogTitle>Changes to your plan</DialogTitle>
          <DialogDescription>
            These apply from your next renewal.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <dl style={{ display: "grid", gap: 16, margin: 0 }}>
            {changes.map(([area, change]) => (
              <div key={area}>
                <dt style={{ fontWeight: 600 }}>{area}</dt>
                <dd style={{ margin: 0 }}>{change}</dd>
              </div>
            ))}
          </dl>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button intent="secondary">Not now</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>Accept changes</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

Without a `DialogBody`, the whole panel scrolls, and the title and buttons scroll away with the rest. That's fine for a dialog that rarely gets that tall.

The body's scrollbar sits on the edge of the panel. Its text still lines up with the title, because the body has the same padding at its sides as the panel.

## Controlling it yourself

Pass `open` and `onOpenChange` when something else decides when the dialog closes, such as a save that has to finish first.

```tsx
"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    // Stands in for a request to your server.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSaving(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Rename project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Rename project</DialogTitle>
        <DialogDescription>
          The dialog stays open until the save has finished.
        </DialogDescription>
        <DialogFooter>
          <Button intent="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={save}>
            {saving ? "Saving" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | On the trigger, opens the dialog. |
| <kbd>Tab</kbd> | Moves to the next control inside the dialog. From the last one it goes back to the first. |
| <kbd>Shift</kbd> + <kbd>Tab</kbd> | Moves to the previous control, and from the first to the last. |
| <kbd>Esc</kbd> | Closes the dialog. |
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>Page Up</kbd> <kbd>Page Down</kbd> | Scroll the body, when it has focus. |

### What the component handles

Most of this is Radix. The library doesn't change it.

- The panel has `role="dialog"`, named by `DialogTitle` and described by `DialogDescription`.
- Opening moves focus to the first control in the content. Closing returns it to the trigger.
- Focus can't leave the dialog while it's open, and the rest of the page is hidden from screen readers.
- The trigger gets `aria-haspopup="dialog"` and `aria-expanded`.
- The close button is a real button with an accessible name, and is at least 44 pixels on touch screens. This matters on phones, where there's no <kbd>Esc</kbd> key.
- A `DialogBody` that scrolls and has nothing inside that takes focus becomes a tab stop itself, named after the dialog. Without that, someone who doesn't use a mouse would have no way to scroll it. A body that fits, or that holds a field or a button, is left alone.
- The open and close animations only run when the visitor hasn't asked for reduced motion.

### What you need to handle

- Always include a `DialogTitle`. If the design has no visible heading, hide it visually but keep it.
- If you leave out `DialogDescription`, pass `aria-describedby={undefined}` to `DialogContent`, or Radix logs a warning.
- Translate `closeLabel` along with the rest of your interface.

## CSS variables

Dialogs render at the end of `<body>`, so set these on `:root` or `body`, not on the element around the trigger.

```css
:root {
  --nuv-dialog-radius: var(--radius-md);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-dialog-overlay-bg` | `var(--color-overlay)` | Color of the layer that dims the page. |
| `--nuv-dialog-padding` | `calc(var(--spacing) * 6)` | Padding inside the panel. One length, used on every side. |
| `--nuv-dialog-border` | `var(--color-border)` | Border color of the panel. |
| `--nuv-dialog-bg` | `var(--color-surface)` | Background color of the panel. |
| `--nuv-dialog-shadow` | `var(--shadow-xl)` | Shadow under the panel. |
| `--nuv-dialog-fg` | `var(--color-surface-foreground)` | Text color. |
| `--nuv-dialog-radius` | `var(--radius-xl)` | Corner radius. As a sheet on phones, only the top corners are rounded. |
| `--nuv-dialog-width` | `32rem`, `24rem`, `48rem` | Maximum width once the dialog is centered. Differs by size. |

## Classes

The overlay and the panel sit next to each other in the page, not one inside the other. That's why the overlay is its own flat class.

| Class | What it's on |
| --- | --- |
| `.nuv-dialog` | The panel. |
| `.nuv-dialog--lg` | The panel with size="lg". |
| `.nuv-dialog--sm` | The panel with size="sm". |
| `.nuv-dialog__body` | DialogBody. |
| `.nuv-dialog__close` | The close button in the corner. |
| `.nuv-dialog__description` | DialogDescription. |
| `.nuv-dialog__footer` | DialogFooter. |
| `.nuv-dialog__header` | DialogHeader. |
| `.nuv-dialog__overlay` | The layer behind the panel. |
| `.nuv-dialog__title` | DialogTitle. |

The panel also gets `nuv-dialog--md` at the default size. No styles are attached to it, since medium is the base.

Radix sets `data-state="open"` or `data-state="closed"` on the overlay and the panel. The animations hang off those.

## Server components

The dialog parts are client components. They carry `"use client"`, and the build checks that the directive is still there in the published files.

You can still put a dialog together inside a server component, as in the first example on this page. It only needs a client component of its own when you add state or handlers, as in the controlled example.

## Themed sections

A dialog opened from inside a `data-theme="dark"` section doesn't inherit that theme, because it isn't rendered inside the section. Pass the section's element as `container` and it will be.

## Do and don't

**Do**

- Name the buttons after what they do. "Delete project" and "Cancel", not "Yes" and "No".
- Keep it short. If it needs its own navigation, it should be a page.
- Leave the close button in, unless there's another visible way out.

**Don't**

- Don't open a dialog from inside a dialog.
- Don't open one without the person doing something to ask for it.
- Don't put the only copy of important information in one. It's gone once it's closed.
