<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/chat/thread-list.mdx. Don't edit it here: run `pnpm skill`. -->

# ThreadList

The conversations someone has had, for a sidebar. A list where one is open and the others can be opened, grouped under headings, with room for buttons on each row.

Use a thread list beside a conversation, to go back to an earlier one. It's one Tab stop however many conversations there are: the arrow keys move between them, and Tab goes on into the buttons of the row it's at.

```tsx
"use client";

import { ThreadList, ThreadListGroup, ThreadListItem } from "@nuvui/chat";
import { Button } from "@nuvui/react";
import { useState } from "react";

const all = [
  { id: "overdue", title: "Overdue invoices for Contoso", when: "Today" },
  { id: "reminder", title: "Draft a payment reminder", when: "Today" },
  { id: "terms", title: "What our payment terms say", when: "Yesterday" },
  {
    id: "forecast",
    title: "Cash forecast for the next quarter, by month and by customer",
    when: "Yesterday",
  },
];

const bin = (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2.5 4.5h11M6 4.5v-2h4v2M4 4.5l.6 8.5a1 1 0 0 0 1 1h4.8a1 1 0 0 0 1-1l.6-8.5" />
  </svg>
);

export default function Example() {
  const [threads, setThreads] = useState(all);
  const [open, setOpen] = useState<string | null>("overdue");
  const days = [...new Set(threads.map((thread) => thread.when))];

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        inlineSize: "100%",
        maxInlineSize: 300,
      }}
    >
      <ThreadList
        aria-label="Conversations"
        value={open}
        onValueChange={setOpen}
      >
        {days.map((day) => (
          <ThreadListGroup key={day} label={day}>
            {threads
              .filter((thread) => thread.when === day)
              .map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  value={thread.id}
                  actions={
                    <Button
                      intent="ghost"
                      size="sm"
                      aria-label={`Delete ${thread.title}`}
                      style={{ aspectRatio: "1", padding: 0 }}
                      onClick={() => {
                        setThreads((now) =>
                          now.filter((other) => other !== thread),
                        );
                        if (open === thread.id) setOpen(null);
                      }}
                    >
                      {bin}
                    </Button>
                  }
                >
                  {thread.title}
                </ThreadListItem>
              ))}
          </ThreadListGroup>
        ))}
      </ThreadList>
      <p role="status" style={{ margin: 0 }}>
        {open
          ? `Open: ${threads.find((thread) => thread.id === open)?.title}`
          : "None is open."}
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
import { ThreadList, ThreadListGroup, ThreadListItem } from "@nuvui/chat";
```

The styles come from `@nuvui/chat/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Chat](index.md) covers that.

```tsx
<ThreadList aria-label="Conversations" value={open} onValueChange={setOpen}>
  <ThreadListGroup label="Today">
    <ThreadListItem value="a1">Overdue invoices</ThreadListItem>
    <ThreadListItem value="a2">Draft a reminder</ThreadListItem>
  </ThreadListGroup>
</ThreadList>
```

## Parts

| Part | What it is |
| --- | --- |
| `ThreadList` | The list. It keeps which conversation is open. |
| `ThreadListGroup` | Conversations under a heading of their own. |
| `ThreadListItem` | One conversation. |

## Which one is open

`value` is the `value` of the conversation that's open, and `onValueChange` is called with another's when it's pressed, or when Enter or Space is pressed on it. Pass `null` when none is open, as before a new conversation has its first message. `defaultValue` lets the list keep it.

The open one has a background and a bar at its start, so it's told apart without relying on color.

## Groups

`ThreadListGroup` puts a heading over some conversations. Grouping by time is usual: "Today", "Yesterday", "Last week". A list doesn't need groups, and `ThreadListItem` works straight in the `ThreadList`.

## Buttons on a row

`actions` puts buttons at the end of a row: rename, delete, or a [menu](../components/dropdown-menu.md) with both. `detail` puts a word or two before them, such as when the conversation was last written in.

A press on a button is the button's, and doesn't open the conversation. With the keyboard, the buttons of the row that has focus are the next Tab stops. The buttons of every other row are out of the Tab order, so Tab doesn't walk through all of them on its way past.

When a conversation is deleted, its row goes, and focus with it if it was there. Move focus to the row that took its place, or to the button that starts a new conversation.

## A long title

A title takes one line and is cut short with an ellipsis where the row ends. The arrow keys and a screen reader still get the whole of it.

## Finding one by typing

With focus in the list, typing a letter goes to the next conversation that starts with it, and typing a few quickly looks for the word.

## It's a ListView

`ThreadList` is the core's [ListView](../components/list-view.md) with one row selected, and it takes that component's variables as well as its own. Read that page for how the grid, the keys and the rows work.

## ThreadList props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `string \| null` |  | The conversation that's open, when you keep it: its `value`, or `null` for none. Use it with `onValueChange`. |
| `defaultValue` | `string` |  | The one that's open to begin with, when it's kept here. |
| `onValueChange` | `((value: string) => void)` |  | Called with a conversation's `value` when it's opened. |

It also takes the attributes of a `div`.

## ThreadListItem props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` (required) | `string` |  | What the conversation is known by in the list's `value`. |
| `children` (required) | `ReactNode` |  | The conversation's title. A long one is cut short. |
| `detail` | `ReactNode` |  | A word or two after the title: when it was last written in. |
| `actions` | `ReactNode` |  | Buttons at the end of the row: rename, delete, a menu of both. Tab reaches them from the row. |

