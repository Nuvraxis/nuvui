<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/chat/reasoning.mdx. Don't edit it here: run `pnpm skill`. -->

# Reasoning

How an assistant got to its reply. A line over the reply that opens to the steps it took, open while it works and closed once it has answered.

Use reasoning over a reply to show how it was reached: what was looked up, what was checked. It's open while the assistant works, so the wait has something in it, and closes when the reply arrives, since the reply is what the reader came for.

```tsx
import {
  Message,
  MessageContent,
  Reasoning,
  ReasoningContent,
  ReasoningStep,
  ReasoningSteps,
  ReasoningTrigger,
} from "@nuvui/chat";

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 520 }}>
      <Message from="assistant">
        <Reasoning defaultOpen>
          <ReasoningTrigger>Thought for 6 seconds</ReasoningTrigger>
          <ReasoningContent>
            <ReasoningSteps>
              <ReasoningStep label="Looked up Contoso's open invoices">
                Two are past their due date.
              </ReasoningStep>
              <ReasoningStep label="Checked the payment terms">
                30 days, with a reminder on day 31.
              </ReasoningStep>
              <ReasoningStep label="Worked out how late each one is" />
            </ReasoningSteps>
          </ReasoningContent>
        </Reasoning>
        <MessageContent>
          Two invoices are overdue: INV-1042 by 12 days and INV-1057 by 3.
        </MessageContent>
      </Message>
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
  Reasoning,
  ReasoningContent,
  ReasoningStep,
  ReasoningSteps,
  ReasoningTrigger,
} from "@nuvui/chat";
```

The styles come from `@nuvui/chat/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Chat](index.md) covers that.

```tsx
<Reasoning streaming={thinking}>
  <ReasoningTrigger />
  <ReasoningContent>{thoughts}</ReasoningContent>
</Reasoning>
```

## Parts

| Part | What it is |
| --- | --- |
| `Reasoning` | The whole of it. It keeps whether the steps are open. |
| `ReasoningTrigger` | The line that opens and closes them. |
| `ReasoningContent` | What opens. |
| `ReasoningSteps` | A list of steps, in the order they were taken. |
| `ReasoningStep` | One step. |

## Text or steps

`ReasoningContent` takes either. If the model gives you its thinking as text, put the text in. If your app knows the steps, such as each tool that was called, put a `ReasoningSteps` in with a `ReasoningStep` for each. A step has a `label` and, as children, a line more about it.

## While the assistant works

Set `streaming` for as long as it's thinking. The steps open, the line shimmers, and the step with `status="active"` shows a spinner. When `streaming` goes back to `false` they close.

```tsx
"use client";

import {
  Message,
  MessageContent,
  MessageLoader,
  Reasoning,
  ReasoningContent,
  ReasoningStep,
  ReasoningSteps,
  ReasoningTrigger,
} from "@nuvui/chat";
import { Button } from "@nuvui/react";
import { useEffect, useState } from "react";

const steps = [
  "Looked up Contoso's open invoices",
  "Checked the payment terms",
  "Worked out how late each one is",
];

