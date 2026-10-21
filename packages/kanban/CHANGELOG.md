# @nuvui/kanban

## 0.1.3

### Patch Changes

- Updated dependencies [[`23249f5`](https://github.com/Nuvraxis/nuvui/commit/23249f5adb5edd7f2e83429ae7b6de50e4397944)]:
  - @nuvui/react@0.8.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`edff9a4`](https://github.com/Nuvraxis/nuvui/commit/edff9a4b8620d36176a4875fad6e00e6b53c121d)]:
  - @nuvui/react@0.7.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`15bf3c3`](https://github.com/Nuvraxis/nuvui/commit/15bf3c38570b5b1952dcadc34f90c39ae9fdc592)]:
  - @nuvui/react@0.6.0

## 0.1.0

### Minor Changes

- [#55](https://github.com/Nuvraxis/nuvui/pull/55) [`aa71e64`](https://github.com/Nuvraxis/nuvui/commit/aa71e6417b6bef5df4ac05fea291200ab16c6011) Thanks [@sajanv88](https://github.com/sajanv88)! - A new package, for a kanban board: columns of cards that are moved between and within them.
  
  - `Kanban`, with `KanbanColumn`, `KanbanColumnHeader`, `KanbanCards` and `KanbanCard`. The board keeps which cards are in which column and in what order, by their ids. What a card holds is yours.
  - A mouse drags a card from anywhere on it. On a touch screen a finger held on a card picks it up, and one that moves sooner scrolls the board. From the keyboard, Space or Enter on a card's handle picks it up, the arrow keys move it one place or one column at a time, Space or Enter drops it and Escape puts it back.
  - Picking a card up, each place it passes, dropping it and putting it back are said to a screen reader, with the column's name and the position in it. `labels` takes the sentences in another language.
  - `onValueChange` is called once, when a card is dropped somewhere new, with the columns and the move. With `value`, a move that isn't taken is undone, which is how a column is given a limit or a failed save is put back.
  - A column with no cards is still a place to drop one, and draws `empty`. `disabled` stops every card, or one.
  - The dragging is done by `@dnd-kit/core` and `@dnd-kit/sortable`, which are installed with the package. `@nuvui/react` is a peer dependency.

### Patch Changes

- Updated dependencies [[`0fc08bc`](https://github.com/Nuvraxis/nuvui/commit/0fc08bc21adea0d24f54ef688a3575243d4694a3)]:
  - @nuvui/react@0.5.0
