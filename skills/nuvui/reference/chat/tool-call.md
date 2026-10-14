<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/chat/tool-call.mdx. Don't edit it here: run `pnpm skill`. -->

# ToolCall

Something an assistant did, or asks to do, with a tool. A card with the tool's name and where the call stands, which opens to what was asked and what came back, and asks for approval when it needs it.

Use a tool call where an assistant acts and doesn't only answer: it searches, reads a record, sends something. The card says which tool and where the call stands. What was asked and what came back are a press away, for the reader who wants to check.

```tsx
import {
  ToolCall,
  ToolCallContent,
  ToolCallError,
  ToolCallInput,
  ToolCallOutput,
  ToolCallTrigger,
} from "@nuvui/chat";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <ToolCall status="done" defaultOpen>
        <ToolCallTrigger>Search invoices</ToolCallTrigger>
        <ToolCallContent>
          <ToolCallInput value={{ status: "overdue", customer: "Contoso" }} />
          <ToolCallOutput
            value={[
              { number: "INV-1042", amount: 4200, daysLate: 12 },
              { number: "INV-1057", amount: 1150, daysLate: 3 },
            ]}
          />
        </ToolCallContent>
      </ToolCall>
      <ToolCall status="running">
        <ToolCallTrigger>Look up the customer</ToolCallTrigger>
        <ToolCallContent>
          <ToolCallInput value={{ name: "Contoso" }} />
        </ToolCallContent>
      </ToolCall>
      <ToolCall status="error">
        <ToolCallTrigger>Read the bank feed</ToolCallTrigger>
        <ToolCallContent>
          <ToolCallInput
            value={{ account: "Operating", since: "2026-10-01" }}
          />
          <ToolCallError>
            The bank didn't answer within 30 seconds.
          </ToolCallError>
        </ToolCallContent>
      </ToolCall>
    </div>
  );
}
```

## Install

```sh
pnpm add @nuvui/chat @nuvui/react
```

## Import

```tsx
import {
  ToolCall,
  ToolCallApproval,
  ToolCallContent,
  ToolCallError,
  ToolCallInput,
  ToolCallOutput,
  ToolCallTrigger,
} from "@nuvui/chat";
```

The styles come from `@nuvui/chat/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Chat](index.md) covers that.

```tsx
<ToolCall status="done">
  <ToolCallTrigger>Search invoices</ToolCallTrigger>
  <ToolCallContent>
    <ToolCallInput value={{ status: "overdue" }} />
    <ToolCallOutput value={result} />
  </ToolCallContent>
</ToolCall>
```

## Parts

| Part | What it is |
| --- | --- |
| `ToolCall` | The card. `status` says where the call stands. |
| `ToolCallTrigger` | Its top line: the tool's name and the status. It opens and closes the card. |
| `ToolCallContent` | What the card shows when it's open. |
| `ToolCallInput` | What the tool was asked. |
| `ToolCallOutput` | What it answered. |
| `ToolCallError` | What went wrong, for a call that failed. |
| `ToolCallApproval` | The question and its two buttons, for a call that waits to be allowed. |

## Where a call stands

`status` is one of five. Each has an icon and words beside the tool's name, so the icon and its color are never the only sign.

| `status` | Words | When |
| --- | --- | --- |
| `"running"` | Running | The tool has been asked and hasn't answered. |
| `"approval"` | Needs approval | It waits for the person to allow it. |
| `"done"` | Done | It answered. |
| `"error"` | Failed | It failed. |
| `"denied"` | Denied | The person didn't allow it. |

`statusLabel` on the trigger changes the words, for another language or for something more exact: "Done in 2 seconds".

## What was asked and what came back

`ToolCallInput` and `ToolCallOutput` take a `value`. Text is shown as it is. Anything else is shown as indented JSON. A long answer scrolls inside its box, up to 16rem tall.

Pass children in place of `value` to draw it your own way: a table for rows, a picture for a chart.

Name the tool in words a person would use. "Search invoices" says more than `search_invoices`.

## Asking first

Some calls shouldn't run until a person says so: the ones that send, pay, or delete. Set `status="approval"` and put a `ToolCallApproval` in the card with the question. It's drawn only while the call waits, and outside the part that opens, so it's seen with the card closed.

```tsx
"use client";

