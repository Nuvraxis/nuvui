<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/kanban/kanban.mdx. Don't edit it here: run `pnpm skill`. -->

# Kanban

A board of columns with cards that are moved between and within them. A mouse drags a card, a finger holds it and then drags, and the keyboard moves it from its handle. Every move is read out.

Use a board when work goes through a few stages and people move it from one to the next: tasks, tickets, orders, applicants. If nothing is moved by hand, a [table](../table/index.md) with a status column says the same and holds more.

```tsx
"use client";

import {
  Kanban,
  KanbanCard,
  KanbanCards,
  KanbanColumn,
  KanbanColumnHeader,
} from "@nuvui/kanban";

const names: Record<string, string> = {
  todo: "To do",
  doing: "Doing",
  done: "Done",
};

const cards: Record<string, { title: string; owner: string }> = {
  brief: { title: "Write the brief", owner: "Ana" },
  quote: { title: "Send the quote to Contoso", owner: "Sam" },
  call: { title: "Call the supplier", owner: "Ana" },
  invoice: { title: "Raise the invoice", owner: "Lee" },
  contract: { title: "Sign the contract", owner: "Sam" },
};

const columns = [
  { id: "todo", cards: ["brief", "quote", "call"] },
  { id: "doing", cards: ["invoice"] },
  { id: "done", cards: ["contract"] },
];

export default function Example() {
  return (
    <Kanban aria-label="Work for Contoso" defaultValue={columns}>
      {(now) =>
        now.map((column) => (
          <KanbanColumn
            key={column.id}
            value={column.id}
            label={names[column.id] ?? column.id}
          >
            <KanbanColumnHeader count={column.cards.length}>
              {names[column.id]}
            </KanbanColumnHeader>
            <KanbanCards empty="Nothing here yet">
              {column.cards.map((id) => (
                <KanbanCard key={id} value={id} label={cards[id]?.title ?? id}>
                  <div>{cards[id]?.title}</div>
                  <div style={{ color: "var(--color-muted-foreground)" }}>
                    {cards[id]?.owner}
                  </div>
                </KanbanCard>
              ))}
            </KanbanCards>
          </KanbanColumn>
        ))
      }
    </Kanban>
  );
}
```

## Install

```sh
pnpm add @nuvui/kanban @nuvui/react
```

## Import

```tsx
import {
  Kanban,
  KanbanCard,
  KanbanCards,
  KanbanColumn,
  KanbanColumnHeader,
} from "@nuvui/kanban";
```

The styles come from `@nuvui/kanban/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Kanban](index.md) covers that.

```tsx
<Kanban aria-label="Work" value={columns} onValueChange={setColumns}>
  {(columns) =>
    columns.map((column) => (
      <KanbanColumn key={column.id} value={column.id} label={names[column.id]}>
        <KanbanColumnHeader count={column.cards.length}>
          {names[column.id]}
        </KanbanColumnHeader>
        <KanbanCards empty="Nothing here yet">
          {column.cards.map((id) => (
            <KanbanCard key={id} value={id} label={cards[id].title}>
              {cards[id].title}
            </KanbanCard>
          ))}
        </KanbanCards>
      </KanbanColumn>
    ))
  }
</Kanban>
```

## Parts

| Part | What it is |
| --- | --- |
| `Kanban` | The board. It keeps the order of the cards and carries one while it's moved. |
| `KanbanColumn` | One column. |
| `KanbanColumnHeader` | The top of a column: its title, a count and buttons. |
| `KanbanCards` | A column's cards, and the part a card is dropped on. |
| `KanbanCard` | One card, with its handle. |

A column takes anything else as well, such as a button under the cards that adds one.

## The columns and their cards

`value` is the columns in order, each with its `id` and the ids of its `cards` from first to last. It holds no titles and no other data: you look those up by id when you draw a card.

`onValueChange` is called once when a card is dropped somewhere new, with the columns as they are now and the move: the card, and the column and index it went `from` and `to`. It isn't called while a card is carried, and isn't called for a card put back where it was. `defaultValue` lets the board keep the columns itself.

## Why the board draws through a function

The child of `Kanban` is a function that's given the columns to draw. While a card is carried over another column it's already in that column on the page, so that the cards there make room for it, and nothing has been dropped yet. The columns the function gets are those, and `value` is still what it was. Draw from the function's columns and not from your own state.

## Refusing a move

When you keep `value`, a move you don't take is undone: the card goes back to where it was. That's how a column takes only so many cards, or how a card is kept out of "Done" until something is true. Say why, since the card going back says nothing.

```tsx
"use client";

import {
  Kanban,
  KanbanCard,
  KanbanCards,
  KanbanColumn,
  type KanbanColumnData,
  KanbanColumnHeader,
  type KanbanMove,
} from "@nuvui/kanban";
import { useState } from "react";

