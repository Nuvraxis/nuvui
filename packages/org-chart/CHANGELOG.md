# @nuvui/org-chart

## 0.1.0

### Minor Changes

- [#132](https://github.com/Nuvraxis/nuvui/pull/132) [`8889578`](https://github.com/Nuvraxis/nuvui/commit/8889578261d988009c43c71ccbf59f69c72eb4a9) Thanks [@sajanv88](https://github.com/sajanv88)! - A new package, for org charts.
  
  - `OrgChart` lays people out under their managers from a flat list, each with an `id` and a `managerId`, in a frame that pans and zooms. Top to bottom, a manager whose reports manage no one has them in a column, so a large company stays narrow. `orientation="horizontal"` grows the chart to the side. Both are mirrored where the page reads right to left.
  - A card has the person's photo, or their initials while it loads and when there's none, with their name, title, department and a badge, such as "On leave". `vacant` makes a card for an open position. `renderCard` draws a card of your own, at `cardSize`.
  - Each manager's card has a button that opens and closes their team, and the card stays where it was while the chart moves around it. `expanded` and `defaultExpanded` say which teams are open, every one by default.
  - A box finds people by name, title or department, without minding case or accents. It opens the teams on the way to a match, moves the view to it and says what it found, and closes the teams it opened again when it goes to another match. `handleRef` has `reveal(id)`, which does the same from your code.
  - The chart is a tree for a screen reader. Each card is an item at its level, named for the person, and the arrow keys follow the lines: to the manager, into the team, and between colleagues. Space opens and closes a team, Enter chooses the person, and a letter goes to the next name that starts with it.
  - The server lays the chart out and sends every card in place. It has no dependencies of its own.
