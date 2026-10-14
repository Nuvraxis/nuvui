<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/file-upload.mdx. Don't edit it here: run `pnpm skill`. -->

# FileUpload

A drop area around the browser's own file input, with a list of the chosen files. It submits with a form like any file input.

Use it to let people pick files from their device or drag them in. It holds the files and nothing more: sending them to a server, and showing how that's going, is your code's job.

```tsx
import { FileUpload, Label } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        inlineSize: "100%",
        maxInlineSize: 420,
      }}
    >
      <Label htmlFor="upload-contract">Signed contract</Label>
      <FileUpload id="upload-contract" name="contract" />
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
import { FileUpload } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `onFilesChange` | `((files: File[]) => void)` |  | Called with every file that's chosen, each time the list changes. |
| `maxSize` | `number` |  | The largest a file may be, in bytes. |
| `maxFiles` | `number` |  | The most files that may be chosen. Only applies with `multiple`. |
| `onReject` | `((rejections: FileRejection[]) => void)` |  | Called with the files that were turned away and the reason for each. Nothing is shown for them, so this is where you tell the person. |
| `children` | `ReactNode` | `"Drop files here, or choose them from your device"` | The text in the drop area. |
| `showList` | `boolean` | `true` | Whether to list the chosen files under the drop area, each with a button to take it out again. |
| `removeLabel` | `((name: string) => string)` | `(name) => 'Remove ${name}'` | Accessible name of the button that takes a file out, from the file's name. Translate it with the rest of your interface. |
| `formatSize` | `((bytes: number) => string)` | `The size in the visitor's own number format, such as "1.2 MB"` | Writes a file's size, from a number of bytes. |

These are the browser's own, and the component acts on them.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `multiple` | `boolean` |  | Lets several files be chosen. New ones are added to the list. Without it, a new file takes the place of the last. |
| `accept` | `string` |  | Which files are allowed, as on any file input: extensions such as `.pdf`, types such as `image/png`, or a family such as `image/*`. It's checked for dropped files too. |
| `disabled` | `boolean` |  | Stops files from being chosen, dropped or taken out. |
| `required` | `boolean` |  | Inside a form, the browser won't submit until a file is chosen. |
| `name` | `string` |  | The name the files are submitted under in a form. |
| `onChange` | `ChangeEventHandler<HTMLInputElement, HTMLInputElement>` |  | The input's own change event. It also fires after a drop and after a file is taken out. |

`className` goes on the element around the drop area and the list. Everything else, `ref` and `id` included, goes to the `<input type="file">`.

## How it's built

The drop area holds a real file input, laid over the whole of it and invisible. So a click anywhere in the area opens the browser's file picker, the keyboard reaches a real file input, and a form submits the files without any code from you.

A file picker hands over its files and forgets them, so a plain file input can't add to what was chosen before, and can't take one file out. This component can. After every change it writes the full list back into the input, and fires the input's `change` event. A form library that listens to the input sees what it would see from any file input.

## Limits

`accept`, `maxSize` and `maxFiles` decide which files are kept. A file that fails one isn't added, and nothing is shown for it: `onReject` is called with the files and a reason for each, and what to tell the person is up to you.

```tsx
"use client";

import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  type FileRejection,
  FileUpload,
} from "@nuvui/react";
import { useState } from "react";

const megabyte = 1024 * 1024;

const reasons = {
  type: "isn't a PNG or JPEG image",
  size: "is over 2 MB",
  count: "is one more than the three allowed",
};

export default function Example() {
  const [rejected, setRejected] = useState<FileRejection[]>([]);

  return (
    <Field style={{ inlineSize: "100%", maxInlineSize: 420 }}>
      <FieldLabel>Product photos</FieldLabel>
      <FieldControl>
        <FileUpload
          multiple
          accept="image/png,image/jpeg"
          maxSize={2 * megabyte}
          maxFiles={3}
          onReject={setRejected}
          // A change that goes through clears the last complaint.
          onFilesChange={() => setRejected([])}
        >
          Drop up to three photos here, or choose them from your device
        </FileUpload>
      </FieldControl>
      <FieldDescription>PNG or JPEG, up to 2 MB each.</FieldDescription>
      <FieldError>
        {rejected.length > 0
          ? rejected
              .map(({ file, reason }) => `${file.name} ${reasons[reason]}.`)
              .join(" ")
          : null}
      </FieldError>
    </Field>
  );
}
```

The browser's picker already hides files that `accept` doesn't allow. A drop doesn't go through the picker, so the component checks dropped files against `accept` itself.

A file with the same name, size and date as one already in the list is ignored and isn't reported.

## In a form

Give it a `name` and the files are part of the form's data, under that name. `required` works as on any file input. Resetting the form empties the list.

