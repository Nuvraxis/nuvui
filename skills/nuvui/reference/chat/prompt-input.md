<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/chat/prompt-input.mdx. Don't edit it here: run `pnpm skill`. -->

# PromptInput

The box a prompt is written in. A field that grows with the text, sends on Enter, takes files, and has a row under it for buttons, with a button that sends or stops.

Use it where someone writes to an assistant. It's a form with one growing field, so it behaves like the message box people already know: Enter sends, Shift with Enter starts a new line, and the box gets taller as the text does.

```tsx
"use client";

import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@nuvui/chat";
import { useState } from "react";

export default function Example() {
  const [sent, setSent] = useState("");

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <PromptInput onSubmit={setSent}>
        <PromptInputTextarea aria-label="Message" placeholder="Ask anything" />
        <PromptInputToolbar>
          <PromptInputSubmit />
        </PromptInputToolbar>
      </PromptInput>
      <p role="status" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
        {sent ? `Sent: ${sent}` : "Nothing sent yet."}
      </p>
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
  PromptInput,
  PromptInputAttach,
  PromptInputAttachments,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@nuvui/chat";
```

The styles come from `@nuvui/chat/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Chat](index.md) covers that.

```tsx
<PromptInput onSubmit={(text) => send(text)}>
  <PromptInputTextarea aria-label="Message" placeholder="Ask anything" />
  <PromptInputToolbar>
    <PromptInputSubmit />
  </PromptInputToolbar>
</PromptInput>
```

## Parts

| Part | What it is |
| --- | --- |
| `PromptInput` | The box. It's a `form`, and keeps the text. |
| `PromptInputTextarea` | The field. |
| `PromptInputToolbar` | The row under the field. |
| `PromptInputTools` | Buttons at the start of that row. |
| `PromptInputSubmit` | The button that sends, and stops. |
| `PromptInputAttach` | A button that opens the device's file picker. |
| `PromptInputAttachments` | The files waiting to be sent. |

## Sending

`onSubmit` is called with the text, and the box is emptied. Text that's only spaces isn't sent. Its second argument holds what goes with the text: `files`, covered [below](#files), and the form's `event`.

With a keyboard, <kbd>Enter</kbd> sends and <kbd>Shift</kbd> with <kbd>Enter</kbd> starts a new line. On a touch screen it's the other way: the keyboard's Enter is the only way to start a line there, so it starts one, and the button sends. `submitOnEnter` on the field sets it one way for everyone.

Enter that picks a word from an input method's list, as when writing Japanese or Chinese, doesn't send.

## While a reply is on its way

Set `busy` from the moment something is sent until the reply is done. Nothing more can be sent until then. The field stays open, so the next message can be written while the reply arrives.

With `onStop`, the button to send becomes a button to stop for as long as the box is busy.

```tsx
"use client";

import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@nuvui/chat";
import { useEffect, useRef, useState } from "react";

export default function Example() {
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState("Nothing sent yet.");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function send(text: string) {
    setBusy(true);
    setSaid(`Replying to: ${text}`);
    // A reply that takes ten seconds, long enough to stop it.
    timer.current = setTimeout(() => {
      setBusy(false);
      setSaid("Replied.");
    }, 10_000);
  }

  function stop() {
    clearTimeout(timer.current);
    setBusy(false);
    setSaid("Stopped.");
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <PromptInput busy={busy} onStop={stop} onSubmit={send}>
        <PromptInputTextarea aria-label="Message" placeholder="Ask anything" />
        <PromptInputToolbar>
          <PromptInputSubmit />
        </PromptInputToolbar>
      </PromptInput>
      <p role="status" style={{ margin: 0 }}>
        {said}
      </p>
    </div>
  );
}
```

## Buttons in the row

`PromptInputTools` holds whatever goes with the prompt: where to look, which model, a mode. They sit at the start of the row and the button to send at the end. Give a button `type="button"`, so that pressing it doesn't send.

```tsx
"use client";

import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@nuvui/chat";
import { Button, NativeSelect } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [scope, setScope] = useState("This workspace");
  const [sent, setSent] = useState("Nothing sent yet.");

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <PromptInput onSubmit={(text) => setSent(`Asked ${scope}: ${text}`)}>
        <PromptInputTextarea aria-label="Message" placeholder="Ask anything" />
        <PromptInputToolbar>
          <PromptInputTools>
            <NativeSelect
              aria-label="Where to look"
              value={scope}
              onChange={(event) => setScope(event.target.value)}
            >
              <option>This workspace</option>
              <option>Invoices</option>
              <option>Customers</option>
            </NativeSelect>
            <Button
              type="button"
              intent="ghost"
              size="sm"
              onClick={() => setSent("Cleared.")}
            >
              Clear
            </Button>
          </PromptInputTools>
          <PromptInputSubmit />
        </PromptInputToolbar>
      </PromptInput>
      <p role="status" style={{ margin: 0 }}>
        {sent}
      </p>
    </div>
  );
}
```

## Files

Put a `PromptInputAttachments` over the field and a `PromptInputAttach` in the row, and the box takes files. They wait in it, each with a button that takes it out again, and are handed to `onSubmit` with the text.

```tsx
"use client";

