<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/editor/rich-text-editor.mdx. Don't edit it here: run `pnpm skill`. -->

# RichTextEditor

A box to write formatted text in. Bold and italic, headings, lists, quotes, code and links, from a toolbar, from the keyboard, or from a small menu over selected text. Its value is HTML.

Use it where what's written will be read as a document: a note to a customer, a description, an announcement, a reply. For a line or two of plain words, a [Textarea](../components/textarea.md) is lighter by about 120 kB and says less can go wrong.

```tsx
"use client";

import { RichTextEditor } from "@nuvui/editor";

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 640 }}>
      <RichTextEditor
        aria-label="Note to the customer"
        placeholder="Write a note. Select some text to format it."
        defaultValue="<p>Thanks for your order. It ships on <strong>Monday</strong>.</p>"
      />
    </div>
  );
}
```

## Install

```sh
pnpm add @nuvui/editor @nuvui/react
```

## Import

```tsx
import { RichTextEditor } from "@nuvui/editor";
```

The styles come from `@nuvui/editor/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Editor](index.md) covers that, and loading the editor only on the screens that have one.

```tsx
<RichTextEditor
  aria-label="Notes"
  placeholder="Write a note"
  value={html}
  onValueChange={setHtml}
/>
```

## Parts

By itself `RichTextEditor` draws a toolbar, the text, and a count when there's a `maxLength`. Give it children to choose the parts yourself.

| Part | What it is |
| --- | --- |
| `RichTextEditor` | The box. It keeps the text. |
| `RichTextEditorToolbar` | The row of controls over the text. |
| `RichTextEditorFormats` | A group of toggles in a toolbar: bold, a heading, a list. |
| `RichTextEditorActions` | Buttons in a toolbar that do one thing once: undo, a divider. |
| `RichTextEditorLink` | The button for a link, with the box its address is written in. |
| `RichTextEditorContent` | The text. |
| `RichTextEditorBubbleMenu` | A small toolbar over selected text. It's drawn when you add it. |
| `RichTextEditorCount` | How much is written. |

## The value

`value` is HTML, and `onValueChange` is called with the HTML each time the text changes. `defaultValue` lets the editor keep it. Nothing written is `""`, not an empty paragraph.

The second argument of `onValueChange` has what else you may want from the same change: `text`, the words with no markup, `characters`, `words`, `empty`, and `json`, the document as data. `json` and `text` are worked out when you read them, so one you don't read costs nothing.

```tsx
"use client";

import { RichTextEditor } from "@nuvui/editor";
import { Button } from "@nuvui/react";
import { useState } from "react";

const start =
  "<p>Payment is due <strong>30 days</strong> after the invoice.</p>";

