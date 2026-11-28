<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/editor/code-editor.mdx. Don't edit it here: run `pnpm skill`. -->

# CodeEditor

A box to write code in, on CodeMirror. Colored as CodeBlock colors code, with line numbers, folding, search, completion and problems marked in the code, and a file's own history when it's one of a set.

Use it where people write code: a query, a template, a config file, the files of a small project. To show code that isn't changed, a [CodeBlock](../chat/code-block.md) is a few kB where this is about 120. To show what changed between two versions, use [DiffEditor](diff-editor.md).

```tsx
"use client";

import { CodeEditor } from "@nuvui/editor/code";

const start = `// Splits an order into the boxes it ships in.
interface Item {
  sku: string;
  weight: number;
}

export function pack(items: Item[], most = 20): Item[][] {
  const boxes: Item[][] = [[]];
  let load = 0;
  for (const item of items) {
    if (load + item.weight > most) {
      boxes.push([]);
      load = 0;
    }
    boxes[boxes.length - 1]?.push(item);
    load += item.weight;
  }
  return boxes;
}
`;

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 720 }}>
      <CodeEditor
        aria-label="Packing script"
        defaultLanguage="typescript"
        defaultValue={start}
        maxLines={18}
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
import { CodeEditor } from "@nuvui/editor/code";
```

It's imported from `@nuvui/editor/code`, not from `@nuvui/editor`, so a screen with only the rich text editor doesn't load CodeMirror. The styles come from `@nuvui/editor/styles.css`, which [Editor](index.md) covers.

```tsx
<CodeEditor
  aria-label="Query"
  language="sql"
  value={query}
  onValueChange={setQuery}
/>
```

## Parts

By itself `CodeEditor` draws a toolbar, the code and a status bar. Give it children to choose the parts yourself: `<CodeEditorContent />` alone is the code with nothing around it.

| Part | What it is |
| --- | --- |
| `CodeEditor` | The box. It keeps the code. |
| `CodeEditorToolbar` | The row over the code: the language, wrapping long lines, copying, and formatting when there's a `format`. Your own controls go after them as children. |
| `CodeEditorContent` | The code. |
| `CodeEditorStatus` | The line under the code: where the cursor is, how many places are selected, how many problems there are, and the language. |

## The value

`value` is the code, and `onValueChange` is called with it each time it's changed in the editor. `defaultValue` lets the editor keep it.

The second argument of `onValueChange` has the rest of the same change: `lines`, `characters`, `selections` (each place selected, as `from` and `to`), and the `line` and `column` the cursor is at, both from 1.

Setting `value` to something other than what's there writes the difference in, and the cursor stays where it was in the part that didn't change. Setting it to what `onValueChange` just gave you changes nothing, so typing isn't disturbed. A change from `value` isn't added to the undo history.

## Languages

`language` takes a name, an alias or what a file in the language ends with: `"typescript"`, `"ts"` and `"mts"` are all TypeScript, and `"md"` is Markdown. The ones the toolbar offers are JavaScript, TypeScript, JSX, TSX, CSS, SCSS, HTML, JSON, Markdown, Python, SQL and YAML, and more than a hundred others work by name.

None of them is in the bundle. A language is fetched the first time it's used, and the code is plain text until it's there. Any `LanguageSupport` from a CodeMirror language package can be given instead of a name, and is used at once.

```tsx
"use client";

import { CodeEditor } from "@nuvui/editor/code";
import { useState } from "react";

const start = `def restock(stock, threshold=12):
    """The items that have run low, most urgent first."""
    low = [item for item in stock if item["count"] < threshold]
    return sorted(low, key=lambda item: item["count"])
`;

export default function Example() {
  const [language, setLanguage] = useState("python");

  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        inlineSize: "100%",
        maxInlineSize: 720,
      }}
    >
      <CodeEditor
        aria-label="Restock helper"
        language={language}
        onLanguageChange={setLanguage}
        defaultValue={start}
      />
      <p style={{ margin: 0, fontSize: 14 }}>
        Colored as {language || "plain text"}. Pick another in the toolbar.
      </p>
    </div>
  );
}
```

The toolbar's picker changes the language. With `language` and `onLanguageChange`, the language is yours, as above. With `defaultLanguage`, the editor keeps it. With only `language` and no `onLanguageChange`, the toolbar shows the language's name and doesn't offer others. `CodeEditorToolbar` takes `languages` to offer a list of your own.