import {
  PromptInput,
  PromptInputAttach,
  PromptInputAttachments,
  type PromptInputFileRejection,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@nuvui/chat";
import { useState } from "react";

const megabyte = 1024 * 1024;

const reasons = {
  type: "isn't a picture or a PDF",
  size: "is over 5 MB",
  count: "is one more than three",
};

export default function Example() {
  const [sent, setSent] = useState("Nothing sent yet.");
  const [refused, setRefused] = useState("");

  function refuse(rejections: PromptInputFileRejection[]) {
    setRefused(
      rejections
        .map(({ file, reason }) => `${file.name} ${reasons[reason]}.`)
        .join(" "),
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <PromptInput
        accept="image/*,.pdf"
        maxFiles={3}
        maxFileSize={5 * megabyte}
        onFilesChange={() => setRefused("")}
        onFilesReject={refuse}
        onSubmit={(text, { files }) =>
          setSent(
            `Sent "${text}" with ${files.length === 1 ? "1 file" : `${files.length} files`}.`,
          )
        }
      >
        <PromptInputAttachments />
        <PromptInputTextarea
          aria-label="Message"
          placeholder="Ask about a file"
        />
        <PromptInputToolbar>
          <PromptInputTools>
            <PromptInputAttach />
          </PromptInputTools>
          <PromptInputSubmit />
        </PromptInputToolbar>
      </PromptInput>
      <p role="alert" style={{ margin: 0, minBlockSize: "1.5em" }}>
        {refused}
      </p>
      <p role="status" style={{ margin: 0 }}>
        {sent}
      </p>
    </div>
  );
}
```

```tsx
<PromptInput
  accept="image/*,.pdf"
  maxFiles={3}
  maxFileSize={5 * 1024 * 1024}
  onFilesReject={tellThePerson}
  onSubmit={(text, { files }) => send(text, files)}
>
  <PromptInputAttachments />
  <PromptInputTextarea aria-label="Message" />
  <PromptInputToolbar>
    <PromptInputTools>
      <PromptInputAttach />
    </PromptInputTools>
    <PromptInputSubmit />
  </PromptInputToolbar>
</PromptInput>
```

There are three ways in, and all three go through the same checks:

- **The button** opens the device's file picker.
- **Pasting** into the field, such as a screenshot. Text that's pasted stays text: cells copied from a spreadsheet come with a picture of themselves, and the picture is left out.
- **Dropping** files on the box. While files are over it, its edge is dashed.

Pasting and dropping only take files when one of the two parts is in the box. Without them the box is for text, and a file that's dropped on it is the browser's to deal with.

`accept` is written as a file input's: `"image/*,.pdf"`. `maxFiles` is the most that can wait at once and `maxFileSize` the largest one may be, in bytes. A file that's turned away isn't shown. `onFilesReject` is called with each one and the reason, `"type"`, `"size"` or `"count"`, and that's where you tell the person. The same file added twice is kept once.

With files waiting, the box can be sent with no text.

### Keeping the files yourself

Pass `files` and `onFilesChange` to hold them: to start uploading as soon as one is added, or to keep them with a draft. `defaultFiles` starts the box with some.

To show how an upload is going, give `PromptInputAttachments` a function. It's called with each file and with the way to take it out, and returns an [`Attachment`](attachment.md):

```tsx
<PromptInputAttachments>
  {(file, remove) => (
    <Attachment
      name={file.name}
      size={file.size}
      uploading={uploads.get(file)?.busy}
      error={uploads.get(file)?.error}
      onRemove={remove}
    />
  )}
</PromptInputAttachments>
```

The box doesn't upload anything. It hands you `File` objects, and where they go is yours.

## Keeping the text yourself

Pass `value` and `onValueChange` to hold the text: to limit it, to keep a draft, or to put a [suggestion](prompt-suggestion.md) in the box. `onValueChange` is called with an empty text after a send.

```tsx
"use client";

import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@nuvui/chat";
import { useState } from "react";

const limit = 280;

export default function Example() {
  const [text, setText] = useState("");

  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 520 }}>
      <PromptInput
        value={text}
        onValueChange={(next) => setText(next.slice(0, limit))}
        onSubmit={() => {}}
      >
        <PromptInputTextarea
          aria-label="Message"
          aria-describedby="prompt-left"
          placeholder="Ask anything"
        />
        <PromptInputToolbar>
          <span id="prompt-left" style={{ fontSize: "var(--text-sm)" }}>
            {limit - text.length} characters left
          </span>
          <PromptInputSubmit />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
```

## How tall it gets

The field starts one line tall and grows to 12rem, about eight lines, and scrolls after that. `--nuv-prompt-input-max-height` changes where it stops.

## PromptInput props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `string` |  | The text in the box, when you keep it. Use it with `onValueChange`. |
| `defaultValue` | `string` |  | The text in the box to begin with, when it's kept here. |
| `onValueChange` | `((value: string) => void)` |  | Called with the text as it's typed, and with nothing after a send. |
| `onSubmit` | `((text: string, submission: PromptInputSubmission) => void)` |  | Called with the text when it's sent, by Enter or by the button, and with the files that were waiting. The box is emptied after. Text that's only spaces isn't sent, unless there are files to go with it. |
| `files` | `File[]` |  | The files waiting to be sent, when you keep them. Use it with `onFilesChange`. |
| `defaultFiles` | `File[]` |  | The files waiting to begin with, when they're kept here. |
| `onFilesChange` | `((files: File[]) => void)` |  | Called with all of them when one is added or taken out. |
| `accept` | `string` |  | The kinds of file it takes, written as a file input's `accept`: `"image/*,.pdf"`. Left out, it takes any. |
| `maxFiles` | `number` |  | The most files that can wait at once. |
| `maxFileSize` | `number` |  | The largest a file may be, in bytes. |
| `onFilesReject` | `((rejections: PromptInputFileRejection[]) => void)` |  | Called with the files that were turned away and the reason for each. Nothing is shown for them, so this is where you tell the person. |
| `busy` | `boolean` | `false` | A reply is on its way. Nothing can be sent until it's `false` again, and what's typed meanwhile is kept. With `onStop`, the button to send becomes a button to stop. |
| `onStop` | `(() => void)` |  | Called by the button to stop, while `busy`. |
| `disabled` | `boolean` | `false` | Nothing can be typed or sent. |

It also takes the attributes of a `form`.

## PromptInputTextarea props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `submitOnEnter` | `boolean` |  | Whether Enter sends. Left out, it does where there's a keyboard, and starts a new line on a touch screen, where Enter is the only way to start one and the button is the way to send. |

It also takes the attributes of a `textarea`, but for `value` and `defaultValue`, which are the box's.

## PromptInputSubmit props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Send"` | The button's name for a screen reader. |
| `stopLabel` | `string` | `"Stop"` | Its name while a reply is on its way and it stops the reply. |
| `children` | `ReactNode` |  | In place of the arrow, or of the square while it stops a reply. |

## PromptInputAttachments props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Files to send"` | The list's name for a screen reader. |
| `removeLabel` | `((name: string) => string)` | `(name) => 'Remove ${name}'` | The name of the button that takes a file out, from the file's name. |
| `formatSize` | `((bytes: number) => string)` | `The size in the reader's own number format, such as "1.2 MB"` | Writes a file's size, from a number of bytes. |
| `announce` | `((count: number) => string)` | `(count) => "2 files attached", and the like` | What a screen reader is told when a file is added or taken out, from how many are waiting now. |
| `children` | `((file: File, remove: () => void) => ReactNode)` |  | Draws each file yourself: called with the file and with the way to take it out, and returns an `Attachment`. For a file that's being uploaded as it waits, or one that failed. |

It also takes the attributes of a `ul`.

## PromptInputAttach props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` | `string` | `"Attach files"` | The button's name for a screen reader. |
| `children` | `ReactNode` |  | In place of the paperclip. |

It also takes the attributes of a `button`.

`PromptInputToolbar` and `PromptInputTools` take the attributes of a `div`. Every part passes `ref` to its element.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Enter</kbd> | Sends, where there's a keyboard. |
| <kbd>Shift</kbd> + <kbd>Enter</kbd> | Starts a new line. |
| <kbd>Tab</kbd> | Goes from the field to the buttons in the row, and on to the button that sends. |

### What the component handles

- It's a real `form` with a real `textarea`, so it works with a password manager, dictation and a browser's own spell check.
- The button that sends is named "Send", and "Stop" while it stops a reply.
- With nothing to send, the button is marked as disabled with `aria-disabled` and stays in the tab order. A button that left the tab order would be missed by someone feeling out the form with Tab.
- When the field has focus from the keyboard, the ring goes round the whole box.
- After a send, focus is back in the field.
- The text is 16 pixels on a touch screen, which keeps iOS from zooming the page when the field takes focus.
- The button that attaches is named "Attach files". The files that wait are a list named "Files to send", and each has a button named after it: "Remove scan.pdf".
- When a file is added or taken out, how many are waiting is said to a screen reader: "2 files attached".
- When a file is taken out, focus goes to the field. Its button went with it.
- Dropping is a shortcut for a mouse. The button does the same with a keyboard and on a touch screen.

### What you need to handle

- Name the field with `aria-label`, or a `<label>`. The placeholder isn't a name: it's gone as soon as something is typed.
- Translate `label` and `stopLabel`, and for files `removeLabel` and `announce`.
- Tell the person when a file is turned away, and why, from `onFilesReject`. Use a `role="alert"`, or a [toast](../components/toast.md).
- If there's a limit on the text, say what's left where a screen reader finds it, with `aria-describedby`.

## On small screens

The button that sends is 44 pixels on a touch screen and 36 with a mouse, and so is the button that attaches. Enter starts a new line there, as said above.

## CSS variables

Set any of these on the `PromptInput`, or on anything around it.

```css
.chat {
  --nuv-prompt-input-radius: var(--radius-md);
  --nuv-prompt-input-max-height: 20rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-prompt-input-border` | `var(--color-border-strong)` | Color of the box's edge. Keep it at 3:1 against what's around it. |
| `--nuv-prompt-input-radius` | `var(--radius-xl)` | Corner radius of the box. |
| `--nuv-prompt-input-bg` | `var(--color-background)` | Background of the box. |
| `--nuv-prompt-input-fg` | `var(--color-foreground)` | Color of the text. |
| `--nuv-prompt-input-drop-border` | `var(--color-primary)` | Color of its edge then. |
| `--nuv-prompt-input-drop-bg` | `var(--color-muted)` | Background of the box while files are held over it. |
| `--nuv-prompt-input-max-height` | `12rem` | How tall the field grows before it scrolls. |
| `--nuv-prompt-input-font-size` | `var(--text-sm)` | Size of the text with a mouse. On a touch screen it's always 16 pixels. |
| `--nuv-prompt-input-placeholder` | `var(--color-muted-foreground)` | Color of the placeholder. Keep it at 4.5:1. |
| `--nuv-prompt-input-attach-fg` | `var(--color-muted-foreground)` | Color of the paperclip in the button that attaches. Keep it at 3:1. |
| `--nuv-prompt-input-attach-hover-bg` | `var(--color-muted)` | Background of that button under the pointer. |
| `--nuv-prompt-input-attach-hover-fg` | `var(--color-foreground)` | Color of its icon under the pointer. |
| `--nuv-prompt-input-submit-bg` | `var(--color-primary)` | Background of the button that sends. |
| `--nuv-prompt-input-submit-fg` | `var(--color-primary-foreground)` | Color of its icon. Keep it at 3:1 against the background. |
| `--nuv-prompt-input-submit-hover-bg` | `color-mix(in oklab, var(--color-primary) 88%, var(--color-foreground))` | Its background under the pointer. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-prompt-input` | PromptInput: the form, and the frame. |
| `.nuv-prompt-input__attach` | PromptInputAttach |
| `.nuv-prompt-input__attachments` | PromptInputAttachments, next to nuv-attachments. |
| `.nuv-prompt-input__status` | How many files are waiting. Read out and drawn for nobody. |
| `.nuv-prompt-input__submit` | PromptInputSubmit |
| `.nuv-prompt-input__textarea` | PromptInputTextarea |
| `.nuv-prompt-input__toolbar` | PromptInputToolbar |
| `.nuv-prompt-input__tools` | PromptInputTools |

The box has `data-busy` and `data-disabled`, and `data-dragging` while files are held over it. The button has `data-stop` while it stops a reply.

## Server components

PromptInput starts with `"use client"`: it keeps what's typed. `onSubmit` is a function, so the box is rendered from a client component of yours.

## Do and don't

**Do**

- Leave the field open while a reply arrives.
- Give it `onStop` if a reply can be stopped. A long answer to the wrong question is a long wait.

**Don't**

- Don't use it for a search field or a comment box. Those are an [`Input`](../components/input.md) and a [`Textarea`](../components/textarea.md).
- Don't put more in the row than fits on a phone. A menu holds the rest.
