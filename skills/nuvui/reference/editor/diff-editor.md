<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/editor/diff-editor.mdx. Don't edit it here: run `pnpm skill`. -->

# DiffEditor

Two texts and what changed between them, side by side or in one column, on CodeMirror. Unchanged lines are folded away, and each change can be kept or undone.

Use it to show what changed: a review of a change to a file, a config before and after, two versions of a template. Each change is marked with + and − as well as its color, and the toolbar moves from one to the next.

```tsx
"use client";

import { DiffEditor } from "@nuvui/editor/code";

const before = `export const shipping = {
  carrier: "Northwind Freight",
  days: 5,
  free_over: 80,
};

export function cost(total: number) {
  if (total > shipping.free_over) return 0;
  return 6.5;
}
`;

const after = `export const shipping = {
  carrier: "Northwind Freight",
  days: 3,
  freeOver: 60,
};

export function cost(total: number, express = false) {
  if (total >= shipping.freeOver) return 0;
  return express ? 12 : 6.5;
}
`;

export default function Example() {
  return (
    <div style={{ inlineSize: "100%" }}>
      <DiffEditor
        aria-label="Changes to shipping.ts"
        original={before}
        defaultModified={after}
        language="typescript"
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
import { DiffEditor } from "@nuvui/editor/code";
```

It's imported from `@nuvui/editor/code`, as [CodeEditor](code-editor.md) is, and colors code the same way.

```tsx
<DiffEditor
  aria-label="Changes to shipping.ts"
  original={before}
  defaultModified={after}
  language="typescript"
/>
```

## Parts

By itself `DiffEditor` draws a toolbar, the two texts and a status bar. Give it children to choose the parts yourself.

| Part | What it is |
| --- | --- |
| `DiffEditor` | The box. It keeps the changed text. |
| `DiffEditorToolbar` | The row over the texts: the layout, the previous and next change, keeping and undoing a change, and opening what's folded. Your own controls go after them as children. |
| `DiffEditorContent` | The two texts. |
| `DiffEditorStatus` | The line under them: how many changes there are, and how many lines were added and removed. |

## The two texts

`original` is the text before, and `modified` the text after, with `onModifiedChange` when you keep it, or `defaultModified` when the editor does. Both are read only by default, for a review: they can be selected, searched and copied.

`onModifiedChange` is called with the text and a summary: how many `changes` there are, and how many lines were `added` and `removed`. The status bar says the same in words.

## Layout

`layout` is `"split"`, the two side by side, or `"unified"`, one column with what was removed over what replaced it. The toolbar switches between them: with `layout` and `onLayoutChange` the layout is yours, and with `defaultLayout` the editor keeps it.