export default function Example() {
  // How many steps have been taken. One more than there are, and the
  // reply is written.
  const [taken, setTaken] = useState(steps.length + 1);
  const thinking = taken <= steps.length;

  // Stands in for the assistant: a step every 900 milliseconds.
  useEffect(() => {
    if (!thinking) return;
    const timer = setInterval(() => setTaken((now) => now + 1), 900);
    return () => clearInterval(timer);
  }, [thinking]);

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
      <Message from="assistant" streaming={thinking}>
        <Reasoning streaming={thinking}>
          <ReasoningTrigger>
            {thinking ? "Thinking" : "Thought for 3 seconds"}
          </ReasoningTrigger>
          <ReasoningContent>
            <ReasoningSteps>
              {steps.slice(0, taken + 1).map((step, index) => (
                <ReasoningStep
                  key={step}
                  label={step}
                  status={index === taken ? "active" : "done"}
                />
              ))}
            </ReasoningSteps>
          </ReasoningContent>
        </Reasoning>
        {thinking ? (
          <MessageLoader />
        ) : (
          <MessageContent>
            Two invoices are overdue: INV-1042 by 12 days and INV-1057 by 3.
          </MessageContent>
        )}
      </Message>
      <Button
        intent="secondary"
        size="sm"
        disabled={thinking}
        onClick={() => setTaken(0)}
      >
        Ask again
      </Button>
    </div>
  );
}
```

If the reader opens or closes the steps themselves, that's kept: from then on `streaming` doesn't move them. Someone who closed them isn't shown them again, and someone who opened them to read isn't interrupted.

## What the line says

Left empty, the trigger says "Thinking" while `streaming` and "Reasoning" after. Say more if you know more, such as how long it took: "Thought for 6 seconds".

## Open or closed

Without `streaming` it starts closed. `defaultOpen` starts it open, and `open` with `onOpenChange` lets you keep it, in which case `streaming` asks through `onOpenChange` and you decide. These are the [Collapsible](../components/collapsible.md)'s props, which `Reasoning` is built on.

## Reasoning props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `streaming` | `boolean` | `false` | The assistant is still working it out. The steps are open for as long as it is, and close when it's done, unless the reader opened or closed them in the meantime: then they stay as the reader left them. |

It also takes the props of a [Collapsible](../components/collapsible.md#props).

## ReasoningStep props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` (required) | `ReactNode` |  | What was done, in a few words. |
| `status` | `"active" \| "done"` | `"done"` | `"active"` for the step that's being taken now. It shows a spinner and is marked as the current step. |
| `children` | `ReactNode` |  | More about it, under the label. |

It also takes the attributes of an `li`. `ReasoningTrigger` takes the attributes of a `button`, `ReasoningContent` of a `div` and `ReasoningSteps` of an `ol`. Every part passes `ref` to its element.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | On the line, opens or closes the steps. |

### What the component handles

- The line is a button with `aria-expanded`, tied to what it opens.
- While it's closed, the steps aren't in the page for a screen reader or for Tab.
- The steps are an ordered list. The one being taken has `aria-current="step"`.
- The shimmer and the spinner stand still for someone who has asked for less motion.
- The tick and the spinner are hidden from screen readers. The label says what the step is.
- The line is 44 pixels tall on a touch screen.

### What you need to handle

- Put it in a [`Message`](message.md) that has `streaming` for as long as the reply is being written. Then a screen reader isn't read each step as it arrives, and reads the message once it's whole.
- Write each `label` as what was done: "Checked the payment terms".
- Translate what the trigger says.

## CSS variables

Set any of these on a `Reasoning`, or on anything around it.

```css
.chat {
  --nuv-reasoning-line: var(--color-primary);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-reasoning-trigger-fg` | `var(--color-muted-foreground)` | Color of the line that opens the steps. Keep it at 4.5:1. |
| `--nuv-reasoning-trigger-hover-fg` | `var(--color-foreground)` | Its color under the pointer. |
| `--nuv-reasoning-line` | `var(--color-border)` | Color of the line down the side. |
| `--nuv-reasoning-fg` | `var(--color-muted-foreground)` | Color of the text that opens, and of a step's detail. Keep it at 4.5:1. |
| `--nuv-reasoning-label-fg` | `var(--color-foreground)` | Color of a step's label. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-reasoning` | Reasoning |
| `.nuv-reasoning__body` | ReasoningContent: what's inside it, with the line down its side. |
| `.nuv-reasoning__chevron` | The arrow in it, which turns when the steps open. |
| `.nuv-reasoning__content` | The part that opens, whose height is animated. |
| `.nuv-reasoning__detail` | The detail, from the step's children. |
| `.nuv-reasoning__label` | The label. |
| `.nuv-reasoning__marker` | The tick, or the spinner. |
| `.nuv-reasoning__step` | ReasoningStep |
| `.nuv-reasoning__steps` | ReasoningSteps |
| `.nuv-reasoning__text` | The label and the detail. |
| `.nuv-reasoning__trigger` | ReasoningTrigger |

`Reasoning` has `data-streaming` while the assistant works, and `data-state`, `"open"` or `"closed"`. A step has `data-status`, `"done"` or `"active"`.

## Server components

Reasoning starts with `"use client"`, since the steps open and close. A server component can render a finished one, without `onOpenChange`.

## Do and don't

**Do**

- Close it once the reply is there, which `streaming` does for you.
- Show the steps that were really taken.

**Don't**

- Don't put the reply itself in it. What the reader needs is under it, in the message.
- Don't use it for progress through a form or a checkout. That's a [Stepper](../components/stepper.md).