With no language at all, it's the one `path` ends in, and plain text without that.

## Lines

`lineNumbers` and `foldGutter` draw the line numbers, and the buttons beside a block of code that fold it. Both are on by default. `wrap` wraps a line longer than the box, and the toolbar has a button for it. `tabSize` is how many spaces a Tab indents, 2 by default.

`minLines` is the fewest lines tall the box is, 4 by default. `maxLines` is the most it grows to: past that, the code scrolls inside it. With neither, it grows with the code.

## Problems

`diagnostics` is a list of problems, each `{ from, to, severity, message }`, with `from` and `to` counted in characters from the start of the code. Each is underlined where it is and marked in the gutter, and the status bar counts them. Point at either to read the message. The severity is `"error"`, `"warning"`, `"info"` or `"hint"`, and it's a word and an icon in the message, and a shape in the gutter, not only a color.

```tsx
"use client";

import { CodeEditor, type CodeEditorDiagnostic } from "@nuvui/editor/code";
import { useMemo, useState } from "react";

const start = `{
  "store": "Harbor Street",
  "opens": "08:00",
  "closes": "18:00",
  "staff": [ "Ines", "Tomas", ]
}
`;

// A check of the app's own: the JSON is read, and where it can't be, the
// problem is shown at the place the browser says it stopped.
function check(code: string): CodeEditorDiagnostic[] {
  try {
    const data = JSON.parse(code);
    return typeof data.closes === "string" && data.closes < data.opens
      ? [
          {
            from: code.indexOf('"closes"'),
            to: code.indexOf('"closes"') + 8,
            severity: "warning",
            message: "It closes before it opens.",
          },
        ]
      : [];
  } catch (error) {
    const at = Number(/position (\d+)/.exec(String(error))?.[1] ?? 0);
    return [
      {
        from: at,
        to: at + 1,
        severity: "error",
        message: "This isn't JSON that can be read.",
        source: "JSON",
      },
    ];
  }
}

// Formatting is the app's to give. Here, JSON is written out again.
const format = (code: string) =>
  `${JSON.stringify(JSON.parse(code), null, 2)}\n`;

export default function Example() {
  const [code, setCode] = useState(start);
  const diagnostics = useMemo(() => check(code), [code]);

  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 720 }}>
      <CodeEditor
        aria-label="Store settings"
        language="json"
        value={code}
        onValueChange={setCode}
        diagnostics={diagnostics}
        format={format}
      />
    </div>
  );
}
```

Finding them is yours: run your own check on the code, as this example does, or a linter in a worker, and give the editor what it finds. A problem past the end of the code, from a check of what was there a moment ago, is drawn at the end.

## Formatting

`format` is a function you give, `(code) => string`, or a promise of one. With it, the toolbar has a Format button, and <kbd>Shift</kbd> <kbd>Alt</kbd> <kbd>F</kbd> does the same. Prettier, or anything else, is your choice, and nothing is installed with the editor:

```tsx
import { format } from "prettier/standalone";
import estree from "prettier/plugins/estree";
import typescript from "prettier/plugins/typescript";

<CodeEditor
  language="typescript"
  format={(code) =>
    format(code, { parser: "typescript", plugins: [estree, typescript] })
  }
/>
```

If it throws, the code is left as it was and a screen reader is told it couldn't be formatted. If the code was changed while it ran, what was typed wins.

## Search

<kbd>Ctrl</kbd> <kbd>F</kbd> opens a panel over the code to find and replace, with the core's fields and buttons. It counts the matches and says which one is selected, and can match case, whole words, or a regular expression. <kbd>Enter</kbd> finds the next match and <kbd>Shift</kbd> <kbd>Enter</kbd> the one before, and <kbd>Esc</kbd> closes it and goes back to the code. A read-only editor has no replace.

## Completion

Where the language has completion of its own, CSS's property names or HTML's tags, a list comes up as you type, and <kbd>Ctrl</kbd> <kbd>Space</kbd> brings it up at any time. To complete from your own words, give a completion source from `@codemirror/autocomplete` through `extensions`.

## A set of files