import {
  ToolCall,
  ToolCallApproval,
  ToolCallContent,
  ToolCallInput,
  ToolCallOutput,
  type ToolCallStatus,
  ToolCallTrigger,
} from "@nuvui/chat";
import { Button } from "@nuvui/react";
import { useEffect, useRef, useState } from "react";

export default function Example() {
  const [status, setStatus] = useState<ToolCallStatus>("approval");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  // Stands in for the tool doing its work.
  function approve() {
    setStatus("running");
    timer.current = setTimeout(() => setStatus("done"), 1500);
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        justifyItems: "start",
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <ToolCall status={status}>
        <ToolCallTrigger>Send a reminder</ToolCallTrigger>
        <ToolCallContent>
          <ToolCallInput
            value={{ invoice: "INV-1042", to: "billing@contoso.example" }}
          />
          {status === "done" ? <ToolCallOutput value="Sent at 10:42." /> : null}
        </ToolCallContent>
        <ToolCallApproval
          onApprove={approve}
          onDeny={() => setStatus("denied")}
        >
          Send a reminder for INV-1042 to Contoso?
        </ToolCallApproval>
      </ToolCall>
      <Button
        intent="secondary"
        size="sm"
        onClick={() => {
          clearTimeout(timer.current);
          setStatus("approval");
        }}
      >
        Ask again
      </Button>
    </div>
  );
}
```

What happens next is yours. `onApprove` and `onDeny` tell you which button was pressed, and you move `status` on: to `"running"` and then `"done"`, or to `"denied"`.

When a button is pressed, both go. Focus moves to the card's top line first, so it isn't left on nothing.

## Open or closed

A card starts closed. `defaultOpen` starts it open, and `open` with `onOpenChange` lets you keep it. These are the [Collapsible](../components/collapsible.md)'s props, which `ToolCall` is built on.

## ToolCall props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `status` (required) | `"approval" \| "denied" \| "done" \| "error" \| "running"` |  | Where the call stands. |

It also takes the props of a [Collapsible](../components/collapsible.md#props).

## ToolCallTrigger props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `children` (required) | `ReactNode` |  | What the tool is called, in words a person would use. |
| `statusLabel` | `ReactNode` | `"Running", "Needs approval", "Done", "Failed" or "Denied"` | Where the call stands, in words. It's written beside the name, so the icon and its color aren't the only way to tell. |

## ToolCallInput and ToolCallOutput props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `ReactNode` |  | The heading over it. |
| `value` | `unknown` |  | What to show. Text is shown as it is, and anything else as indented JSON. |
| `children` | `ReactNode` |  | In place of `value`, drawn your own way: a table, a picture. |

`label` is "Request" for the one and "Result" for the other.

## ToolCallApproval props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `children` (required) | `ReactNode` |  | What's being asked: what the tool will do if it's allowed. |
| `onApprove` | `(() => void)` |  | Called by the button that allows it. |
| `onDeny` | `(() => void)` |  | Called by the button that doesn't. |
| `approveLabel` | `ReactNode` | `"Approve"` |  |
| `denyLabel` | `ReactNode` | `"Deny"` |  |
| `label` | `string` | `"Approval"` | The name of the group for a screen reader. |

## ToolCallError props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `ReactNode` | `"Error"` | The heading over it. |

`ToolCallContent` takes the attributes of a `div`. Every part passes `ref` to its element.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | On the top line, opens or closes the card. |
| <kbd>Tab</kbd> | Goes from the top line into what's open, and to the two buttons when the call waits. |
| Arrow keys | Scroll a long request or result that has focus. |

### What the component handles

- The top line is a button with `aria-expanded`. Its name is the tool's name and the status, so "Search invoices, Done" is read as one.
- The status is words as well as an icon and a color.
- The question and its buttons are a group with a name, "Approval".
- A request or a result that's long enough to scroll can take focus, and is named by its heading.
- Pressing a button that then goes away doesn't drop focus on the page.
- The top line is 44 pixels tall.

### What you need to handle

- Write the question so it says what will happen: "Send a reminder for INV-1042 to Contoso?", not "Allow this tool?".
- Translate `statusLabel`, the sections' `label`, `approveLabel` and `denyLabel`.
- Don't put anything in a request or a result that the reader shouldn't see. It's on the page, a press away.

## CSS variables

Set any of these on a `ToolCall`, or on anything around it.

```css
.chat {
  --nuv-tool-call-radius: var(--radius-md);
  --nuv-tool-call-code-max-height: 24rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-tool-call-border` | `var(--color-border)` | Color of its edge and of the lines inside it. |
| `--nuv-tool-call-radius` | `var(--radius-lg)` | Corner radius of the card. |
| `--nuv-tool-call-bg` | `var(--color-background)` | Background of the card. |
| `--nuv-tool-call-fg` | `var(--color-foreground)` | Color of the text. |
| `--nuv-tool-call-hover-bg` | `var(--color-muted)` | Background of the top line under the pointer. |
| `--nuv-tool-call-icon-fg` | `var(--color-muted-foreground)` | Color of the status icon and the arrow. Keep it at 3:1. |
| `--nuv-tool-call-error-fg` | `var(--color-danger)` | Color of what went wrong, and of a failed call's icon. Keep it at 4.5:1. |
| `--nuv-tool-call-status-fg` | `var(--color-muted-foreground)` | Color of the status words. Keep it at 4.5:1. |
| `--nuv-tool-call-label-fg` | `var(--color-muted-foreground)` | Color of a section's heading. Keep it at 4.5:1. |
| `--nuv-tool-call-code-max-height` | `16rem` | How tall a request or a result gets before it scrolls. |
| `--nuv-tool-call-code-bg` | `var(--color-muted)` | Background of a request or a result. |
| `--nuv-tool-call-code-fg` | `var(--color-foreground)` | Color of its text. Keep it at 4.5:1 against the background. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-tool-call` | ToolCall |
| `.nuv-tool-call__approval` | ToolCallApproval |
| `.nuv-tool-call__body` | ToolCallContent |
| `.nuv-tool-call__chevron` | The arrow, which turns when the card opens. |
| `.nuv-tool-call__choices` | The two buttons. |
| `.nuv-tool-call__code` | The box a request or a result scrolls in. |
| `.nuv-tool-call__error` | What went wrong. |
| `.nuv-tool-call__icon` | The status icon. |
| `.nuv-tool-call__label` | A section's heading. |
| `.nuv-tool-call__name` | The tool's name. |
| `.nuv-tool-call__pre` | The text in it. |
| `.nuv-tool-call__question` | The question. |
| `.nuv-tool-call__section` | ToolCallInput, ToolCallOutput and ToolCallError. |
| `.nuv-tool-call__status` | The status, in words. |
| `.nuv-tool-call__trigger` | ToolCallTrigger |

The card has `data-status`, and `data-state`, `"open"` or `"closed"`. A section has `data-kind`: `"input"`, `"output"` or `"error"`.

## Server components

ToolCall starts with `"use client"`, since the card opens and closes. A server component can render a call that's over, without the functions: `onOpenChange`, `onApprove`, `onDeny`.

## Do and don't

**Do**

- Ask first for anything that can't be taken back.
- Show a call that failed as failed, with what went wrong.

**Don't**

- Don't open every card by default. The reply is what the reader came for.
- Don't use the color of the status as its only sign if you restyle. Keep the words.
