---
"@nuvui/react": minor
---

Five new components, for dashboards and lists.

- `FormattedNumber` writes a number for a language and region: grouped digits, a currency, a percentage or a short form. `formatNumber` gives the same text as a string.
- `Trend` says which way a number moved and by how much, with an arrow, a color and the direction in words for a screen reader. `good="down"` is for numbers where less is better.
- `Stat`, with `StatLabel`, `StatValue`, `StatDescription` and `StatChart`, is one figure on a dashboard, and `StatGroup` sets several side by side.
- `Timeline`, with `TimelineItem`, `TimelineMarker`, `TimelineContent`, `TimelineTitle`, `TimelineDescription` and `TimelineTime`, is a list of events on a line.
- `Item`, with `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription` and `ItemActions`, is a row with something at each end, and `ItemGroup` is a list of them.