`path` is the file the code is. The editor keeps every file it's shown, with its own undo history, selection and scroll, and when `path` comes back to one, it opens as it was left. That's what an online editor needs, and what a text box can't do. Give `value` for the file along with its `path`.

```tsx
"use client";

import { CodeEditor } from "@nuvui/editor/code";
import { ToggleGroup, ToggleGroupItem } from "@nuvui/react/toggle-group";
import { useState } from "react";

const start: Record<string, string> = {
  "index.html": `<main>\n  <h1>Harbor Street</h1>\n  <p class="hours">Open 8 to 6</p>\n</main>\n`,
  "styles.css": `.hours {\n  color: teal;\n  font-weight: 600;\n}\n`,
  "app.js": `document.querySelector(".hours").title = "Every day";\n`,
};

export default function Example() {
  const [files, setFiles] = useState(start);
  const [open, setOpen] = useState("index.html");

  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        inlineSize: "100%",
        maxInlineSize: 720,
      }}
    >
      <ToggleGroup
        type="single"
        aria-label="Files"
        value={open}
        onValueChange={(next) => {
          if (next) setOpen(next);
        }}
      >
        {Object.keys(files).map((path) => (
          <ToggleGroupItem key={path} value={path}>
            {path}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {/* One editor. Each file keeps its own undo history, selection and
          scroll, and its language comes from its name. */}
      <CodeEditor
        aria-label={open}
        path={open}
        value={files[open]}
        onValueChange={(code) =>
          setFiles((before) => ({ ...before, [open]: code }))
        }
      />
    </div>
  );
}
```

Undo in one file only undoes what was done in it. The language follows the file's name unless you give one.

## In a form

With a `name`, the code is sent with the form the editor is in, in a hidden field. A `disabled` editor sends nothing.

In a [Field](../components/field.md), the label, the description and the invalid state go to the code itself, where a screen reader looks for them:

```tsx
"use client";

import { CodeEditor, CodeEditorContent } from "@nuvui/editor/code";
import { Button } from "@nuvui/react/button";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
} from "@nuvui/react/field";
import { type FormEvent, useState } from "react";

export default function Example() {
  const [sent, setSent] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(String(new FormData(event.currentTarget).get("template")));
  }

  return (
    <form
      onSubmit={submit}
      style={{
        display: "grid",
        gap: 12,
        inlineSize: "100%",
        maxInlineSize: 560,
      }}
    >
      <Field>
        <FieldLabel>Receipt template</FieldLabel>
        <FieldControl>
          <CodeEditor
            name="template"
            language="html"
            defaultValue={
              "<p>Thanks, {{ name }}.</p>\n<p>Order {{ number }} is on its way.</p>\n"
            }
            minLines={4}
            lineNumbers={false}
            foldGutter={false}
          >
            <CodeEditorContent />
          </CodeEditor>
        </FieldControl>
        <FieldDescription>
          The HTML sent with each receipt. Words in braces are filled in.
        </FieldDescription>
      </Field>
      <Button type="submit" style={{ justifySelf: "start" }}>
        Save template
      </Button>
      {sent === null ? null : (
        <pre style={{ margin: 0, fontSize: 13, whiteSpace: "pre-wrap" }}>
          {sent}
        </pre>
      )}
    </form>
  );
}
```

## Read only

`readOnly` shows the code and lets it be selected, searched and copied, and not changed. With only `CodeEditorContent` as its child, it's the code with nothing around it.

```tsx
"use client";

import { CodeEditor, CodeEditorContent } from "@nuvui/editor/code";

const query = `SELECT store, SUM(total) AS takings
FROM orders
WHERE placed_on >= DATE '2026-11-01'
GROUP BY store
ORDER BY takings DESC;
`;

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 640 }}>
      {/* The code alone, with no toolbar or status. */}
      <CodeEditor
        aria-label="Takings by store"
        language="sql"
        defaultValue={query}
        readOnly
        minLines={1}
      >
        <CodeEditorContent />
      </CodeEditor>
    </div>
  );
}
```

`disabled` is for a field that can't be used now. It's dimmed, it can't be focused, and it isn't sent with a form.

## From outside

`editorRef` gives a handle on the editor:

