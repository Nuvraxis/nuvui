<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/alert.mdx. Don't edit it here: run `pnpm skill`. -->

# Alert

A message that sits in the page, with an icon and a color that say what kind of message it is.

Use an alert for something people should read before they carry on with the page: a payment that failed, a trial about to end, a change that's coming. It stays where it is until the reason for it is gone.

For a message about something that just happened and needs no action, use a [toast](toast.md). For a question that has to be answered first, use an [alert dialog](alert-dialog.md).

```tsx
import { Alert, AlertDescription, AlertTitle } from "@nuvui/react";

export default function Example() {
  return (
    <Alert style={{ width: "100%", maxWidth: 480 }}>
      <AlertTitle>Maintenance on Saturday</AlertTitle>
      <AlertDescription>
        Reports will be read-only from 22:00 to midnight while the database is
        moved.
      </AlertDescription>
    </Alert>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { Alert, AlertDescription, AlertTitle } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Alert` | The box, with the icon. |
| `AlertTitle` | What happened, in a few words. |
| `AlertDescription` | The detail, and what to do about it. |
| `AlertActions` | A row of buttons or links under the text. |

## Props

### Alert

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `intent` | `"danger" \| "info" \| "success" \| "warning"` | `"info"` | What kind of message it is. It sets the icon and the color, and the default `role`. |
| `icon` | `ReactNode` |  | An icon to draw in place of the intent's own. Pass `null` or `false` for none. |

