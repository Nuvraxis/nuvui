<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/chat/attachment.mdx. Don't edit it here: run `pnpm skill`. -->

# Attachment

A file shown in a message or waiting in the prompt box, with its name, its size, a picture where there is one, and a button that takes it out.

Use an attachment for each file that goes with a message: the ones a person sent, the ones an assistant made, and the ones waiting in the [prompt box](prompt-input.md) to be sent.

```tsx
import { Attachment, Attachments, Message, MessageContent } from "@nuvui/chat";

// A picture that needs no server: three bars of a chart.
const chart = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><rect width="36" height="36" fill="#e5e7eb"/><path d="M8 28V18h5v10zm8 0V10h5v18zm8 0V15h5v13z" fill="#374151"/></svg>',
)}`;

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 520 }}>
      <Message from="user">
        <MessageContent>
          Here are the two files. Is the total in the chart right?
        </MessageContent>
        <Attachments aria-label="Files with this message">
          <Attachment
            name="october-invoices.pdf"
            detail="PDF"
            size={248_000}
            href="#october-invoices"
          />
          <Attachment
            name="revenue-by-month.png"
            size={86_400}
            src={chart}
            href="#revenue-by-month"
          />
        </Attachments>
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
import { Attachment, Attachments } from "@nuvui/chat";
```

The styles come from `@nuvui/chat/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Chat](index.md) covers that.

```tsx
<Attachments aria-label="Files with this message">
  <Attachment name="october-invoices.pdf" detail="PDF" size={248000} />
</Attachments>
```

## Parts

| Part | What it is |
| --- | --- |
| `Attachments` | The list. The files sit side by side and wrap. |
| `Attachment` | One file. |

## What a file shows

`name` is the only thing a file needs. `size` is a number of bytes, written in the reader's own number format. `detail` is a word or two before it. A long name is cut short with an ellipsis, and the whole of it is the name's `title`.

`src` puts a small picture in place of the icon. For a file that's a picture, that's the picture itself. It's decoration: the name says what the file is, so the picture has no text of its own.

With `href` the name is a link that opens the file. `linkProps` takes the rest of a link's attributes, such as `download` or `target`.

## Waiting, uploading and failed

`onRemove` gives a file a button that takes it out. `uploading` shows a spinner where the icon was and "Uploading" where the size was. `error` takes what went wrong, in words, and shows it in place of the size.

```tsx
"use client";

import { Attachment, Attachments } from "@nuvui/chat";
import { Button } from "@nuvui/react";
import { useState } from "react";

const all = [
  { name: "contract-draft.docx", size: 48_200 },
  { name: "site-photos.zip", size: 18_400_000, uploading: true },
  {
    name: "scan-0042.tiff",
    size: 61_000_000,
    error: "Too large. The limit is 25 MB.",
  },
];

export default function Example() {
  const [files, setFiles] = useState(all);

  return (
    <div style={{ display: "grid", gap: "0.75rem", justifyItems: "start" }}>
      <Attachments aria-label="Files to send">
        {files.map((file) => (
          <Attachment
            key={file.name}
            {...file}
            onRemove={() =>
              setFiles((now) => now.filter((other) => other !== file))
            }
          />
        ))}
      </Attachments>
      <p role="status" style={{ margin: 0 }}>
        {files.length} of 3 files left.
      </p>
      <Button intent="secondary" size="sm" onClick={() => setFiles(all)}>
        Put them back
      </Button>
    </div>
  );
}
```