| Method | What it does |
| --- | --- |
| `focus()` | Puts the cursor in the code. |
| `getValue()` | The code now. |
| `setValue(code)` | Replaces the code, and calls `onValueChange`. |
| `insertText(text)` | Puts text where the cursor is, over what's selected. |
| `select(from, to)` | Selects from one place to another, or puts the cursor at one. |
| `view` | CodeMirror's own `EditorView`, for anything else. `null` until it's drawn. |

## Extensions

`extensions` takes anything else CodeMirror has: a keymap of your own, a completion source, a linter, a theme for one editor. They go after the editor's own, so a keymap you give runs after its keys. To run before them, wrap it in `Prec.high` from `@codemirror/state`.

## CodeEditor props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `string` |  | The code, when you keep it. Use it with `onValueChange`. |
| `defaultValue` | `string` |  | The code to begin with, when it's kept here. |
| `onValueChange` | `((code: string, change: CodeEditorChange) => void)` |  | Called when the code is changed in the editor, with the code and, beside it, its lines, characters, selections and where the cursor is. |
| `language` | `CodeEditorLanguage` |  | The language, by a name such as `"typescript"`, `"ts"` or `"py"`, or as any `LanguageSupport`. A language is fetched the first time it's used. With none, it's the one `path` ends in, or plain text. |
| `defaultLanguage` | `string` |  | The language to begin with, when the toolbar changes it here. |
| `onLanguageChange` | `((language: string) => void)` |  | Called with a language's name when it's picked in the toolbar, or the empty string for plain text. |
| `lineNumbers` | `boolean` | `true` | Draws the number of each line beside it. |
| `wrap` | `boolean` |  | Wraps a line longer than the box, when you keep whether it does. |
| `defaultWrap` | `boolean` | `false` | Wraps long lines to begin with, when it's kept here. |
| `onWrapChange` | `((wrap: boolean) => void)` |  | Called when wrapping is turned on or off in the toolbar. |
| `tabSize` | `number` | `2` | How many spaces a Tab indents, and how wide a tab character is. |
| `minLines` | `number` | `4` | The fewest lines tall it is. |
| `maxLines` | `number` |  | The most lines tall it grows. Past them, it scrolls. |
| `foldGutter` | `boolean` | `true` | Draws a button beside each block of code that folds it away. |
| `tabBehavior` | `"focus" \| "indent"` | `"indent"` | What Tab does. `"indent"` indents, and Escape then Tab leaves the editor, which is said to a screen reader. `"focus"` leaves at once. |
| `format` | `((code: string) => string \| Promise<string>)` |  | Formats the code, from the toolbar and from Shift-Alt-F. Prettier or anything else is yours to give: nothing is installed with this. |
| `diagnostics` | `readonly CodeEditorDiagnostic[]` |  | Problems to show, underlined in the code and marked in the gutter. |
| `path` | `string` |  | The file the code is, for a set of them. The editor keeps each file it's shown, with its own undo history, selection and scroll, and opens it again as it was. Give `value` for the file along with it. |
| `placeholder` | `string` |  | Shown while there's no code. |
| `disabled` | `boolean` | `false` | It can't be written in, and isn't sent with a form. |
| `readOnly` | `boolean` | `false` | It can be read and selected, and not changed. |
| `autoFocus` | `boolean` | `false` | Puts the cursor in it when it's first drawn. |
| `name` | `string` |  | With a name, the code is sent with the form it's in. |
| `nonce` | `string` |  | The nonce of a content security policy. CodeMirror adds its styles to the page as it runs, and a strict policy needs it on them. |
| `extensions` | `readonly Extension[]` |  | Anything else CodeMirror has, from its own packages or yours. |
| `labels` | `CodeEditorLabels` |  | What's said and not drawn, for another language. |
| `editorRef` | `Ref<CodeEditorHandle>` |  | The editor from outside: focus, the code, and CodeMirror's view. |
| `children` | `ReactNode` |  | The parts, when the ones it draws by itself aren't the ones you want: a toolbar, the code, and a status bar. |

It also takes the attributes of a `div`, and passes `ref` to it.

## CodeEditorToolbar props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `languages` | `readonly string[]` | `JavaScript, TypeScript, JSX, TSX, CSS, SCSS, HTML, JSON, Markdown, Python, SQL and YAML` | The languages the picker offers, by name. |
| `children` | `ReactNode` |  | More controls, after the toolbar's own: a button to run the code. |

`CodeEditorContent` and `CodeEditorStatus` take the attributes of a `div`.

