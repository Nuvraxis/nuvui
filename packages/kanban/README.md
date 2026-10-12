# @nuvui/kanban

A kanban board for [`@nuvui/react`](https://www.npmjs.com/package/@nuvui/react): columns of cards that are moved between and within them.

This is early: the package is on npm as a 0.x version, and before 1.0 a minor version may rename or remove things. The [changelog](https://nuvui.nuvraxis.com/docs/changelog) says where one does, and the [repository README](https://github.com/Nuvraxis/nuvui#readme) says where things stand.

```sh
pnpm add @nuvui/kanban @nuvui/react
```

```tsx
"use client";

import "@nuvui/react/styles.css";
import "@nuvui/kanban/styles.css";
import {
  Kanban,
  KanbanCard,
  KanbanCards,
  KanbanColumn,
  KanbanColumnHeader,
} from "@nuvui/kanban";

export function Board({ columns, names, titles, save }) {
  return (
    <Kanban aria-label="Work" value={columns} onValueChange={save}>
      {(now) =>
        now.map((column) => (
          <KanbanColumn
            key={column.id}
            value={column.id}
            label={names[column.id]}
          >
            <KanbanColumnHeader count={column.cards.length}>
              {names[column.id]}
            </KanbanColumnHeader>
            <KanbanCards empty="Nothing here yet">
              {column.cards.map((id) => (
                <KanbanCard key={id} value={id} label={titles[id]}>
                  {titles[id]}
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

## What's in it

- `Kanban`: the board. It keeps which cards are in which column and in what order, by their ids, and carries a card while it's moved.
- `KanbanColumn`, `KanbanColumnHeader` and `KanbanCards`: a column, its title with a count and buttons, and its cards, which is the part a card is dropped on.
- `KanbanCard`: one card with any content, and a handle.

## How it behaves

A mouse drags a card from anywhere on it. On a touch screen a finger held on a card picks it up, and one that moves sooner scrolls the board. From the keyboard, Space or Enter on a card's handle picks it up, the arrow keys move it, Space or Enter drops it and Escape puts it back.

Every move is said to a screen reader: the card, the column and the position in it. The sentences are English until you give others through `labels`.

`onValueChange` is called once, when a card is dropped somewhere new, with the columns as they are now and the move that was made. When you keep `value`, a move you don't take is undone, which is how a column is given a limit.

What a card is, its title and the rest, stays with you. The board holds ids.

## Dependencies

`@nuvui/react` is a peer dependency: the board is drawn with its tokens.

The dragging is done by [dnd kit](https://dndkit.com), `@dnd-kit/core` and `@dnd-kit/sortable`. Both are MIT and are ordinary dependencies.

It's a package of its own so that an app which only wants buttons and dialogs doesn't have to install them.

The docs are at https://nuvui.nuvraxis.com/docs/kanban.

## License

MIT