It also takes what a `<div>` takes. `role` is the one to know about, and [the section below](#when-a-screen-reader-reads-it) covers it.

### AlertTitle

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | Render the single child element instead of a `div`, and give it the title's class and props. Use it to make the title a heading. |

`AlertDescription` and `AlertActions` add no props of their own.

## Intents

Each intent has its own icon as well as its own color, so the kind of message doesn't depend on telling colors apart.

```tsx
import { Alert, AlertDescription, AlertTitle } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        width: "100%",
        maxWidth: 480,
      }}
    >
      <Alert intent="info">
        <AlertTitle>A new version is ready</AlertTitle>
        <AlertDescription>Reload the page to get it.</AlertDescription>
      </Alert>
      <Alert intent="success">
        <AlertTitle>Invoice sent</AlertTitle>
        <AlertDescription>
          Northwind Traders will get it by email.
        </AlertDescription>
      </Alert>
      <Alert intent="warning">
        <AlertTitle>Your trial ends in three days</AlertTitle>
        <AlertDescription>
          Add a card to keep the projects you've made.
        </AlertDescription>
      </Alert>
      <Alert intent="danger">
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>
          The card ending in 4242 was declined.
        </AlertDescription>
      </Alert>
    </div>
  );
}
```

The color is on the edge and the icon. The text keeps the ordinary text color in every intent, which is what keeps it readable in every theme.

## With actions

Put the buttons in `AlertActions`. They wrap onto a second line when the alert is narrow.

```tsx
import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertTitle,
  Button,
} from "@nuvui/react";

export default function Example() {
  return (
    <Alert intent="danger" style={{ width: "100%", maxWidth: 480 }}>
      <AlertTitle>Payment failed</AlertTitle>
      <AlertDescription>
        The card ending in 4242 was declined. The plan stays active until 1
        March.
      </AlertDescription>
      <AlertActions>
        <Button size="sm">Update the card</Button>
        <Button size="sm" intent="ghost">
          Contact support
        </Button>
      </AlertActions>
    </Alert>
  );
}
```

## When a screen reader reads it

An alert has a `role` that depends on its intent.

| Intent | Role | What a screen reader does when the alert is added to the page |
| --- | --- | --- |
| `info`, `success` | `status` | Reads it at the next pause. |
| `warning`, `danger` | `alert` | Stops what it's saying and reads it at once. |

That only happens for an alert that's added after the page has loaded, as in the example below. One that's in the page from the start isn't read out. It's read when the visitor gets to it, like any other text.

```tsx
"use client";

import { Alert, AlertDescription, AlertTitle, Button } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [failed, setFailed] = useState(false);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        justifyItems: "start",
        width: "100%",
        maxWidth: 480,
      }}
    >
      <Button onClick={() => setFailed((value) => !value)}>
        {failed ? "Clear the error" : "Save with an error"}
      </Button>
      {failed ? (
        <Alert intent="danger" style={{ width: "100%" }}>
          <AlertTitle>The changes weren't saved</AlertTitle>
          <AlertDescription>
            The server didn't answer. Try again in a moment.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
```

Two cases call for a different role:

- **A warning that's part of the page**, such as a note above a form about what the form does. It was never news, so `role="note"` describes it better. Nothing changes for an alert that's there from the start, but the role is also what a screen reader says when the visitor reaches it.
- **Many alerts added at once.** Each one with `role="alert"` interrupts the one before. Put the messages in one alert.

A screen reader only notices an alert that's added to the page. One that's there all the time and shown with CSS, or whose text you change, is announced in some combinations of browser and screen reader and not in others. Render the alert when there's something to say, as the example does.

## On small screens

An alert takes the width it's given, and its text wraps. A long word or address breaks, so the page doesn't scroll sideways. The icon stays at the top, next to the title.

## Accessibility

An alert has no keyboard behavior of its own. It doesn't take focus, and it shouldn't: moving focus to a message takes it away from what the visitor was doing.

### What the component handles

- The `role`, by intent.
- The icon is hidden from screen readers. The title says what the icon shows.
- The icon and the edge have at least 3:1 against the alert in every theme, and the text at least 4.5:1.
- The edge is a border, which is still drawn where the browser forces its own colors.
- In a right-to-left layout the icon is on the right.

### What you need to handle

- Write a title that says what happened without the icon or the color: "Payment failed", not "Error".
- Say what to do next in the description, or offer it as a button.
- If a danger alert is about a form that was just sent, also move focus to the first field with a problem. The [forms guide](../forms.md) shows how.
- Don't remove an alert on a timer. People read at different speeds, and some use a screen magnifier that shows a small part of the page at a time.

## CSS variables

Set any of these on `Alert`, or on anything around it. A variable set this way applies whatever the intent.

```css
.billing {
  --nuv-alert-radius: var(--radius-md);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-alert-gap` | `calc(var(--spacing) * 3)` | Space between the icon and the text. |
| `--nuv-alert-padding` | `calc(var(--spacing) * 4)` | Padding inside the box. |
| `--nuv-alert-border` | `var(--color-border)`, `var(--color-primary)`, `var(--color-success)`, `var(--color-warning)`, `var(--color-danger)` | Border color. The intent's color by default. |
| `--nuv-alert-radius` | `var(--radius-lg)` | Corner radius. |
| `--nuv-alert-bg` | `var(--color-surface)` | Background color. |
| `--nuv-alert-fg` | `var(--color-surface-foreground)` | Text color of the title, and of anything outside the description. |
| `--nuv-alert-icon` | `var(--color-primary)`, `var(--color-success)`, `var(--color-warning)`, `var(--color-danger)` | Color of the icon. The intent's color by default. |
| `--nuv-alert-muted-fg` | `var(--color-muted-foreground)` | Text color of the description. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-alert` | Every alert. |
| `.nuv-alert--danger` | intent="danger" |
| `.nuv-alert--info` | intent="info" |
| `.nuv-alert--success` | intent="success" |
| `.nuv-alert--warning` | intent="warning" |
| `.nuv-alert__actions` | AlertActions. |
| `.nuv-alert__body` | The element around everything that isn't the icon. |
| `.nuv-alert__description` | AlertDescription. |
| `.nuv-alert__icon` | The element around the icon. |
| `.nuv-alert__title` | AlertTitle. |

## Server components

The alert parts have no `"use client"` directive and use no state, so they render in a server component as they are.

## Do and don't

**Do**

- Put an alert next to what it's about: above the form, inside the card.
- Use `danger` for something that went wrong and `warning` for something that will if nothing is done.

**Don't**

- Don't use an alert for praise or for marketing. People learn to skip a box they've seen cry wolf.
- Don't stack three alerts at the top of a page. Decide which one matters.