## Translation

Every name a screen reader hears, and the words in the toolbar, the status bar and the search panel, are in `labels`, in English until you give others. The ones CodeMirror writes itself, such as the name of the list of completions, are passed to its `phrases`. `labels.phrases` takes any others, by CodeMirror's own English.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `toolbar` | `string` |  | The name of the toolbar. |
| `language` | `string` |  | The name of the language picker. |
| `plainText` | `string` |  | The language of code with no language. |
| `wrap` | `string` |  | The button that wraps long lines. |
| `copy` | `string` |  |  |
| `copied` | `string` |  | Said once the code is on the clipboard. |
| `format` | `string` |  |  |
| `formatFailed` | `string` |  | Said when `format` throws, as it does when the code can't be read. |
| `status` | `string` |  | The name of the status bar under the code. |
| `position` | `((line: number, column: number) => string)` |  | Where the cursor is, in the status bar. |
| `selections` | `((count: number) => string)` |  | How many places are selected at once, when it's more than one. |
| `problems` | `((count: number) => string)` |  | How many problems there are, in the status bar. |
| `leave` | `string` |  | Said to a screen reader on the code: Tab indents, and how to leave the editor instead. |
| `error` | `string` |  |  |
| `warning` | `string` |  |  |
| `info` | `string` |  |  |
| `hint` | `string` |  |  |
| `search` | `string` |  | The name of the search panel. |
| `find` | `string` |  |  |
| `replace` | `string` |  |  |
| `findNext` | `string` |  |  |
| `findPrevious` | `string` |  |  |
| `replaceNext` | `string` |  |  |
| `replaceAll` | `string` |  |  |
| `matchCase` | `string` |  |  |
| `wholeWord` | `string` |  |  |
| `regexp` | `string` |  |  |
| `closeSearch` | `string` |  |  |
| `matches` | `((current: number, total: number) => string)` |  | How many matches there are, and which one is selected. |
| `completions` | `string` |  | The list of completions. |
| `foldedCode` | `string` |  | A stretch of folded code, and the button that opens it. |
| `unfold` | `string` |  |  |
| `controlCharacter` | `string` |  | A character there's no sign for, shown as a dot. |
| `phrases` | `Record<string, string>` |  | Any other words CodeMirror writes itself, by its own English, for the extensions you add. They're passed to its `phrases`. |

```tsx
<CodeEditor
  labels={{
    copy: "Code kopiëren",
    find: "Zoeken",
    matches: (current, total) =>
      total === 0 ? "Geen treffers" : `${current} van ${total}`,
  }}
/>
```

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Indents. <kbd>Shift</kbd> <kbd>Tab</kbd> takes an indent out. |
| <kbd>Esc</kbd>, then <kbd>Tab</kbd> | Leaves the code, forward. <kbd>Shift</kbd> <kbd>Tab</kbd> leaves it backward. |
| <kbd>Ctrl</kbd> <kbd>F</kbd> | Opens search. <kbd>F3</kbd> and <kbd>Shift</kbd> <kbd>F3</kbd> go to the next and the previous match. |
| <kbd>Ctrl</kbd> <kbd>Space</kbd> | Shows the completions. <kbd>↑</kbd> <kbd>↓</kbd> move through them, <kbd>Enter</kbd> takes one, <kbd>Esc</kbd> closes them. |
| <kbd>Shift</kbd> <kbd>Alt</kbd> <kbd>F</kbd> | Formats the code, when there's a `format`. |
| <kbd>F8</kbd> | Goes to the next problem. <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>M</kbd> lists them all. |
| <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>[</kbd> | Folds the block the cursor is in. <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>]</kbd> opens it. |
| <kbd>Ctrl</kbd> <kbd>/</kbd> | Comments the line out, or back in. |
| <kbd>Alt</kbd> <kbd>↑</kbd> <kbd>↓</kbd> | Moves the line up or down. |
| <kbd>Ctrl</kbd> <kbd>Z</kbd> | Undo. <kbd>Ctrl</kbd> <kbd>Y</kbd> or <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>Z</kbd> is redo. |
| <kbd>→</kbd> <kbd>←</kbd> | In the toolbar, the next and the previous control. |

On a Mac, <kbd>⌘</kbd> is in place of <kbd>Ctrl</kbd>. These are CodeMirror's own keys, apart from Escape then Tab and formatting.