It also takes `textValue` and `disabled`, which are the [ListViewItem](../components/list-view.md)'s.

## ThreadListGroup props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `label` (required) | `ReactNode` |  | The heading over them: "Today", "Last week". |

Every part passes `ref` to its element.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Into the list, at the row it was last at. Then into that row's buttons, then out. |
| <kbd>↓</kbd> <kbd>↑</kbd> | The next and the previous conversation. |
| <kbd>Home</kbd> <kbd>End</kbd> | The first and the last. |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | Opens the conversation. |
| A letter | The next conversation that starts with it. |

### What the component handles

- It's a grid one column wide, which is the pattern for a list whose rows hold buttons. Each conversation is a row, and the open one has `aria-selected`.
- A group is a group of rows, named by its heading.
- Moving with the arrow keys doesn't open anything. A conversation opens when it's asked for.
- A row is 44 pixels tall.

### What you need to handle

- Name the list with `aria-label`: "Conversations".
- Name each button on a row after its conversation: "Delete Overdue invoices", not "Delete".
- If opening a conversation moves the reader to another page, the list should be on that page too, with the same one open.

## On small screens

On a phone there's no room for the list beside the conversation. Put it in a [Sheet](../components/sheet.md) that opens from a button, or make it a screen of its own.

## CSS variables

Set any of these on a `ThreadList`, or on anything around it.

```css
.sidebar {
  --nuv-thread-list-radius: var(--radius-sm);
  --nuv-list-view-selected-bg: var(--color-surface);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-thread-list-radius` | `var(--radius-md)` | Corner radius of a row. |
| `--nuv-thread-list-heading-fg` | `var(--color-muted-foreground)` | Color of a group's heading. Keep it at 4.5:1. |
| `--nuv-thread-list-detail-fg` | `var(--color-muted-foreground)` | Color of the detail after a title. Keep it at 4.5:1. |

The row itself is the [ListView](../components/list-view.md#css-variables)'s: `--nuv-list-view-hover-bg`, `--nuv-list-view-selected-bg`, `--nuv-list-view-selected-line` and the rest.

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-thread-list` | ThreadList, next to nuv-list-view. |
| `.nuv-thread-list__actions` | The buttons at the end of the row. |
| `.nuv-thread-list__detail` | The detail after it. |
| `.nuv-thread-list__group` | ThreadListGroup |
| `.nuv-thread-list__heading` | A group's heading. |
| `.nuv-thread-list__title` | The title. |

A row also has the class `nuv-thread-list__item`, next to `nuv-list-view__item`. No rule of the package's uses it. It's there for yours.

## Server components

ThreadList starts with `"use client"`: it follows the keys and keeps which row Tab stops at. A server component can render it with `defaultValue`, without `onValueChange`.

## Do and don't

**Do**

- Put the most recent first.
- Give a conversation a title that says what it was about, and let it be renamed.

**Don't**

- Don't open a conversation as the arrow keys pass it. Each one may be a request to your server.
- Don't put more than two buttons on a row. A menu holds the rest.