The prompt box draws the files that wait in it with this component, and keeps the list for you. [PromptInput](prompt-input.md#files) covers that.

## Attachment props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `name` (required) | `string` |  | The file's name. |
| `size` | `number` |  | Its size in bytes, written after the name. |
| `detail` | `ReactNode` |  | A word or two about it, before the size: "PDF", "3 pages". |
| `src` | `string` |  | The address of a small picture of it, shown in place of the icon. For a file that's a picture, the picture itself. |
| `href` | `string` |  | Where the file opens. With it, the name is a link. |
| `linkProps` | `Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">` |  | More for that link: `target`, `download`, `rel`. |
| `icon` | `ReactNode` |  | In place of the icon, for a file with no picture. |
| `uploading` | `boolean` | `false` | The file is on its way to the server. A spinner takes the icon's place and `uploadingLabel` the size's. |
| `uploadingLabel` | `string` | `"Uploading"` |  |
| `error` | `ReactNode` |  | What went wrong with it, in words. Shown in place of the size, and the file is drawn as one that failed. |
| `onRemove` | `(() => void)` |  | With it, the file has a button that calls this. |
| `removeLabel` | `((name: string) => string)` | `(name) => 'Remove ${name}'` | The name of that button, from the file's name. |
| `formatSize` | `((bytes: number) => string)` | `The size in the reader's own number format, such as "1.2 MB"` | Writes the size, from a number of bytes. |

It also takes the attributes of an `li`. `Attachments` takes the attributes of a `ul`. Both pass `ref` to their element.

## Accessibility

### What the component handles

- The files are a list, so a screen reader says how many there are. It's still called a list in Safari, which stops saying so once the bullets are styled away.
- The button that takes a file out is named after its file: "Remove october-invoices.pdf".
- A file that's uploading has `aria-busy`, and says "Uploading" in text.
- A file that failed says why in text. The red edge is for the eye and isn't the only sign.
- The picture and the icon are hidden from screen readers.
- The button is 44 pixels on a touch screen and 28 with a mouse.

### What you need to handle

- Name the list with `aria-label`: "Files with this message", "Files to send".
- Write `error` so that it says what to do: "Too large. The limit is 25 MB."
- A file that fails some time after it was added changes on a page the reader may not be looking at. Say so where it will be heard, with a [toast](../components/toast.md) or a `role="alert"` of your own.
- When a file is taken out, its button goes with it. Move focus somewhere that's still there. The prompt box does this for the files it keeps.
- Translate `removeLabel` and `uploadingLabel`.

## CSS variables

Set any of these on an `Attachments`, or on anything around it.

```css
.chat {
  --nuv-attachment-max-width: 20rem;
  --nuv-attachment-radius: var(--radius-md);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-attachment-gap` | `calc(var(--spacing) * 2)` | Space between the files. |
| `--nuv-attachment-max-width` | `16rem` | The widest a file gets before its name is cut short. |
| `--nuv-attachment-border` | `var(--color-border)` | Color of its edge. |
| `--nuv-attachment-radius` | `var(--radius-lg)` | Corner radius of a file. |
| `--nuv-attachment-bg` | `var(--color-background)` | Background of a file. |
| `--nuv-attachment-fg` | `var(--color-foreground)` | Color of the name. |
| `--nuv-attachment-error-border` | `var(--color-danger)` | Color of the edge of a file that failed. |
| `--nuv-attachment-picture-size` | `calc(var(--spacing) * 9)` | Width and height of the picture. |
| `--nuv-attachment-picture-bg` | `var(--color-muted)` | Background behind the icon. |
| `--nuv-attachment-picture-fg` | `var(--color-muted-foreground)` | Color of the icon. Keep it at 3:1. |
| `--nuv-attachment-detail-fg` | `var(--color-muted-foreground)` | Color of the line under the name. Keep it at 4.5:1. |
| `--nuv-attachment-error-fg` | `var(--color-danger)` | Color of what went wrong. Keep it at 4.5:1. |
| `--nuv-attachment-remove-fg` | `var(--color-muted-foreground)` | Color of the cross in the button. Keep it at 3:1. |
| `--nuv-attachment-remove-hover-bg` | `var(--color-muted)` | Background of the button under the pointer. |
| `--nuv-attachment-remove-hover-fg` | `var(--color-foreground)` | Color of its cross under the pointer. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-attachment` | Attachment |
| `.nuv-attachment__detail` | The detail and the size, or that it's uploading. |
| `.nuv-attachment__error` | What went wrong. |
| `.nuv-attachment__image` | The picture, from src. |
| `.nuv-attachment__name` | The name. A link when there's an href. |
| `.nuv-attachment__picture` | The box the icon, the picture or the spinner is in. |
| `.nuv-attachment__remove` | The button that takes it out. |
| `.nuv-attachment__text` | The name and the line under it. |
| `.nuv-attachments` | Attachments |

A file has `data-uploading` while it uploads and `data-error` when it has failed.

## Server components

Neither part is a client component. A server component can render both, without the functions: `onRemove`, `removeLabel`, `formatSize`.

## Do and don't

**Do**

- Give a file its real name. It's what the reader looks for.
- Show a file that failed where it was, with the reason, and leave the button that takes it out.

**Don't**

- Don't show a preview of a whole document here. This is a file's name tag. What's in it opens from the link.
- Don't rely on the picture to say what a file is.