With `tabBehavior="focus"`, <kbd>Tab</kbd> leaves the code at once, as it does in a text box, and doesn't indent. A read-only editor has nothing to indent, so <kbd>Tab</kbd> leaves it too.

### What the component handles

- The code is a textbox of many lines, with the name, the description and the invalid and required states you give `CodeEditor`, or that a Field gives it.
- A screen reader is told, with the code's description, that Tab indents and how to leave.
- The toolbar is a toolbar with a name, and one stop for the Tab key. Each control has a name, and wrapping says whether it's on.
- The number of matches is said as it changes, and so are copying and a format that failed.
- A problem's kind is a word, an icon and a shape, not a color alone.
- The code is always left to right, in a page that's right to left. The toolbar and the status bar follow the page.
- For someone who asks for less motion, the cursor doesn't blink. In forced colors, the selection is the system's highlight, and the active line and the matching bracket have an outline.
- Each control is 44 pixels on a touch screen, and the code is 16 pixels there, so iOS doesn't zoom the page when it's tapped.

### What you need to handle

- Name it, with `aria-label` or `aria-labelledby`.
- Say what's wrong in words when it's invalid, and point `aria-describedby` at them. `diagnostics` show where, not whether the form can be sent.
- Keep `tabBehavior="indent"` where code is written at length, and use `"focus"` for a short field among others in a form.

## On small screens

The toolbar wraps, and the code scrolls sideways inside the box without the page doing so. Turn `wrap` on for a phone, or let people turn it on from the toolbar. Typing, selecting and scrolling work with a finger, with the phone's own handles for the selection.

## Content security policy

CodeMirror adds its styles to the page as it runs, in a `style` element, and a strict policy turns that away. Give the policy's nonce to `nonce`, and it's put on that element. The [content security policy](../content-security-policy.md) page has the rest.

## CSS variables

