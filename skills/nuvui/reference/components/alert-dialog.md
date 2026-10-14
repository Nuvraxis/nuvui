<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/alert-dialog.mdx. Don't edit it here: run `pnpm skill`. -->

# Alert dialog

A dialog that stops everything to ask one question, with a button to go ahead and a button to back out.

Use an alert dialog to confirm something that can't be taken back: deleting a project, revoking access, leaving a form with unsaved changes. It differs from a [dialog](dialog.md) in three ways. A click outside doesn't close it, it has no close button in its corner, and focus starts on the button that changes nothing.

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "@nuvui/react";

export default function Example() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button intent="danger">Delete project</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Delete this project?</AlertDialogTitle>
        <AlertDialogDescription>
          The project and its 12 files will be removed. This can't be undone.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction intent="danger">Delete project</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that. If you load one stylesheet per component, this one needs `button.css` next to `alert-dialog.css`, because its two buttons are the library's [Button](button.md).

## Parts

| Part | What it is |
| --- | --- |
| `AlertDialog` | Holds the open state. Renders nothing itself. |
| `AlertDialogTrigger` | The button that opens the dialog. Wrap your own with `asChild`. |
| `AlertDialogContent` | The panel. It also renders the overlay behind it. |
| `AlertDialogTitle` | The question. Required, because it's the dialog's accessible name. |
| `AlertDialogDescription` | What will happen. It becomes the dialog's accessible description. |
| `AlertDialogFooter` | A row for the two buttons. |
| `AlertDialogCancel` | The button that backs out. It closes the dialog, and is where focus starts. |
| `AlertDialogAction` | The button that goes ahead. It closes the dialog after its `onClick` has run. |

These are separate exports, not properties of `AlertDialog`. `AlertDialog.Content` isn't available, because property access on a client component doesn't work from a server component.

## Props

### AlertDialogContent

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `size` | `"lg" \| "md" \| "sm"` | `"md"` | The widest the dialog gets once the screen is big enough to center it. On a phone it's always a full-width sheet. |
| `container` | `DocumentFragment \| Element \| null` | `document.body` | The element the dialog is rendered into. Set this when the dialog should pick up a `data-theme` from a section of the page. |

### AlertDialogAction and AlertDialogCancel

Both are a [Button](button.md) and take every prop a button does. `AlertDialogCancel` starts with `intent="secondary"`, and `AlertDialogAction` with the button's own default, `"primary"`.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `intent` | `"danger" \| "ghost" \| "primary" \| "secondary"` | `"primary"` | How the button looks. Use `"danger"` on the action when it destroys something. |
| `onClick` | `MouseEventHandler<HTMLButtonElement>` |  | Runs before the dialog closes. Call `event.preventDefault()` in it to keep the dialog open. |
| `disabled` | `boolean` |  | Stops the button from being pressed. |
| `asChild` | `boolean` | `false` | Renders the element you pass in place of a `button`, such as a link, with the button's look and the closing behavior. |

### AlertDialog

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `open` | `boolean` |  | Whether it's open, when you control it yourself. Use it with `onOpenChange`. |
| `defaultOpen` | `boolean` |  | Whether it starts open, when you don't control it. |
| `onOpenChange` | `((open: boolean) => void)` |  | Called when it opens or closes. |

