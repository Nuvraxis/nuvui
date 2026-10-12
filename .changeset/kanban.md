---
"@nuvui/kanban": minor
---

A new package, for a kanban board: columns of cards that are moved between and within them.

- `Kanban`, with `KanbanColumn`, `KanbanColumnHeader`, `KanbanCards` and `KanbanCard`. The board keeps which cards are in which column and in what order, by their ids. What a card holds is yours.
- A mouse drags a card from anywhere on it. On a touch screen a finger held on a card picks it up, and one that moves sooner scrolls the board. From the keyboard, Space or Enter on a card's handle picks it up, the arrow keys move it one place or one column at a time, Space or Enter drops it and Escape puts it back.
- Picking a card up, each place it passes, dropping it and putting it back are said to a screen reader, with the column's name and the position in it. `labels` takes the sentences in another language.
- `onValueChange` is called once, when a card is dropped somewhere new, with the columns and the move. With `value`, a move that isn't taken is undone, which is how a column is given a limit or a failed save is put back.
- A column with no cards is still a place to drop one, and draws `empty`. `disabled` stops every card, or one.
- The dragging is done by `@dnd-kit/core` and `@dnd-kit/sortable`, which are installed with the package. `@nuvui/react` is a peer dependency.
