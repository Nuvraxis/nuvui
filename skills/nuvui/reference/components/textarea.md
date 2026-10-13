<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/textarea.mdx. Don't edit it here: run `pnpm skill`. -->

# Textarea

A text field for several lines. It can grow with what's typed into it.

Use a textarea for text that may run past one line: a comment, an address, a message. For a single line, use an [input](input.md).

```tsx
import { Label, Textarea } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 400,
      }}
    >
      <Label htmlFor="textarea-notes">Notes for the driver</Label>
      <Textarea
        id="textarea-notes"
        placeholder="Gate code, where to leave it"
      />
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
import { Textarea } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `autoResize` | `boolean` | `false` | Grow with the text, so that all of it shows without scrolling. Set `--nuv-textarea-max-height` to stop it at a height and scroll from there. |

Everything else is passed to the `<textarea>` element, including `ref`, `rows`, `value`, `disabled`, `required` and `name`.

## Growing with the text

With `autoResize` the box is as tall as its text, so nothing scrolls out of sight. It shrinks again when text is deleted.

```tsx
import { Label, Textarea } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 400,
      }}
    >
      <Label htmlFor="textarea-reply">Reply</Label>
      <Textarea
        id="textarea-reply"
        autoResize
        rows={2}
        defaultValue="Thanks for the report. We found the cause and a fix is on its way."
        style={
          {
            "--nuv-textarea-min-height": "0px",
            "--nuv-textarea-max-height": "12rem",
          } as never
        }
      />
    </div>
  );
}
```

Two variables set its limits. `--nuv-textarea-min-height` is the height it starts at, 5rem unless you change it. `--nuv-textarea-max-height` is where it stops growing and starts to scroll. There's no limit unless you set one.

Where the browser has the CSS property `field-sizing`, the stylesheet does this alone. Where it doesn't, the component measures the text and sets the height itself. The tests hold both to the same result.

Without `autoResize`, the corner of the box can be dragged to make it taller. It can't be dragged wider, which would push the page around it out of shape.

## States

```tsx
import { Label, Textarea } from "@nuvui/react";

const field = { display: "grid", gap: 6 };

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 20,
        inlineSize: "100%",
        maxInlineSize: 400,
      }}
    >
      <div style={field}>
        <Label htmlFor="textarea-disabled" data-disabled="">
          Disabled
        </Label>
        <Textarea
          id="textarea-disabled"
          disabled
          defaultValue="Closed to replies."
        />
      </div>
      <div style={field}>
        <Label htmlFor="textarea-invalid">Invalid</Label>
        <Textarea
          id="textarea-invalid"
          aria-invalid
          aria-describedby="textarea-invalid-error"
          defaultValue="Hi"
        />
        <span
          id="textarea-invalid-error"
          style={{ color: "var(--color-danger)", fontSize: 14 }}
        >
          Write at least 20 characters.
        </span>
      </div>
    </div>
  );
}
```

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves focus to the textarea, and on from it. It doesn't type a tab. |
| <kbd>Enter</kbd> | Starts a new line. |

### What the component handles

- It renders a native `<textarea>`, so the role, the keyboard and form submission come from the browser.
- The edge uses `--color-border-strong`, which has at least 3:1 contrast with the page in every theme.
- The placeholder has at least 4.5:1 against the box.
- Focus shows a 2 pixel ring in `--color-ring`.
- Text is 16 pixels on a touch screen, so iOS doesn't zoom in when it takes focus.

### What you need to handle

- Give it a name. Use a [label](label.md) whose `htmlFor` matches its `id`, or `aria-label` when there's no visible text.
- If there's a length limit, say so before people start, and say how much room is left as they type.
- When the value is wrong, set `aria-invalid` and describe the problem in text. [Field](field.md) ties the message to the textarea.

## CSS variables

Set any of these on the textarea, or on anything around it.

```css
.comment {
  --nuv-textarea-max-height: 20rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-textarea-width` | `100%` | Width. It fills its container by default. |
| `--nuv-textarea-min-height` | `5rem` | The height it starts at, and never goes under. |
| `--nuv-textarea-max-height` | `none` | The tallest it gets, by growing or by being dragged. Past that it scrolls. |
| `--nuv-textarea-padding-block` | `calc(var(--spacing) * 2)` | Padding above and below. |
| `--nuv-textarea-padding-inline` | `calc(var(--spacing) * 3)` | Padding left and right. |
| `--nuv-textarea-border` | `var(--color-border-strong)` | Border color. |
| `--nuv-textarea-radius` | `var(--radius-md)` | Corner radius. |
| `--nuv-textarea-bg` | `var(--color-surface)` | Background color. |
| `--nuv-textarea-fg` | `var(--color-foreground)` | Text color. |
| `--nuv-textarea-font-size` | `var(--text-base)`, `var(--text-sm)` | Font size. The default differs between touch screens and a mouse. |
| `--nuv-textarea-placeholder` | `var(--color-muted-foreground)` | Color of the placeholder. |
| `--nuv-textarea-readonly-bg` | `var(--color-muted)` | Background color while read-only. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-textarea` | The textarea. |
| `.nuv-textarea--auto-resize` | autoResize |

States are attributes, not modifier classes: `:disabled`, `[readonly]` and `[aria-invalid="true"]`.

## Server components

Textarea is a client component, because growing with the text takes an effect in browsers without `field-sizing`. It carries `"use client"`, and the build checks that the directive is still there in the published files. You can render it from a server component, as the examples on this page do.

## Do and don't

**Do**

- Start it at a height that hints at how much to write.
- Set a maximum height with `autoResize`, so a pasted essay doesn't push the rest of the form off the screen.

**Don't**

- Don't use a textarea for a value that has to be one line.
- Don't cut off what people type without telling them there's a limit.