export default function Example() {
  const [html, setHtml] = useState(start);
  const [counts, setCounts] = useState("8 words");

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        inlineSize: "100%",
        maxInlineSize: 640,
      }}
    >
      <RichTextEditor
        aria-label="Payment terms"
        value={html}
        onValueChange={(next, change) => {
          setHtml(next);
          setCounts(`${change.words} words`);
        }}
      />
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <Button
          intent="secondary"
          onClick={() => {
            setHtml(start);
            setCounts("8 words");
          }}
        >
          Put it back
        </Button>
        <span role="status">{counts}</span>
      </div>
      <pre
        data-html=""
        style={{
          margin: 0,
          padding: "0.75rem",
          overflowX: "auto",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--color-muted)",
          fontSize: "var(--text-xs)",
          whiteSpace: "pre-wrap",
        }}
      >
        {html || "(nothing written)"}
      </pre>
    </div>
  );
}
```

When you set `value` to something other than what's written, the text is replaced and the caret goes to the start. Setting it to what `onValueChange` just gave you changes nothing, so typing isn't disturbed.

## What can be written

| Format | In the toolbar | From the keyboard | By typing |
| --- | --- | --- | --- |
| Bold | Bold | <kbd>Ctrl</kbd> <kbd>B</kbd> | `**text**` |
| Italic | Italic | <kbd>Ctrl</kbd> <kbd>I</kbd> | `*text*` |
| Underline | Underline | <kbd>Ctrl</kbd> <kbd>U</kbd> | |
| Strikethrough | Strikethrough | <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>S</kbd> | `~~text~~` |
| Code | Code | <kbd>Ctrl</kbd> <kbd>E</kbd> | `` `text` `` |
| Heading | Heading 2, Heading 3 | <kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>2</kbd> | `## ` |
| Bulleted list | Bulleted list | <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>8</kbd> | `- ` |
| Numbered list | Numbered list | <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>7</kbd> | `1. ` |
| Quote | Quote | <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>B</kbd> | `> ` |
| Code block | Code block | <kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>C</kbd> | ` ``` ` |
| Divider | | | `---` |
| Link | Link | | Paste or type an address |

On a Mac, <kbd>⌘</kbd> is in place of <kbd>Ctrl</kbd>. These are Tiptap's own shortcuts.

## Headings

`headingLevels` says which headings the text can have, and those are the ones the toolbar offers. It's `[2, 3]` by default: the page the text ends up on has its own `h1`, and usually an `h2` over the text as well. Give the levels that fit under yours. `[]` leaves headings out.

A heading of a level that isn't allowed, in a `value` or in what's pasted, becomes a paragraph.

## Links

The Link button opens a box to write the address in. What's selected becomes the link's words. With nothing selected, the address is written as the words. On a link, the box has its address, and a button that takes the link off.

An address can be the web, `mailto:`, `tel:`, or a place on your own site that starts with `/` or `#`. One with no scheme, `example.com`, is taken for `https://`. Anything else is refused, and the box says so.

A click on a link in the text puts the caret there. It doesn't open it. Links are written with `rel="noopener noreferrer nofollow"`.

## A limit

`maxLength` is the most characters the text takes. Typing and pasting stop there, and a count under the text says how many are written and how many can be. The count turns to the danger color when it's full, and says so in words as well: "140 of 140 characters".

```tsx
"use client";

import { RichTextEditor } from "@nuvui/editor";

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 640 }}>
      <RichTextEditor
        aria-label="Summary"
        maxLength={140}
        placeholder="A summary in 140 characters"
        defaultValue="<p>Two invoices are overdue.</p>"
      />
    </div>
  );
}
```

It counts characters of text, not of HTML. If a column in your database limits the HTML, check that on the server.

## In a form

With a `name`, the HTML is sent with the form the editor is in, in a hidden field, as any other field's value is. A `disabled` editor sends nothing.

Name the editor with `aria-labelledby` and the `id` of the words that label it. A `label` element can't point at it with `for`, since it isn't an `input`. `aria-describedby`, `aria-invalid` and `aria-required` on `RichTextEditor` go to the text, where a screen reader looks for them.

```tsx
"use client";

import { RichTextEditor } from "@nuvui/editor";
import { Button } from "@nuvui/react";
import { type FormEvent, useId, useState } from "react";

export default function Example() {
  const id = useId();
  const [sent, setSent] = useState("Nothing sent yet.");
  const [missing, setMissing] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = String(new FormData(event.currentTarget).get("body") ?? "");
    setMissing(body === "");
    if (body !== "") setSent(`Sent: ${body}`);
  }

  return (
    <form
      onSubmit={submit}
      style={{
        display: "grid",
        gap: "0.75rem",
        inlineSize: "100%",
        maxInlineSize: 640,
      }}
    >
      <span id={`${id}-label`} style={{ fontWeight: 500 }}>
        Reply
      </span>
      <RichTextEditor
        name="body"
        aria-labelledby={`${id}-label`}
        aria-describedby={missing ? `${id}-error` : undefined}
        aria-invalid={missing || undefined}
        aria-required
        onValueChange={() => setMissing(false)}
      />
      {missing ? (
        <p
          id={`${id}-error`}
          style={{ margin: 0, color: "var(--color-danger)" }}
        >
          Write a reply before you send it.
        </p>
      ) : null}
      <div>
        <Button type="submit">Send</Button>
      </div>
      <p role="status" style={{ margin: 0, overflowWrap: "anywhere" }}>
        {sent}
      </p>
    </form>
  );
}
```