```tsx
"use client";

import { DiffEditor } from "@nuvui/editor/code";

const before = `{
  "name": "harbor-dashboard",
  "version": "2.3.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
`;

const after = `{
  "name": "harbor-dashboard",
  "version": "2.4.0",
  "scripts": {
    "dev": "vite --port 4100",
    "build": "vite build",
    "preview": "vite preview"
  }
}
`;

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 640 }}>
      <DiffEditor
        aria-label="Changes to package.json"
        original={before}
        defaultModified={after}
        language="json"
        defaultLayout="unified"
      />
    </div>
  );
}
```

A split layout narrower than `minSplitWidth`, 720 pixels by default, is drawn in one column. It's measured on the box, not the window, so a diff editor in a narrow panel is in one column on a wide screen.

## Unchanged lines

`collapseUnchanged` folds long stretches of unchanged lines away, and it's on by default. Three lines around each change stay in view, and a stretch of fewer than four isn't folded: give `{ margin, minSize }` for other numbers, or `false` to show everything. A fold says how many lines it holds, and pressing it opens it. The toolbar's Show unchanged lines opens them all.

```tsx
"use client";

import { DiffEditor } from "@nuvui/editor/code";

// Forty lines of a style sheet, two of them changed.
const rows = Array.from(
  { length: 40 },
  (_, index) =>
    `.row-${index + 1} { padding: ${4 + (index % 4) * 2}px; color: var(--ink-${(index % 6) + 1}); }`,
);
const before = `${rows.join("\n")}\n`;
const after = `${rows
  .map((row, index) =>
    index === 8
      ? row.replace("padding: 4px", "padding: 6px")
      : index === 31
        ? `${row}\n.row-32-wide { padding-inline: 24px; }`
        : row,
  )
  .join("\n")}\n`;

export default function Example() {
  return (
    <div style={{ inlineSize: "100%" }}>
      <DiffEditor
        aria-label="Changes to rows.css"
        original={before}
        defaultModified={after}
        language="css"
        collapseUnchanged={{ margin: 2 }}
      />
    </div>
  );
}
```

## Moving between changes

The toolbar's Previous change and Next change, and <kbd>Alt</kbd> <kbd>↑</kbd> and <kbd>Alt</kbd> <kbd>↓</kbd> in the text, move the cursor to a change. A screen reader is told which, "Change 2 of 5".

## Keeping and undoing a change

With `editable`, the changed text can be edited, and each change has two buttons beside it: Keep change, and Undo change. Undoing writes the original's lines back. Keeping writes the change into the original shown, so it's no longer a change. The toolbar has the same two for the change the cursor is in.

```tsx
"use client";

import { DiffEditor, type DiffEditorSummary } from "@nuvui/editor/code";
import { useState } from "react";

const before = `name: Restock reminders
schedule: "0 8 * * 1"
stores:
  - Harbor Street
  - Mill Lane
threshold: 12
notify: ops@example.com
`;

const proposed = `name: Restock reminders
schedule: "0 7 * * 1-5"
stores:
  - Harbor Street
  - Mill Lane
  - Quayside
threshold: 8
notify: ops@example.com
`;

export default function Example() {
  const [original, setOriginal] = useState(before);
  const [modified, setModified] = useState(proposed);
  const [summary, setSummary] = useState<DiffEditorSummary | null>(null);

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <DiffEditor
        aria-label="Proposed changes to restock.yaml"
        original={original}
        onOriginalChange={setOriginal}
        modified={modified}
        onModifiedChange={(next, now) => {
          setModified(next);
          setSummary(now);
        }}
        language="yaml"
        editable
      />
      <p style={{ margin: 0, fontSize: 14 }}>
        {summary
          ? `${summary.changes} left to decide on.`
          : "Keep or undo each change beside it, or from the toolbar."}
      </p>
    </div>
  );
}
```

`onModifiedChange` is called after each, with what's left. Keeping a change also calls `onOriginalChange`, with the original the change is now written into. Give that back as `original`, as this example does, so a change that was kept stays kept when the editor is drawn again. The text to save is the one `onModifiedChange` gives you. Any other new `original` from you replaces the one shown.

## From outside

`editorRef` gives a handle on the diff editor:

| Method | What it does |
| --- | --- |
| `focus()` | Puts the cursor in the changed text. |
| `getModified()` | The changed text now. |
| `nextChange()`, `previousChange()` | Moves to a change, and says which it is. |

## DiffEditor props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `original` (required) | `string` |  | The text before. |
| `modified` | `string` |  | The text after, when you keep it. Use it with `onModifiedChange`. |
| `defaultModified` | `string` |  | The text after, to begin with, when it's kept here. |
| `onModifiedChange` | `((modified: string, summary: DiffEditorSummary) => void)` |  | Called after the changed text is edited, or a change is kept or undone, with the text and what changed now. |
| `onOriginalChange` | `((original: string) => void)` |  | Called after a change is kept, with the original as it is now, the change written into it. Give it back as `original`, so a change that was kept stays kept when the editor is drawn again. |
| `editable` | `boolean` | `false` | The changed text can be edited, and each change has a button beside it that keeps it and one that undoes it. Both texts are read only without it, for a review. |
| `layout` | `"split" \| "unified"` |  | The layout, when you keep it. |
| `defaultLayout` | `"split" \| "unified"` | `"split"` | The layout to begin with, when the toolbar changes it here. |
| `onLayoutChange` | `((layout: DiffEditorLayout) => void)` |  |  |
| `minSplitWidth` | `number` | `720` | Below this width, measured on the box and not the window, a split layout is drawn in one column. |
| `collapseUnchanged` | `boolean \| { margin?: number; minSize?: number; }` | `true` | Folds long stretches of unchanged lines away, keeping `margin` lines around each change. |
| `language` | `CodeEditorLanguage` |  | The language of both texts, as `CodeEditor` takes it. |
| `lineNumbers` | `boolean` | `true` |  |
| `wrap` | `boolean` | `false` | Wraps lines longer than the box. |
| `nonce` | `string` |  | The nonce of a content security policy, as `CodeEditor` takes it. |
| `extensions` | `readonly Extension[]` |  | Anything else CodeMirror has, for both texts. |
| `labels` | `DiffEditorLabels` |  | What's said and not drawn, for another language. |
| `editorRef` | `Ref<DiffEditorHandle>` |  | The diff editor from outside: the changed text, and moving between changes. |
| `children` | `ReactNode` |  | The parts, when the ones it draws by itself aren't the ones you want. |

It also takes the attributes of a `div`, and passes `ref` to it. `DiffEditorToolbar` takes `children`, controls of your own after its own, and `DiffEditorContent` and `DiffEditorStatus` take the attributes of a `div`.

## Translation

Every name a screen reader hears, and the words in the toolbar and the status bar, are in `labels`, in English until you give others.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `toolbar` | `string` |  |  |
| `layout` | `string` |  | The name of the switch between the two layouts. |
| `split` | `string` |  |  |
| `unified` | `string` |  |  |
| `previousChange` | `string` |  |  |
| `nextChange` | `string` |  |  |
| `keep` | `string` |  | Keeps a change, so it's no longer shown as one. |
| `undo` | `string` |  | Puts a change back to the original. |
| `showUnchanged` | `string` |  | Opens the unchanged lines that are folded away. |
| `original` | `string` |  | The names of the two texts. |
| `modified` | `string` |  |  |
| `status` | `string` |  | The name of the status bar. |
| `summary` | `((summary: DiffEditorSummary) => string)` |  | What changed, in the status bar and to a screen reader. |
| `position` | `((current: number, total: number) => string)` |  | Which change the cursor is in, said when it moves to one. |
| `added` | `string` |  | Said for each line that's new or gone, which is also drawn as + or −. |
| `removed` | `string` |  |  |
| `unchangedLines` | `((count: number) => string)` |  | A stretch of unchanged lines that's folded away. |

```tsx
<DiffEditor
  labels={{
    keep: "Wijziging houden",
    undo: "Wijziging ongedaan maken",
    position: (current, total) => `Wijziging ${current} van ${total}`,
  }}
/>
```

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | To the toolbar, then the texts, then the buttons beside each change, then out. |
| <kbd>Alt</kbd> <kbd>↓</kbd> <kbd>↑</kbd> | In a text, the next and the previous change. |
| <kbd>Space</kbd> or <kbd>Enter</kbd> | On a button beside a change, presses it. |
| <kbd>Ctrl</kbd> <kbd>F</kbd> | Searches the text, as in CodeEditor. |
| <kbd>→</kbd> <kbd>←</kbd> | In the toolbar, the next and the previous control. |

### What the component handles

- The box is a group with the name you give it. Each text is a textbox named Original or Changed, and read only unless `editable` is set.
- A change is never shown by color alone. The gutter has + and −, a screen reader hears "added" or "removed" at the start of each changed line, and in forced colors each changed line has a border.
- Moving to a change says which it is. The status bar counts the changes and the lines added and removed.
- The buttons beside a change work with a press of a key, not only a click. Each is 44 pixels on a touch screen.
- The texts are always left to right, in a page that's right to left. The toolbar and the status bar follow the page.

### What you need to handle

- Name it, with `aria-label` or `aria-labelledby`: what changed, and in which file.
- Save the text `onModifiedChange` gives you. The editor doesn't know where the change came from or where it goes.

## On small screens

A split layout is in one column below `minSplitWidth`, measured on the box. Long lines scroll sideways inside it, or wrap with `wrap`.

## Content security policy

As in CodeEditor, CodeMirror writes its styles in `<style>` elements. Give the policy's nonce to `nonce`.

## CSS variables

The box, the toolbar and the status bar read these from the stylesheet:

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-diff-editor-border` | `var(--color-border)` | Color of the box's border, and of the lines inside it. |
| `--nuv-diff-editor-radius` | `var(--radius-lg)` | Corner radius of the box. |
| `--nuv-diff-editor-max-height` | `32rem` | The most the texts' height can be. They scroll inside it. 32rem by default. |
| `--nuv-diff-editor-status-fg` | `var(--color-muted-foreground)` | Color of the status bar. Keep it at 4.5:1. |

The texts are drawn by CodeMirror, which reads these, and CodeEditor's for the code itself:

| Variable | What it is |
| --- | --- |
| `--nuv-diff-editor-inserted-bg` | Background of a line that's new. Mixed from `--color-success`. |
| `--nuv-diff-editor-deleted-bg` | Background of a line that's gone. Mixed from `--color-danger`. |
| `--nuv-diff-editor-inserted-text-bg` and `--nuv-diff-editor-deleted-text-bg` | The stronger color for the words that changed inside a line. |
| `--nuv-diff-editor-inserted-fg` and `--nuv-diff-editor-deleted-fg` | Color of the + and − in the gutter. |
| `--nuv-diff-editor-folded-bg` and `--nuv-diff-editor-folded-fg` | A stretch of unchanged lines that's folded. |
| `--nuv-diff-editor-controls-width` | Width of the column between the two texts, where the buttons beside each change are. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-diff-editor` | DiffEditor, with data-layout and data-editable. |
| `.nuv-diff-editor__body` | DiffEditorContent, the part that scrolls. |
| `.nuv-diff-editor__chunk-button` | One of them. |
| `.nuv-diff-editor__chunk-controls` | The two buttons beside a change, side by side. |
| `.nuv-diff-editor__code` | Each text itself, a textbox. |
| `.nuv-diff-editor__fallback` | The changed text before CodeMirror has taken over. |
| `.nuv-diff-editor__group` | The switch between the layouts. |
| `.nuv-diff-editor__item` | One button in the toolbar. |
| `.nuv-diff-editor__status` | DiffEditorStatus |
| `.nuv-diff-editor__toolbar` | DiffEditorToolbar, next to nuv-toolbar. |
| `.nuv-diff-editor__view` | Where CodeMirror draws the texts. |

`data-layout` is the layout that's drawn, so a split that's too narrow says `unified`.

## Server components

DiffEditor starts with `"use client"`. A server component can render it with `original` and `defaultModified`. Until the page is in a browser, the changed text is shown in a `<pre>`, and the changes are marked once CodeMirror takes over.

## Do and don't

**Do**

- Name it after what changed, so a screen reader knows which review it's in.
- Keep `collapseUnchanged` on for long files, so a change isn't lost in what didn't change.
- Save what `onModifiedChange` gives you, which has every change that was kept.

**Don't**

- Don't use color alone to say what changed elsewhere on the page, as the editor doesn't.
- Don't make a review `editable` where the reviewer can't change the file, as with a change someone else is proposing.