Set any of these on a `CodeEditor`, or on anything around it. The box, the toolbar, the status bar and the search panel read these from the stylesheet:

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-code-editor-border` | `var(--color-border)` | Color of the box's border, and of the lines inside it. |
| `--nuv-code-editor-radius` | `var(--radius-lg)` | Corner radius of the box. |
| `--nuv-code-editor-bg` | `var(--color-surface)` | Background of the box and the code. |
| `--nuv-code-editor-fg` | `var(--color-surface-foreground)` | Color of the code that isn't colored. |
| `--nuv-code-editor-invalid-border` | `var(--color-danger)` | Color of the border when it's invalid. |
| `--nuv-code-editor-font` | `var(--font-mono)` | The code's font. The theme's monospace font by default. |
| `--nuv-code-editor-font-size` | `var(--text-sm)` | Size of the code with a mouse. On a touch screen it's never under 16px. |
| `--nuv-code-editor-line-height` | `1.5` | Height of a line, as a number. 1.5 by default. |
| `--nuv-code-editor-padding-block` | `calc(var(--spacing) * 2)` | Space over the first line and under the last. |
| `--nuv-code-editor-gutter-fg` | `var(--color-muted-foreground)` | Color of the line numbers. Keep it at 4.5:1. |
| `--nuv-code-editor-padding-inline` | `calc(var(--spacing) * 3)` | Space before and after each line. |
| `--nuv-code-editor-status-fg` | `var(--color-muted-foreground)` | Color of the status bar. Keep it at 4.5:1. |
| `--nuv-code-editor-status-problems-fg` | `var(--color-foreground)` | Color of the count of problems. |
| `--nuv-code-editor-error` | `var(--color-danger)` | Color of an error. |
| `--nuv-code-editor-warning` | `var(--color-warning)` | Color of a warning. |
| `--nuv-code-editor-info` | `var(--color-primary)` | Color of a note. |
| `--nuv-code-editor-hint` | `var(--color-muted-foreground)` | Color of a hint. |

The code itself is drawn by CodeMirror, which reads these too, and these as well:

| Variable | What it is |
| --- | --- |
| `--nuv-code-editor-token-keyword` and the rest | The colors of the code. Each falls back to `--nuv-code-block-token-*`, so code looks the same here as in a CodeBlock: `comment`, `punctuation`, `keyword`, `string`, `string-expression`, `constant`, `function`, `link`, `inserted`, `deleted` and `changed`. |
| `--nuv-code-editor-cursor` | Color of the cursor. |
| `--nuv-code-editor-selection-bg` | Background of what's selected. |
| `--nuv-code-editor-active-line-bg` | Background of the line the cursor is on, and its number. |
| `--nuv-code-editor-gutter-bg` | Background of the line numbers. None by default. |
| `--nuv-code-editor-gutter-active-fg` | Color of the line number the cursor is on. |
| `--nuv-code-editor-bracket-bg` and `--nuv-code-editor-bracket-border` | The bracket that matches the one at the cursor. |
| `--nuv-code-editor-match-bg`, `--nuv-code-editor-match-border` and `--nuv-code-editor-match-active-bg` | A match of a search, and the one selected. |
| `--nuv-code-editor-placeholder-fg` | Color of the placeholder. Keep it at 4.5:1. |
| `--nuv-code-editor-panel-bg` | Background of the search panel. |
| `--nuv-code-editor-tooltip-bg` and `--nuv-code-editor-tooltip-fg` | A problem's message and the list of completions. |
| `--nuv-code-editor-option-active-bg` and `--nuv-code-editor-option-active-fg` | The completion that's highlighted. |

The toolbar is the core's [Toolbar](../components/toolbar.md#css-variables), and takes its variables.

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-code-editor` | CodeEditor |
| `.nuv-code-editor__body` | CodeEditorContent |
| `.nuv-code-editor__code` | The code itself, the textbox. It's CodeMirror's content element. |
| `.nuv-code-editor__fallback` | The code before CodeMirror has taken over, on a server and as the page starts. |
| `.nuv-code-editor__fallback-code` | Its code. |
| `.nuv-code-editor__fallback-gutter` | Its line numbers. |
| `.nuv-code-editor__glyph` | The letters on an option, drawn from its data-glyph attribute. |
| `.nuv-code-editor__item` | One button in the toolbar. |
| `.nuv-code-editor__language` | The language picker. |
| `.nuv-code-editor__language-name` | The language's name, where the toolbar can't change it. |
| `.nuv-code-editor__matches` | How many matches there are. |
| `.nuv-code-editor__problem` | A problem's message. |
| `.nuv-code-editor__search` | The place CodeMirror makes for the search panel. |
| `.nuv-code-editor__search-button` | A button with an icon in the panel. |
| `.nuv-code-editor__search-field` | The field to find or replace with. |
| `.nuv-code-editor__search-form` | The search panel. |
| `.nuv-code-editor__search-option` | Match case, whole word and regular expression. |
| `.nuv-code-editor__search-row` | A row of it: finding, then replacing. |
| `.nuv-code-editor__severity` | Its kind, as a word and an icon, with data-severity. |
| `.nuv-code-editor__status` | CodeEditorStatus |
| `.nuv-code-editor__status-item` | One fact in it, with data-problems or data-language on those two. |
| `.nuv-code-editor__toolbar` | CodeEditorToolbar, next to nuv-toolbar. |
| `.nuv-code-editor__view` | Where CodeMirror draws the code. |
| `.nuv-code-editor__whole-word` | The underlined letters on the whole word option. |

A state is an attribute on the box: `data-disabled`, `data-readonly` and `data-invalid`. The parts CodeMirror draws have its own `cm-` classes, and are styled from its theme with the variables above.

## Server components

CodeEditor starts with `"use client"`. A server component can render it with `defaultValue` or `value`, a `language` given by name, and a `name`, without `onValueChange`.

On the server, and as the page starts, the code is in a `<pre>` with its line numbers, in the same font, at the same height, so nothing moves when CodeMirror takes over. It isn't colored until then.

## Do and don't

**Do**

- Load it only with the screen that has one. It's about 120 kB compressed, and each language is fetched on its own.
- Give `diagnostics` from a check that runs as the code changes, so a problem goes when it's fixed.
- Keep one editor with a `path` for a set of files, rather than an editor for each.

**Don't**

- Don't use it to show code that can't be changed on a page that has a lot of it. A [CodeBlock](../chat/code-block.md) is lighter.
- Don't run what's written in your page's own origin. The playground block shows code run in a sandboxed frame.
- Don't take a passing check in the editor for one on the server. What reaches it can be written by hand.