`aria-required` says it's required. It doesn't stop the form: check for `""` yourself, as above.

## Your own toolbar

`RichTextEditorToolbar` takes groups of your choosing. `RichTextEditorFormats` is a group of toggles, and `RichTextEditorActions` a group of buttons, each given the `items` to draw. Put the core's `ToolbarSeparator` between them, and any `ToolbarButton` of your own beside them.

```tsx
"use client";

import {
  RichTextEditor,
  RichTextEditorActions,
  RichTextEditorContent,
  RichTextEditorCount,
  RichTextEditorFormats,
  RichTextEditorLink,
  RichTextEditorToolbar,
} from "@nuvui/editor";
import { ToolbarSeparator } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 640 }}>
      <RichTextEditor
        aria-label="Comment"
        placeholder="Add a comment"
        headingLevels={[]}
      >
        <RichTextEditorToolbar>
          <RichTextEditorFormats
            items={["bold", "italic"]}
            aria-label="Text style"
          />
          <ToolbarSeparator />
          <RichTextEditorFormats
            items={["bulletList", "orderedList"]}
            aria-label="Lists"
          />
          <ToolbarSeparator />
          <RichTextEditorLink />
          <RichTextEditorActions items={["clearFormatting"]} />
        </RichTextEditorToolbar>
        <RichTextEditorContent />
        <RichTextEditorCount />
      </RichTextEditor>
    </div>
  );
}
```

The formats are `bold`, `italic`, `underline`, `strike`, `code`, `heading1` to `heading6`, `bulletList`, `orderedList`, `blockquote` and `codeBlock`. The actions are `undo`, `redo`, `horizontalRule` and `clearFormatting`.

Leaving a format out of the toolbar doesn't forbid it: its shortcut still works, and it can be pasted.

## A menu on the selection

`RichTextEditorBubbleMenu` is a small toolbar that comes up over text when it's selected, with bold, italic, underline and strikethrough, or the `items` you give it. It's for an editor with no toolbar over the text, as here.

```tsx
"use client";

import {
  RichTextEditor,
  RichTextEditorBubbleMenu,
  RichTextEditorContent,
} from "@nuvui/editor";

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 640 }}>
      <RichTextEditor
        aria-label="Release note"
        defaultValue="<p>Select a few of these words to format them.</p>"
      >
        <RichTextEditorContent />
        <RichTextEditorBubbleMenu />
      </RichTextEditor>
    </div>
  );
}
```

It isn't drawn unless you add it. Under a toolbar it covers the toolbar's controls when the first line is selected, and on a phone it comes up where the phone's own menu for copy and paste does. Formatting that's only in this menu can't be reached with the Tab key, so keep it to formats that have a shortcut: the four it starts with do.

## Read only

`readOnly` shows the text and lets it be selected and copied, and not changed. With only `RichTextEditorContent` as its child there's no toolbar, and it's a way to show saved text: the editor reads HTML through the same rules it writes with, so what it shows can't run anything.

```tsx
"use client";

import { RichTextEditor, RichTextEditorContent } from "@nuvui/editor";

// What someone wrote, shown again. The editor reads the HTML through its
// own rules for what text can hold, so nothing in it can run.
const saved =
  '<h3>Late payments</h3><p>A reminder goes out on <strong>day 31</strong>.</p><ul><li><p>Late fees start at day 45.</p></li><li><p>Questions go to <a href="mailto:billing@example.com">billing@example.com</a>.</p></li></ul>';

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 640 }}>
      <RichTextEditor
        aria-label="Payment terms, as saved"
        readOnly
        headingLevels={[3]}
        value={saved}
        style={{ "--nuv-rich-text-editor-min-height": "0" } as never}
      >
        <RichTextEditorContent />
      </RichTextEditor>
    </div>
  );
}
```