const names: Record<string, string> = {
  todo: "To do",
  doing: "Doing",
  done: "Done",
};

const titles: Record<string, string> = {
  brief: "Write the brief",
  quote: "Send the quote",
  call: "Call the supplier",
  invoice: "Raise the invoice",
  contract: "Sign the contract",
};

// How many cards "Doing" takes.
const most = 2;

export default function Example() {
  const [columns, setColumns] = useState<KanbanColumnData[]>([
    { id: "todo", cards: ["brief", "quote", "call"] },
    { id: "doing", cards: ["invoice", "contract"] },
    { id: "done", cards: [] },
  ]);
  const [said, setSaid] = useState("Nothing moved yet.");

  function moved(next: KanbanColumnData[], move: KanbanMove) {
    const doing = next.find((column) => column.id === "doing");
    const title = titles[move.card] ?? move.card;
    // Not taking the new columns is what refuses a move: the card goes
    // back to where it was.
    if (move.from.column !== "doing" && doing && doing.cards.length > most) {
      setSaid(`Doing takes ${most} cards. ${title} stays where it was.`);
      return;
    }
    setColumns(next);
    setSaid(`${title} is in ${names[move.to.column]}.`);
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem", inlineSize: "100%" }}>
      <Kanban aria-label="Work" value={columns} onValueChange={moved}>
        {(now) =>
          now.map((column) => (
            <KanbanColumn
              key={column.id}
              value={column.id}
              label={names[column.id] ?? column.id}
            >
              <KanbanColumnHeader
                count={
                  column.id === "doing"
                    ? `${column.cards.length} of ${most}`
                    : column.cards.length
                }
              >
                {names[column.id]}
              </KanbanColumnHeader>
              <KanbanCards empty="Nothing here yet">
                {column.cards.map((id) => (
                  <KanbanCard key={id} value={id} label={titles[id] ?? id}>
                    {titles[id]}
                  </KanbanCard>
                ))}
              </KanbanCards>
            </KanbanColumn>
          ))
        }
      </Kanban>
      <p role="status" style={{ margin: 0 }}>
        {said}
      </p>
    </div>
  );
}
```

The same holds when saving fails: put `value` back to what it was and say so.

## What a card holds

A card takes any content. A button or a link in it works as it would anywhere: a press that doesn't move is a click, and one that moves 8 pixels is a drag. Text in a card can't be selected with the mouse, since that's the same gesture as dragging it.

`label` is the card's name in words. It names the handle, "Move Write the brief", and is what's said as the card moves. Make it tell one card from another.

```tsx
"use client";

import {
  Kanban,
  KanbanCard,
  KanbanCards,
  KanbanColumn,
  KanbanColumnHeader,
} from "@nuvui/kanban";
import { Badge, Button } from "@nuvui/react";
import { useState } from "react";

const names: Record<string, string> = {
  open: "Open",
  review: "In review",
};

const tickets: Record<string, { title: string; urgent?: boolean }> = {
  "T-101": { title: "Export fails for a report over a year", urgent: true },
  "T-102": { title: "Add the customer's VAT number to the invoice" },
  "T-103": { title: "A reminder is sent twice" },
  "T-104": { title: "Locked account after one wrong password", urgent: true },
};