`AlertDialogTrigger`, `AlertDialogTitle` and `AlertDialogDescription` take the same props as the Radix parts they wrap. The [Radix Alert Dialog reference](https://www.radix-ui.com/primitives/docs/components/alert-dialog#api-reference) lists them. `AlertDialogFooter` is a plain `div`.

## Waiting for the action to finish

By default the action closes the dialog at once. When the work can fail, or takes a moment, keep the dialog open until it's done: control `open`, and call `event.preventDefault()` in the action's `onClick`.

```tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "@nuvui/react";
import { type MouseEvent, useRef, useState } from "react";

// Stands in for a request to your server. So that both endings can be
// seen, the first one fails and the next goes through.
let tried = 0;
async function revokeAccess() {
  await new Promise((resolve) => setTimeout(resolve, 600));
  tried += 1;
  if (tried === 1) throw new Error("The server didn't answer.");
}

export default function Example() {
  const [open, setOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const [problem, setProblem] = useState("");
  const status = useRef<HTMLParagraphElement>(null);

  async function revoke(event: MouseEvent) {
    // Keeps the dialog open. It closes below, once the request is through.
    event.preventDefault();
    setRevoking(true);
    setProblem("");
    try {
      await revokeAccess();
      setRevoked(true);
      setOpen(false);
    } catch {
      // It didn't go through, so the dialog stays, says so, and can be
      // tried again or left.
      setProblem("Access couldn't be revoked. Try again.");
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setProblem("");
        }}
      >
        <AlertDialogTrigger asChild>
          <Button intent="secondary" disabled={revoked}>
            Revoke access
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent
          size="sm"
          onCloseAutoFocus={(event) => {
            // Once it's done, the button that opened this is disabled and
            // can't take the focus back. The line that says what happened
            // takes it.
            if (!revoked) return;
            event.preventDefault();
            status.current?.focus();
          }}
        >
          <AlertDialogTitle>Revoke Sam's access?</AlertDialogTitle>
          <AlertDialogDescription>
            Sam will be signed out and won't be able to open the workspace.
          </AlertDialogDescription>
          {problem && (
            <p role="alert" style={{ margin: 0, color: "var(--color-danger)" }}>
              {problem}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>
              Keep access
            </AlertDialogCancel>
            <AlertDialogAction
              intent="danger"
              disabled={revoking}
              onClick={revoke}
            >
              {revoking ? "Revoking" : "Revoke access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <p ref={status} tabIndex={-1} style={{ margin: 0, fontSize: 14 }}>
        {revoked ? "Sam no longer has access." : "Sam has access."}
      </p>
    </div>
  );
}
```

Disable both buttons while the request is running, so it can't be sent twice or abandoned halfway.

When the work fails, leave the dialog open and say so inside it, in an element with `role="alert"` so it's read out. The buttons come back, to try again or to leave. The example's first try fails, so that this can be seen.

When it's done, the button that opened the dialog is often gone or disabled, as here, and the focus has nowhere to go back to. Say where it goes in `onCloseAutoFocus`: the line that says what happened, or whatever comes after what was removed.

## Opening one from a menu

A destructive item in a [dropdown menu](dropdown-menu.md) should ask before it acts. Put the alert dialog next to the menu, not inside the item, and open it from the item's `onSelect`.

```tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@nuvui/react";
import { useRef, useState } from "react";

export default function Example() {
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button ref={menuButton} intent="secondary" disabled={deleted}>
            File
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            intent="danger"
            onSelect={() => setConfirming(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Next to the menu, not inside the item. The menu takes its items off
          the page when it closes, and the dialog would go with them. */}
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent
          size="sm"
          // The dialog would put focus back where it was when it opened,
          // which is the menu item, and that's gone. Send it to the button.
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            menuButton.current?.focus();
          }}
        >
          <AlertDialogTitle>Delete report.pdf?</AlertDialogTitle>
          <AlertDialogDescription>
            It goes to the trash, and is removed for good after 30 days.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction intent="danger" onClick={() => setDeleted(true)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p style={{ margin: 0, fontSize: 14 }}>
        {deleted ? "report.pdf is in the trash." : "report.pdf"}
      </p>
    </div>
  );
}
```

There's no trigger here for focus to go back to when the dialog closes. Left alone, Radix returns it to whatever had it when the dialog opened, which is the menu item, and that's no longer on the page. So the example says where it should go, in `onCloseAutoFocus`: the button that opened the menu.

## Sizes

`size` sets the maximum width once the screen is at least 40rem wide: 24rem for `sm`, 32rem for `md` and 48rem for `lg`. Below that the dialog is a sheet across the bottom of the screen, with the action on top and cancel under it, each as wide as the sheet.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | On the trigger, opens the dialog. On a button inside, presses it. |
| <kbd>Tab</kbd> | Moves between the two buttons. From the last it goes back to the first. |
| <kbd>Shift</kbd> + <kbd>Tab</kbd> | The same, backwards. |
| <kbd>Esc</kbd> | Closes the dialog, as cancel does. |

### What the component handles

Most of this is Radix. The library doesn't change it.

- The panel has `role="alertdialog"`, named by `AlertDialogTitle` and described by `AlertDialogDescription`.
- Opening moves focus to `AlertDialogCancel`, so that pressing <kbd>Enter</kbd> without reading does no harm. Closing returns focus to the trigger.
- Focus can't leave the dialog while it's open, and the rest of the page is hidden from screen readers.
- A click or tap on the page behind does nothing. The person has to pick one of the two buttons, or press <kbd>Esc</kbd>.
- Both buttons are at least 44 pixels tall on a touch screen.
- The open and close animations only run when the visitor hasn't asked for reduced motion.

### What you need to handle

- Write the title as the question, and name the action after what it does: "Delete project", not "OK" or "Yes".
- Always include an `AlertDialogCancel`. Without one, focus has nowhere safe to start.
- Always include an `AlertDialogDescription` that says what will happen. If the title says it all, pass `aria-describedby={undefined}` to `AlertDialogContent`, or Radix logs a warning.
- If <kbd>Esc</kbd> must not close the dialog, call `event.preventDefault()` in `onEscapeKeyDown` on `AlertDialogContent`. Then the two buttons are the only ways out, so make sure both work.

## CSS variables

Alert dialogs render at the end of `<body>`, so set these on `:root` or `body`, not on the element around the trigger. They're separate from the dialog's variables: changing `--nuv-dialog-radius` doesn't change an alert dialog.

```css
:root {
  --nuv-alert-dialog-width: 28rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-alert-dialog-overlay-bg` | `var(--color-overlay)` | Color of the layer that dims the page. |
| `--nuv-alert-dialog-padding` | `calc(var(--spacing) * 6)` | Padding inside the panel. One length, used on every side. |
| `--nuv-alert-dialog-border` | `var(--color-border)` | Border color of the panel. |
| `--nuv-alert-dialog-bg` | `var(--color-surface)` | Background color of the panel. |
| `--nuv-alert-dialog-shadow` | `var(--shadow-xl)` | Shadow under the panel. |
| `--nuv-alert-dialog-fg` | `var(--color-surface-foreground)` | Text color. |
| `--nuv-alert-dialog-radius` | `var(--radius-xl)` | Corner radius. As a sheet on phones, only the top corners are rounded. |
| `--nuv-alert-dialog-width` | `32rem`, `24rem`, `48rem` | Maximum width once the dialog is centered. Differs by size. |

The two buttons read the [button's variables](button.md#css-variables).

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-alert-dialog` | The panel. |
| `.nuv-alert-dialog--lg` | The panel with size="lg". |
| `.nuv-alert-dialog--sm` | The panel with size="sm". |
| `.nuv-alert-dialog__description` | AlertDialogDescription. |
| `.nuv-alert-dialog__footer` | AlertDialogFooter. |
| `.nuv-alert-dialog__overlay` | The layer behind the panel. |
| `.nuv-alert-dialog__title` | AlertDialogTitle. |

The panel also gets `nuv-alert-dialog--md` at the default size. No styles are attached to it, since medium is the base. The two buttons have the button's classes, such as `nuv-button` and `nuv-button--danger`.

Radix sets `data-state="open"` or `data-state="closed"` on the overlay and the panel. The animations hang off those.

## Server components

The alert dialog parts are client components. They carry `"use client"`, and the build checks that the directive is still there in the published files.

You can put one together inside a server component, as the first example on this page does. It needs a client component of your own once the action has an `onClick`, which is most of the time.

## Themed sections

An alert dialog opened from inside a `data-theme="dark"` section doesn't inherit that theme, because it isn't rendered inside the section. Pass the section's element as `container` and it will be.

## Do and don't

**Do**

- Keep it for actions that can't be undone, or that cost something to undo.
- Say what will be lost, in numbers when you have them: "its 12 files".
- Give the action `intent="danger"` when it destroys something.

**Don't**

- Don't use one for an action that can be undone. Do it, and offer the undo in a [toast](toast.md).
- Don't use one to report an error or a success. Nothing is being asked.
- Don't put a form in one. That's a [dialog](dialog.md).
