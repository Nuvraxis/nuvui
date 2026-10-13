<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/kanban/index.mdx. Don't edit it here: run `pnpm skill`. -->

# Boards

The @nuvui/kanban package. A board of columns with cards that are moved between and within them with a mouse, a finger or the keyboard, installed next to @nuvui/react.

The board is a package of its own, `@nuvui/kanban`, since moving things by dragging needs a library the core doesn't have:

| Component | What it is |
| --- | --- |
| [Kanban](kanban.md) | Columns of cards. A card is dragged to another place in its column or to another column, or moved there with the arrow keys, and each move is read out. |

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

`@nuvui/react` is a peer dependency: the board is drawn with the core's tokens.

The dragging is done by [dnd kit](https://dndkit.com), `@dnd-kit/core` and `@dnd-kit/sortable`, which are installed with the package. You don't import them yourself.

## Load the styles

Import the package's stylesheet once, after the core's:

```tsx title="app/layout.tsx"
import "@nuvui/react/styles.css";
import "@nuvui/kanban/styles.css";
```

Both files open with the same line naming the cascade layers, so the order you import them in doesn't decide which rule wins. The board's styles are also on their own, at `@nuvui/kanban/css/kanban.css`.

## What it keeps and what you keep

The board keeps the order: which cards are in which column, from first to last, by their ids. What a card is, its title and who it belongs to, stays with you, looked up by id when a card is drawn.

```ts
const columns = [
  { id: "todo", cards: ["brief", "quote"] },
  { id: "doing", cards: ["invoice"] },
  { id: "done", cards: [] },
];
```

When a card is dropped somewhere new, `onValueChange` is called once with the columns as they are now and the move that was made. That's the moment to save it.

## What it leaves out

- **Saving.** It hands you the new order. Sending it to your server, and putting a card back when that fails, is yours.
- **Moving columns.** Cards move. The columns stay in the order you give them.
- **Adding, editing and deleting cards.** They're your data. A header and a column take buttons of yours for them.
- **Swimlanes,** rows that run across the columns.
- **Long columns drawn a part at a time.** Every card in a column is on the page. A column with many hundreds of cards is better filtered.