export default function Example() {
  const [opened, setOpened] = useState("No ticket opened yet.");

  return (
    <div style={{ display: "grid", gap: "0.75rem", inlineSize: "100%" }}>
      <Kanban
        aria-label="Tickets"
        defaultValue={[
          { id: "open", cards: ["T-101", "T-102", "T-103"] },
          { id: "review", cards: ["T-104"] },
        ]}
      >
        {(now) =>
          now.map((column) => (
            <KanbanColumn
              key={column.id}
              value={column.id}
              label={names[column.id] ?? column.id}
            >
              <KanbanColumnHeader count={column.cards.length}>
                {names[column.id]}
              </KanbanColumnHeader>
              <KanbanCards empty="No tickets">
                {column.cards.map((id) => (
                  <KanbanCard
                    key={id}
                    value={id}
                    label={`${id}, ${tickets[id]?.title}`}
                  >
                    <div style={{ display: "grid", gap: "0.5rem" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{ color: "var(--color-muted-foreground)" }}
                        >
                          {id}
                        </span>
                        {tickets[id]?.urgent ? (
                          <Badge intent="danger">Urgent</Badge>
                        ) : null}
                      </div>
                      <div>{tickets[id]?.title}</div>
                      <div>
                        <Button
                          intent="secondary"
                          size="sm"
                          aria-label={`Open ${id}`}
                          onClick={() => setOpened(`Opened ${id}.`)}
                        >
                          Open
                        </Button>
                      </div>
                    </div>
                  </KanbanCard>
                ))}
              </KanbanCards>
            </KanbanColumn>
          ))
        }
      </Kanban>
      <p role="status" style={{ margin: 0 }}>
        {opened}
      </p>
    </div>
  );
}
```

## A column with no cards

`KanbanCards` is the part a card is dropped on. It keeps a least height with no cards in it, and `empty` is drawn there. While a card is over it, it has a dashed outline.

## Disabled

`disabled` on `Kanban` stops every card from being moved, for someone who can look and not change. `disabled` on a `KanbanCard` stops that one. Other cards still move around it, and are dropped before or after it.

## Kanban props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `KanbanColumnData[]` |  | The columns and the order of the cards in each, when you keep them. Use it with `onValueChange`. A move you don't take is undone. |
| `defaultValue` | `KanbanColumnData[]` |  | The columns to begin with, when they're kept here. |
| `onValueChange` | `((value: KanbanColumnData[], move: KanbanMove) => void)` |  | Called once when a card is dropped somewhere new, with the columns as they are now and the move that was made. Not called while a card is still being carried. |
| `children` (required) | `(columns: KanbanColumnData[]) => ReactNode` |  | Draws the board. It's given the columns to draw, which while a card is carried are not yet the ones in `value`. |
| `disabled` | `boolean` | `false` | No card can be moved. |
| `labels` | `KanbanLabels` |  | What's said and not drawn, for another language. |

It also takes the attributes of a `div`.

## KanbanColumn props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` (required) | `string` |  | What the column is known by: its `id` in the board's `value`. |
| `label` (required) | `string` |  | The column's name in words: "To do". It names the column to a screen reader and is said when a card is moved into it. |

## KanbanColumnHeader props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `children` (required) | `ReactNode` |  | The column's title as it's drawn. |
| `count` | `ReactNode` |  | Shown after the title, most often how many cards there are. |
| `actions` | `ReactNode` |  | Buttons at the end of the header: add a card, a menu. |

## KanbanCards props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `empty` | `ReactNode` |  | Shown in place of the cards when the column has none. |

## KanbanCard props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` (required) | `string` |  | What the card is known by in its column's `cards`. |
| `label` (required) | `string` |  | The card's name in words. It names the handle, "Move" and this, and is said as the card is moved. |
| `disabled` | `boolean` | `false` | This card can't be moved. |
| `handleRef` | `Ref<HTMLButtonElement>` |  | For the handle, when you need it. |

It also takes the attributes of an `li`. Every part passes `ref` to its element.

## Translation

Everything that's said and not drawn is in `labels`, in English until you give another. Each is a whole sentence, built by a function from the card's name and its place, since those go together differently in each language.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `move` | `((card: string) => string)` |  | The name of a card's handle. |
| `roleDescription` | `string` |  | What kind of thing the handle is, read after its name. |
| `instructions` | `string` |  | How to move a card with the keyboard, read with the handle. |
| `picked` | `((card: string, place: KanbanSpokenPlace \| null) => string)` |  | Said when a card is picked up, with where it is. |
| `over` | `((card: string, place: KanbanSpokenPlace) => string)` |  | Said at each place a carried card comes to. |
| `dropped` | `((card: string, place: KanbanSpokenPlace \| null) => string)` |  | Said when it's dropped, with where it now is. |
| `cancelled` | `((card: string) => string)` |  | Said when it's put back with Escape. |

A place is the column's `label`, a `position` counted from 1, and the `total` of cards in that column with this one counted.

```tsx
<Kanban
  labels={{
    move: (card) => `Verplaats ${card}`,
    over: (card, place) =>
      `${card} staat op ${place.position} van ${place.total} in ${place.column}.`,
  }}
>
```

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | To each card's handle in turn, and to what's in the card. |
| <kbd>Space</kbd> or <kbd>Enter</kbd> | On a handle, picks the card up. With a card picked up, drops it. |
| <kbd>↓</kbd> <kbd>↑</kbd> | Moves the card one place down or up its column. |
| <kbd>→</kbd> <kbd>←</kbd> | Moves the card into the next column that way, one column at a time. |
| <kbd>Esc</kbd> | Puts the card back where it was. |

The arrows go by where things are on the screen. Where the page reads right to left the first column is at the right, and <kbd>←</kbd> goes to the one after it.

### With a mouse and on a touch screen

A mouse drags a card from anywhere on it. On a touch screen a finger held on a card for a quarter of a second picks it up, and a finger that moves sooner scrolls the board. Near an edge the board and the column scroll under a card that's carried.

### What the component handles

- The board and each column are groups with a name. A column's cards are a list.
- A card's handle is a button. It's described by how to move a card with the keyboard, and says when it's pressed.
- Picking a card up, each place it passes, dropping it and putting it back are each said, with the column's name and the position in it.
- When a card is dropped, focus is on its handle again, in whichever column it's now in.
- The handle is 44 pixels on a touch screen.
- With reduced motion, cards don't slide to make room and a dropped card is in its place at once.

### What you need to handle

- Name the board with `aria-label`, and give every column and every card a `label` that tells it from the others.
- Dragging is never the only way: the keyboard moves a card. For someone who can't do either comfortably, a menu on the card with "Move to" and the columns is worth having, and changing `value` yourself is all it takes.
- Name each button in a card after its card: "Open T-101", not "Open".

## On small screens

The columns stay side by side and the board scrolls sideways. A column is at most 85% of the board's width, so some of the next one shows. The page itself doesn't scroll sideways.

A card dragged to the edge scrolls the board to the next column. For a board with many columns, a menu on the card that moves it is quicker on a phone than carrying it across.

## CSS variables

Set any of these on a `Kanban`, or on anything around it.

```css
.board {
  --nuv-kanban-column-width: 20rem;
  --nuv-kanban-max-height: 70dvh;
}
```

With `--nuv-kanban-max-height` set, a column is no taller than that and its cards scroll inside it.

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-kanban-gap` | `calc(var(--spacing) * 4)` | Space between columns. |
| `--nuv-kanban-fg` | `var(--color-foreground)` | Color of the text. |
| `--nuv-kanban-column-width` | `18rem` | Width of a column. It's never more than 85% of the board. |
| `--nuv-kanban-max-height` | `none` | The most a column's height can be. Its cards scroll inside it. No limit by default. |
| `--nuv-kanban-column-border` | `var(--color-border)` | Color of a column's border. |
| `--nuv-kanban-radius` | `var(--radius-lg)` | Corner radius of a column. |
| `--nuv-kanban-column-bg` | `var(--color-muted)` | Background of a column. |
| `--nuv-kanban-count-fg` | `var(--color-muted-foreground)` | Color of the count in a header. Keep it at 4.5:1 against the column. |
| `--nuv-kanban-over-border` | `var(--color-ring)` | Color of the outline of an empty column with a card over it. |
| `--nuv-kanban-card-gap` | `calc(var(--spacing) * 2)` | Space between cards. |
| `--nuv-kanban-empty-fg` | `var(--color-muted-foreground)` | Color of the words in a column with no cards. Keep it at 4.5:1 against the column. |
| `--nuv-kanban-card-border` | `var(--color-border)` | Color of a card's border. |
| `--nuv-kanban-card-radius` | `var(--radius-md)` | Corner radius of a card. |
| `--nuv-kanban-card-bg` | `var(--color-background)` | Background of a card. |
| `--nuv-kanban-card-shadow` | `var(--shadow-xs)` | Shadow of a card. |
| `--nuv-kanban-placeholder-border` | `var(--color-muted-foreground)` | Color of the dashed edge of the place a carried card would land. Keep it at 3:1 against the column. |
| `--nuv-kanban-placeholder-bg` | `transparent` | Background of that place. |
| `--nuv-kanban-overlay-shadow` | `var(--shadow-lg)` | Shadow of the card under the pointer. |
| `--nuv-kanban-handle-fg` | `var(--color-muted-foreground)` | Color of a handle. Keep it at 3:1. |
| `--nuv-kanban-handle-hover-fg` | `var(--color-foreground)` | Its color with the pointer over it. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-kanban` | Kanban |
| `.nuv-kanban__actions` | The buttons at the end of a header. |
| `.nuv-kanban__card` | KanbanCard, and the card under the pointer. |
| `.nuv-kanban__card-content` | What the card holds. |
| `.nuv-kanban__cards` | KanbanCards, the part a card is dropped on. |
| `.nuv-kanban__column` | KanbanColumn |
| `.nuv-kanban__count` | The count after it. |
| `.nuv-kanban__empty` | What's drawn with no cards. |
| `.nuv-kanban__handle` | The handle. |
| `.nuv-kanban__header` | KanbanColumnHeader |
| `.nuv-kanban__list` | The list of cards inside it. |
| `.nuv-kanban__title` | The title in a header. |

A part's state is an attribute: `data-dragging` on the board and on the card that's carried, `data-overlay` on the card under the pointer, `data-over` and `data-empty` on a column's cards, and `data-disabled` on the board and on a card that can't be moved.

## Server components

Kanban starts with `"use client"`, and its child is a function, which a server component can't pass. Put the board in a client component of your own and hand that the columns.

## Do and don't

**Do**

- Keep the columns few enough to see together on a desk screen.
- Show how many cards a column holds.
- Say why when a move isn't taken.

**Don't**

- Don't make dragging the only way to change a card's stage. The card's own page should have a field for it too.
- Don't save on every arrow key. `onValueChange` comes once, when the card is dropped.
- Don't give two cards the same `label`.
