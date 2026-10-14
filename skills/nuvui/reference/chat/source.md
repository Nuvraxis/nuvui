<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/chat/source.mdx. Don't edit it here: run `pnpm skill`. -->

# Source

What a reply was drawn from. A line under the reply that says how many sources there are and opens to a numbered list of links.

Use sources under a reply that was written from documents or pages, so the reader can check it. They start closed: a line that says how many there are, which opens to the list.

```tsx
import {
  Message,
  MessageContent,
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@nuvui/chat";

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 520 }}>
      <Message from="assistant">
        <MessageContent>
          An invoice is due 30 days after it's sent, and a reminder goes out on
          day 31. Late fees start at day 45.
        </MessageContent>
        <Sources>
          <SourcesTrigger>3 sources</SourcesTrigger>
          <SourcesContent>
            <Source
              href="https://example.com/help/payment-terms"
              title="Payment terms"
            />
            <Source
              href="https://www.example.com/help/reminders"
              title="When reminders are sent"
            />
            <Source
              href="#billing-policy"
              title="Billing policy, section 4"
              site="Your workspace"
            />
          </SourcesContent>
        </Sources>
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
import { Source, Sources, SourcesContent, SourcesTrigger } from "@nuvui/chat";
```

The styles come from `@nuvui/chat/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Chat](index.md) covers that.

```tsx
<Sources>
  <SourcesTrigger>2 sources</SourcesTrigger>
  <SourcesContent>
    <Source href="https://example.com/terms" title="Payment terms" />
    <Source href="https://example.com/reminders" title="Reminders" />
  </SourcesContent>
</Sources>
```

## Parts

| Part | What it is |
| --- | --- |
| `Sources` | The whole of it. It keeps whether the list is open. |
| `SourcesTrigger` | The line that opens and closes the list. |
| `SourcesContent` | The list, which is numbered. |
| `Source` | One source: a link. |

## What a source shows

A source is a link with a `title` and, under it, where it's from. That's the site in `href`, without the "www.": `https://www.example.com/help` shows "example.com". Pass `site` to say something else, such as the name of a document store, or `site={null}` for nothing. An address with no site in it, such as `/files/policy.pdf`, shows none.

`Source` takes a link's attributes. Add `target="_blank"` if a source should open beside the conversation and not in place of it.

## The count is yours

`SourcesTrigger` says "Sources" if you give it nothing. Say how many there are: "3 sources". The component doesn't count them for you, since how a number and its noun go together differs from one language to the next.

## Numbers that point at a source

The list is numbered, 1 at the top. If the reply marks a claim with a number, it's the number of its source in this list, in the order you render them.

## Open or closed

It starts closed. `defaultOpen` starts it open, and `open` with `onOpenChange` lets you keep it. These are the [Collapsible](../components/collapsible.md)'s props, which `Sources` is built on.

## Source props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `href` (required) | `string` |  | Where the source is. |
| `title` (required) | `ReactNode` |  | What it's called: the page's title, or the document's name. |
| `site` | `ReactNode` | `The site in 'href', such as "example.com"` | Where it's from, in small text under the title. |

It also takes the attributes of an `a`. `Sources` takes the props of a [Collapsible](../components/collapsible.md#props), `SourcesTrigger` the attributes of a `button`, and `SourcesContent` the attributes of an `ol`. Every part passes `ref` to its element.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | On the line, opens or closes the list. |
| <kbd>Tab</kbd> | Goes from the line to each source in turn. |

### What the component handles

- The line is a button with `aria-expanded`, tied to the list it opens.
- While it's closed the list isn't in the page for a screen reader or for Tab.
- The list is an ordered list, so a screen reader says each source's number.
- A source's title is underlined. It reads as a link without the pointer over it.
- The line is 44 pixels tall on a touch screen, and so is each source.

### What you need to handle

- Give each source a `title` that says what it is. An address isn't a title.
- Say how many sources there are in the trigger.
- If sources open in a new tab, say so, in the title or after it.

## CSS variables

Set any of these on a `Sources`, or on anything around it.

```css
.chat {
  --nuv-source-number-bg: var(--color-primary);
  --nuv-source-number-fg: var(--color-primary-foreground);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-source-trigger-fg` | `var(--color-muted-foreground)` | Color of the line that opens the list. Keep it at 4.5:1. |
| `--nuv-source-trigger-hover-fg` | `var(--color-foreground)` | Its color under the pointer. |
| `--nuv-source-fg` | `var(--color-foreground)` | Color of a source's title. |
| `--nuv-source-number-bg` | `var(--color-muted)` | Background of a source's number. |
| `--nuv-source-number-fg` | `var(--color-muted-foreground)` | Color of the number. Keep it at 4.5:1 against its background. |
| `--nuv-source-hover-bg` | `var(--color-muted)` | Background of a source under the pointer. |
| `--nuv-source-site-fg` | `var(--color-muted-foreground)` | Color of where a source is from. Keep it at 4.5:1. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-source` | Source: the link. |
| `.nuv-source__site` | Where it's from. |
| `.nuv-source__title` | The title. |
| `.nuv-sources` | Sources |
| `.nuv-sources__chevron` | The arrow in it, which turns when the list opens. |
| `.nuv-sources__content` | The part that opens, whose height is animated. |
| `.nuv-sources__item` | The list item around a source. |
| `.nuv-sources__list` | SourcesContent: the list inside it. |
| `.nuv-sources__trigger` | SourcesTrigger |

`Sources`, its trigger and its content have `data-state`, `"open"` or `"closed"`.

## Server components

Source starts with `"use client"`, since the list opens and closes. A server component can render all four parts, without `onOpenChange`.

## Do and don't

**Do**

- Show the sources a reply was really written from, and only those.
- Keep them under the reply they belong to.

**Don't**

- Don't open the list by default under every reply. A long conversation becomes a list of links.
- Don't use it for links the reply merely mentions. Those are links in the text.