`disabled` is for a field that can't be used now. It's dimmed, and isn't sent with a form.

## From outside

`editorRef` gives a handle on the editor, for a button elsewhere on the page:

```tsx
const editor = useRef<RichTextEditorHandle>(null);

<Button onClick={() => editor.current?.insertText("Kind regards, Ada")}>
  Add my signature
</Button>
<RichTextEditor aria-label="Reply" editorRef={editor} />
```

| Method | What it does |
| --- | --- |
| `focus()` | Puts the caret in the text. |
| `clear()` | Takes everything out. |
| `setHTML(html)` | Replaces everything. |
| `insertText(text)` | Puts text where the caret is, over what's selected. |
| `getHTML()`, `getText()`, `getJSON()` | The text now, as HTML, as plain words, and as data. |

`clear`, `setHTML` and `insertText` call `onValueChange`.

## RichTextEditor props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `string` |  | The text as HTML, when you keep it. Use it with `onValueChange`. Nothing written is the empty string. |
| `defaultValue` | `string` |  | The text to begin with, when it's kept here. |
| `onValueChange` | `((html: string, change: RichTextEditorChange) => void)` |  | Called when the text changes, with the HTML and, beside it, the same as data, as plain words, and its counts. |
| `placeholder` | `string` |  | Shown while nothing is written. |
| `disabled` | `boolean` | `false` | It can't be written in, and isn't sent with a form. |
| `readOnly` | `boolean` | `false` | It can be read and selected, and not changed. |
| `maxLength` | `number` |  | The most characters it takes. Typing and pasting stop there. |
| `autoFocus` | `boolean` | `false` | Puts the caret in it when it's first drawn. |
| `name` | `string` |  | With a name, the HTML is sent with the form it's in. |
| `headingLevels` | `RichTextEditorHeadingLevel[]` | `[2, 3]` | The heading levels the text can have, and the toolbar offers. Give the ones under the page's own headings. |
| `labels` | `RichTextEditorLabels` |  | What's said and not drawn, for another language. |
| `editorRef` | `Ref<RichTextEditorHandle>` |  | The editor from outside: focus, clear, and the text as data. |
| `children` | `ReactNode` |  | The parts, when the ones it draws by itself aren't the ones you want: a toolbar, the text, and the count if there's a `maxLength`. A menu on the selection is a part to add here. |

It also takes the attributes of a `div`, and passes `ref` to it.

## RichTextEditorFormats props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `items` (required) | `RichTextEditorFormat[]` |  | The toggles, in the order they're drawn. |

## RichTextEditorActions props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `items` (required) | `RichTextEditorAction[]` |  | The buttons, in the order they're drawn. |

## RichTextEditorBubbleMenu props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `items` | `RichTextEditorFormat[]` | `["bold", "italic", "underline", "strike"]` | The toggles it offers. |

`RichTextEditorToolbar`, `RichTextEditorContent` and `RichTextEditorCount` take the attributes of their element. `RichTextEditorLink` takes none.

## Translation