```tsx
<form action="/upload" method="post" encType="multipart/form-data">
  <label htmlFor="report">Report</label>
  <FileUpload id="report" name="report" accept=".pdf" required />
  <Button type="submit">Send</Button>
</form>
```

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves to the file input, then to the button on each file in the list. |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | On the input, opens the file picker. On a file's button, takes that file out. |

Dragging isn't possible from the keyboard, and doesn't need to be: the picker does the same job.

### What the component handles

- The control is a native `<input type="file">`, so its role and its keyboard behavior come from the browser, and it reports the chosen files as its value.
- The text in the drop area is the input's description, after any `aria-describedby` of your own.
- While the input has keyboard focus, the ring goes around the whole drop area.
- The area's edge uses `--color-border-strong`, at least 3:1 against the page in every theme. While files are dragged over it, the edge turns solid and takes the primary color, so the change doesn't depend on color alone.
- Each file's button is named after the file, "Remove report.pdf". `removeLabel` replaces that, for another language. On a touch screen its tap area is 44 by 44 pixels.
- After a file is taken out, focus moves to the input, since the button that had it is gone.
- A file's size is written in the visitor's own number format. `formatSize` replaces that.

### What you need to handle

- Give it a name. Use a [label](label.md) whose `htmlFor` matches its `id`, or put it in a [Field](field.md).
- Say what's allowed before people choose: which kinds of file and how big. Put it in the drop area's text or in a description.
- Tell people when a file was turned away, and why. `onReject` gives you what you need.
- Uploading is yours to build, and so is saying how it's going. Announce when an upload finishes or fails, for example with a [toast](toast.md).

## CSS variables

Set any of these on the component, or on anything around it.

```css
.attachments {
  --nuv-file-upload-min-height: 12rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-file-upload-gap` | `calc(var(--spacing) * 3)` | Space between the drop area and the list. |
| `--nuv-file-upload-width` | `100%` | Width. It fills its container by default. |
| `--nuv-file-upload-min-height` | `8rem` | The least height of the drop area. |
| `--nuv-file-upload-border` | `var(--color-border-strong)` | Border color of the drop area. |
| `--nuv-file-upload-radius` | `var(--radius-lg)` | Corner radius of the drop area. |
| `--nuv-file-upload-bg` | `var(--color-surface)` | Background color of the drop area. |
| `--nuv-file-upload-fg` | `var(--color-muted-foreground)` | Color of the text and the icon in the drop area. |
| `--nuv-file-upload-active-bg` | `var(--color-muted)` | Background of the drop area under the pointer, and while files are dragged over it. |
| `--nuv-file-upload-active-border` | `var(--color-primary)` | Border color of the drop area while files are dragged over it. |
| `--nuv-file-upload-item-border` | `var(--color-border)` | Border color of a file's row. |
| `--nuv-file-upload-item-radius` | `var(--radius-md)` | Corner radius of a file's row. |
| `--nuv-file-upload-item-bg` | `var(--color-surface)` | Background color of a file's row. |
| `--nuv-file-upload-item-fg` | `var(--color-foreground)` | Text color of a file's name. |
| `--nuv-file-upload-item-height` | `var(--nuv-touch-size)`, `var(--nuv-control-height-md)` | Minimum height of a file's row. Its button is sized from it. The default differs between touch screens and a mouse. |
| `--nuv-file-upload-item-button-radius` | `var(--radius-sm)` | Corner radius of a file's button. |
| `--nuv-file-upload-item-button-fg` | `var(--color-muted-foreground)` | Color of the cross on a file's button. |
| `--nuv-file-upload-item-button-bg-hover` | `var(--color-muted)` | Background of a file's button while hovered. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-file-upload` | The element around everything. It's what `className` is added to. |
| `.nuv-file-upload__dropzone` | The drop area. |
| `.nuv-file-upload__icon` | The arrow in the drop area. |
| `.nuv-file-upload__input` | The file input, laid over the drop area. |
| `.nuv-file-upload__item` | One file's row. |
| `.nuv-file-upload__list` | The list of chosen files. |
| `.nuv-file-upload__name` | The file's name. |
| `.nuv-file-upload__remove` | The button that takes the file out. |
| `.nuv-file-upload__size` | The file's size. |

The drop area has the `data-dragging` attribute while files are over it, and the outer element has `data-disabled` when the input is disabled. The text in the drop area has the class `nuv-file-upload__prompt`, which has no rules of its own.

## Server components

FileUpload is a client component. It carries `"use client"`, and the build checks that the directive is still there in the published files. You can render it from a server component, as the first example on this page does.

## Do and don't

**Do**

- Check the files again on the server. `accept` and `maxSize` are a convenience for the person choosing, and nothing stops a request that skips them.
- Keep the drop area big enough to aim at.

**Don't**

- Don't hide the list unless you show the chosen files some other way. People need to see what they're about to send.
- Don't start an upload the moment a file is chosen without a way to cancel it.