Every name a screen reader says, and the words in the box for a link, are in `labels`, in English until you give another.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `toolbar` | `string` |  | The name of the toolbar. |
| `textStyle` | `string` |  | The name of the group of bold, italic and the like. |
| `blocks` | `string` |  | The name of the group of headings, lists and the like. |
| `selectionMenu` | `string` |  | The name of the menu over selected text. |
| `bold` | `string` |  |  |
| `italic` | `string` |  |  |
| `underline` | `string` |  |  |
| `strike` | `string` |  |  |
| `code` | `string` |  |  |
| `heading` | `((level: RichTextEditorHeadingLevel) => string)` |  |  |
| `bulletList` | `string` |  |  |
| `orderedList` | `string` |  |  |
| `blockquote` | `string` |  |  |
| `codeBlock` | `string` |  |  |
| `undo` | `string` |  |  |
| `redo` | `string` |  |  |
| `horizontalRule` | `string` |  |  |
| `clearFormatting` | `string` |  |  |
| `link` | `string` |  |  |
| `linkAddress` | `string` |  | The name of the field a link's address is written in. |
| `linkApply` | `string` |  |  |
| `linkRemove` | `string` |  |  |
| `linkInvalid` | `string` |  | Said when what's written isn't an address a link can have. |
| `count` | `((characters: number, max: number \| undefined) => string)` |  | The count under the text. `max` is there when there's a limit. |

```tsx
<RichTextEditor
  labels={{
    bold: "Vet",
    heading: (level) => `Kop ${level}`,
    count: (characters, max) => `${characters} van ${max} tekens`,
  }}
/>
```

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | To the toolbar, at the control it was last at. Then to the text. Then out. |
| <kbd>→</kbd> <kbd>←</kbd> | In the toolbar, the next and the previous control. |
| <kbd>Home</kbd> <kbd>End</kbd> | In the toolbar, the first and the last. |
| <kbd>Space</kbd> or <kbd>Enter</kbd> | In the toolbar, presses the control. Focus goes back to the text. |
| <kbd>Tab</kbd> in a list | Moves the item in a level, when there's an item above it. <kbd>Shift</kbd> <kbd>Tab</kbd> moves it out. |
| <kbd>Esc</kbd> | Closes the box for a link. |

<kbd>Tab</kbd> in the text goes on to what's after the editor, except in a list item that can be moved in. From there, <kbd>Shift</kbd> <kbd>Tab</kbd> moves the item out, and then leaves.

### What the component handles

- The text is a textbox of many lines, with the name, the description and the invalid and required states you give `RichTextEditor`.
- The toolbar is a toolbar with a name, and one stop for the Tab key. Each control has a name, and a toggle says whether it's on.
- A control that can't be used now, undo with nothing to undo, is disabled.
- After a control is pressed, focus is in the text again, with the selection as it was.
- The menu on the selection isn't reached with the Tab key. What's in it by default has a shortcut each: Ctrl or Command with B, I and U, and with Shift and S.
- Each control is 44 pixels on a touch screen, and the text is 16 pixels there, so iOS doesn't zoom the page when it's tapped.

### What you need to handle

- Name it, with `aria-label` or `aria-labelledby`.
- Choose `headingLevels` so that headings in the text come under the headings of the page it's shown on.
- Say what's wrong in words when it's invalid, and point `aria-describedby` at them.

## On small screens

The toolbar wraps to as many rows as it needs, and the page doesn't scroll sideways. A toolbar of fourteen controls is three rows on a phone: for a comment or a reply, give it fewer, as in [your own toolbar](#your-own-toolbar).

The menu on the selection, if you add it, comes up over the selection, where a phone puts its own menu for copy and paste. On a phone a toolbar serves better.

## CSS variables

Set any of these on a `RichTextEditor`, or on anything around it.

```css
.reply {
  --nuv-rich-text-editor-min-height: 6rem;
  --nuv-rich-text-editor-max-height: 50dvh;
}
```

With `--nuv-rich-text-editor-max-height` set, the text scrolls inside the box and the toolbar stays in view.

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-rich-text-editor-border` | `var(--color-border)` | Color of the box's border, and of the lines inside it. |
| `--nuv-rich-text-editor-radius` | `var(--radius-lg)` | Corner radius of the box. |
| `--nuv-rich-text-editor-bg` | `var(--color-background)` | Background of the box. |
| `--nuv-rich-text-editor-fg` | `var(--color-foreground)` | Color of the text. |
| `--nuv-rich-text-editor-invalid-border` | `var(--color-danger)` | Color of the border when it's invalid. |
| `--nuv-rich-text-editor-min-height` | `10rem` | The least the text's height can be. 10rem by default. |
| `--nuv-rich-text-editor-max-height` | `none` | The most it can be. The text scrolls inside it. No limit by default. |
| `--nuv-rich-text-editor-padding` | `calc(var(--spacing) * 3)` | Space around the text. |
| `--nuv-rich-text-editor-font-size` | `var(--text-sm)` | Size of the text with a mouse. On a touch screen it's never under 16px. |
| `--nuv-rich-text-editor-gap` | `calc(var(--spacing) * 3)` | Space between paragraphs. |
| `--nuv-rich-text-editor-link-fg` | `var(--color-foreground)` | Color of a link. It's underlined, so it doesn't rely on color. |
| `--nuv-rich-text-editor-quote-border` | `var(--color-border)` | Color of the line beside a quote. |
| `--nuv-rich-text-editor-quote-fg` | `var(--color-muted-foreground)` | Color of a quote's text. Keep it at 4.5:1. |
| `--nuv-rich-text-editor-code-bg` | `var(--color-muted)` | Background of code. |
| `--nuv-rich-text-editor-placeholder-fg` | `var(--color-muted-foreground)` | Color of the placeholder. Keep it at 4.5:1. |
| `--nuv-rich-text-editor-count-fg` | `var(--color-muted-foreground)` | Color of the count. Keep it at 4.5:1. |
| `--nuv-rich-text-editor-full-fg` | `var(--color-danger)` | Color of the count when the limit is reached. Keep it at 4.5:1. |

The toolbar is the core's [Toolbar](../components/toolbar.md#css-variables), and takes its variables: `--nuv-toolbar-on-bg`, `--nuv-toolbar-item-hover-bg` and the rest.

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-rich-text-editor` | RichTextEditor |
| `.nuv-rich-text-editor__body` | RichTextEditorContent, the part that scrolls. |
| `.nuv-rich-text-editor__bubble` | RichTextEditorBubbleMenu |
| `.nuv-rich-text-editor__bubble-toolbar` | The toolbar inside it. |
| `.nuv-rich-text-editor__content` | The text itself, the textbox. |
| `.nuv-rich-text-editor__count` | RichTextEditorCount |
| `.nuv-rich-text-editor__glyph` | The letter on a control that has one. |
| `.nuv-rich-text-editor__group` | RichTextEditorFormats and RichTextEditorActions. |
| `.nuv-rich-text-editor__item` | One control in a toolbar. |
| `.nuv-rich-text-editor__link` | The form in the box for a link. |
| `.nuv-rich-text-editor__link-actions` | Its buttons. |
| `.nuv-rich-text-editor__link-error` | What it says when the address is refused. |
| `.nuv-rich-text-editor__placeholder` | The empty first line, while the placeholder is shown. |
| `.nuv-rich-text-editor__toolbar` | RichTextEditorToolbar, next to nuv-toolbar. |

A state is an attribute on the box: `data-disabled`, `data-readonly` and `data-invalid`. The count has `data-full` at the limit.

## Server components

RichTextEditor starts with `"use client"`. A server component can render it with `defaultValue` and a `name`, without `onValueChange`.

Nothing is drawn where the text goes until the page is in a browser: the toolbar and the box are there, and the text comes when the editor starts. That's on purpose. Drawing the HTML on the server would mean putting it in the page without the editor's rules.

## Do and don't

**Do**

- Give a comment or a reply a short toolbar, and a document the whole of it.
- Sanitize the HTML on the server before it's shown anywhere without the editor.
- Load the editor only with the screen that has one.

**Don't**

- Don't use it for a single line. An [Input](../components/input.md) is a field people already know.
- Don't put the HTML in a page with `dangerouslySetInnerHTML` unsanitized.
- Don't rely on `maxLength` to keep the HTML under a database's limit. It counts the text.
