<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/org-chart/org-chart.mdx. Don't edit it here: run `pnpm skill`. -->

# OrgChart

People under their managers, laid out from a list of who reports to whom, in a frame that pans and zooms. Teams open and close, a box finds a person, and the keyboard follows the lines.

Use an org chart to show who reports to whom: a company, a department, or the people a manager looks after. It shows the shape of the whole, how deep it goes and who has the largest team. To look someone up by name or to compare people, a [table](../table/index.md) does it better, and a [tree](../components/tree.md) shows the same lines in less room.

```tsx
import { OrgChart } from "@nuvui/org-chart";
import { people } from "./people";

export default function Basic() {
  return <OrgChart aria-label="Torphy LLC" people={people} />;
}
```

## Install

```sh
pnpm add @nuvui/org-chart @nuvui/react
```

## Import

```tsx
import { OrgChart } from "@nuvui/org-chart";
```

The styles come from `@nuvui/org-chart/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Org charts](index.md) covers that.

```tsx
<OrgChart aria-label="Torphy LLC" people={people} />
```

## People

Each person has an `id`, and the `managerId` of the person they report to. Someone with no `managerId`, or one that isn't in the list, is at the top. A chart can have more than one person at the top, side by side, such as the heads of several companies.

A card shows the person's `avatar`, their `name`, `title` and `department`, and a `badge` with a word or two, such as "On leave". Their initials show while the photo loads, and in its place when there's none or it doesn't load.

`vacant` marks a position no one holds yet. Its card has a dashed edge, says "Open position" where a name would be, and keeps the title and the department.

People report to each other in the order you list them. A list where people report to each other in a circle is drawn once anyway: the first of them in the list is put at the top.

## Teams that open and close

A manager's card has a button with the number of people who report to them. It shows or hides their team, and the card stays where it was on the screen while the chart around it moves. From the keyboard, Space does the same, and the arrow toward the reports opens a closed team.

Every team is open at first. `defaultExpanded` gives the managers whose teams are open instead, and `expanded` with `onExpandedChange` keeps them yourself, as ids.

```tsx
import { OrgChart } from "@nuvui/org-chart";
import { people } from "./people";

// Only the chief executive's team is open. Finding someone further down
// opens the way to them.
export default function Find() {
  return (
    <OrgChart aria-label="Torphy LLC" people={people} defaultExpanded={["1"]} />
  );
}
```

A manager whose reports manage no one shown has them in a column under them, rather than in a row, which keeps a large company narrow enough to read. `compact={false}` puts them in a row like every other team.

## Finding a person

The box above the chart finds people by their name, title or department, without minding case or accents. The first match is shown as you type: every team on the way to it opens, the view moves to it, and it gets a dashed edge. Every other match is tinted. Enter in the box goes to the next match, and Shift and Enter to the one before, and so do the buttons beside it. A screen reader hears the person found and how many there are.

`search={false}` leaves the box out. `handleRef` shows a person from your own code, as a link elsewhere on the page might:

```tsx
const chart = useRef<OrgChartHandle>(null);

<OrgChart aria-label="Torphy LLC" people={people} handleRef={chart} />;

chart.current?.reveal("14");
```

## Choosing a person

A click on a card chooses that person, and so does Enter. `selected` with `onSelectedChange` keeps the choice, such as to show the person's details beside the chart. Escape clears it. `onPersonOpen` is called on a double click or Enter, for something such as opening a profile.

```tsx
"use client";

import { OrgChart } from "@nuvui/org-chart";
import { useState } from "react";
import { people } from "./people";

export default function Selected() {
  const [selected, setSelected] = useState<string | null>("3");
  const person = people.find((each) => each.id === selected);
  const manager = people.find((each) => each.id === person?.managerId);
  const reports = people.filter((each) => each.managerId === selected);

  return (
    <div>
      <OrgChart
        aria-label="Torphy LLC"
        people={people}
        selected={selected}
        onSelectedChange={setSelected}
      />
      <p aria-live="polite">
        {person
          ? `${person.name ?? "Open position"}, ${person.title}. ${
              manager ? `Reports to ${manager.name}.` : "At the top."
            } ${reports.length} direct ${reports.length === 1 ? "report" : "reports"}.`
          : "No one is chosen. Click a card, or press Enter on one."}
      </p>
    </div>
  );
}
```

## Sideways

`orientation="horizontal"` puts each manager before their reports along the line, so the chart grows to the side. It suits a chart that's deeper than it is wide. Where the page reads right to left, it grows to the left, and a vertical chart is mirrored.

```tsx
import { OrgChart } from "@nuvui/org-chart";
import { people } from "./people";

export default function Horizontal() {
  return (
    <OrgChart
      aria-label="Torphy LLC"
      people={people}
      orientation="horizontal"
    />
  );
}
```

## Cards of your own

`renderCard` draws what's inside a card instead, given the person and how many report to them. `cardSize` sets every card's size, in pixels at a zoom of 1, 240 by 76 by default. The card's words are cut short where they don't fit, so keep what you draw to the size you give.

```tsx
"use client";

import { OrgChart } from "@nuvui/org-chart";
import { people } from "./people";

// Smaller cards, with the name and the department and nothing else.
export default function CustomCard() {
  return (
    <OrgChart
      aria-label="Torphy LLC"
      people={people}
      cardSize={{ width: 200, height: 52 }}
      renderCard={(person) => (
        <span>
          <strong>{person.name ?? "Open position"}</strong>
          <br />
          {person.department}
        </span>
      )}
    />
  );
}
```

A card of your own is named for a screen reader by what's in it, with the number of reports added. Put in it the words that tell the person apart.

## The view

The chart is fitted into its frame when it first shows, unless that makes it too small to read. A larger chart starts at a readable size with its top person in view, and the fit button shows the whole of it.

Drag to pan, on a card or between them. Pinch on a touch screen. The wheel zooms while the chart has focus, or with Ctrl held, which is what a pinch on a trackpad sends. Otherwise it scrolls the page past the chart. The buttons above it zoom out, zoom in and fit, and so do minus, plus and 0. `minZoom` and `maxZoom` are the limits, 0.1 and 2 by default. `controls={false}` leaves the buttons out. `defaultViewport` starts the view somewhere else, and `onViewportChange` is called when it stops moving.

| Method | What it does |
| --- | --- |
| `fit()` | Shows the whole chart. |
| `zoomIn()`, `zoomOut()` | Zooms around the middle of the frame. |
| `reveal(id)` | Opens the teams above a person, moves the view so their card is in the middle, and makes it the card Tab goes to. |
| `getViewport()` | Where the view is now: `{ x, y, zoom }`. |

## Server rendering

The chart is laid out on the server as in the browser, so it's sent whole, with every card and line in place. Until the browser has measured the frame, the top person is at the top in the middle, at the chart's own size, and it's fitted once the frame is known. Each card's place is a `style` attribute, which a [Content Security Policy](../content-security-policy.md) has to allow.

OrgChart starts with `"use client"`. A server component can render it and hand it the list.

## OrgChart props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `aria-label` (required) | `string` |  | The chart's name, for a screen reader. Required. |
| `people` (required) | `OrgChartPerson[]` |  | Everyone in the chart, each with the id of their manager. |
| `orientation` | `"horizontal" \| "vertical"` | `"vertical"` | `vertical` puts each manager above their reports. `horizontal` puts them before their reports along the line, which is to the left, or to the right where the page reads right to left. |
| `expanded` | `string[]` |  | The ids of the managers whose reports are shown, when you keep them. |
| `defaultExpanded` | `string[]` |  | The managers whose reports are shown at first, when you don't keep them. Every manager's when not given. |
| `onExpandedChange` | `((expanded: string[]) => void)` |  | Called with the ids of the managers whose reports are shown, when they change. |
| `selected` | `string \| null` |  | The chosen person's id, when you keep it. |
| `defaultSelected` | `string \| null` | `null` | The person chosen at first, when you don't keep it. |
| `onSelectedChange` | `((id: string \| null) => void)` |  | Called when a person is chosen, with a click or Enter, and with null when Escape clears the choice. |
| `onPersonOpen` | `((id: string) => void)` |  | Called on a double click on a card, or Enter on one. |
| `renderCard` | `((person: OrgChartPerson, info: OrgChartCardInfo) => ReactNode)` |  | What goes inside a card in place of the photo, the name, the title and the department. A card drawn this way is named for a screen reader by what's in it. |
| `cardSize` | `OrgChartCardSize` | `{ width: 240, height: 76 }` | The size of every card, in pixels at a zoom of 1. |
| `compact` | `boolean` | `true` | Whether a manager whose reports manage no one has them in a column under them, rather than in a row, which keeps a chart narrow. Only in a vertical chart. |
| `controls` | `boolean` | `true` | The zoom and fit buttons. |
| `search` | `boolean` | `true` | The box that finds a person by their name, title or department. |
| `minZoom` | `number` | `0.1` |  |
| `maxZoom` | `number` | `2` |  |
| `defaultViewport` | `OrgChartViewport` |  | Where the view starts. When not given, the whole chart if it fits at a size that can be read, and its top if it doesn't. |
| `onViewportChange` | `((viewport: OrgChartViewport) => void)` |  | Called when the view stops moving. |
| `labels` | `OrgChartLabels` |  | The chart's own words, for translating. |
| `handleRef` | `Ref<OrgChartHandle>` |  | The chart's methods: fit, zoom and reveal. |

It also takes the attributes of a `div`, and passes `ref` to it.

## OrgChartPerson

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `id` (required) | `string` |  | Unique in the chart. |
| `managerId` | `string \| null` |  | The id of the person they report to. Leave it out, or `null`, for someone at the top. An id that isn't in the chart counts as none. |
| `name` | `string` |  | Their name. An open position has none. |
| `title` | `string` |  | Their job title. |
| `department` | `string` |  |  |
| `avatar` | `string` |  | The address of their photo. Their initials show while it loads, and in its place if it doesn't. |
| `badge` | `string` |  | A word or two on the card, such as "On leave". |
| `vacant` | `boolean` |  | A position no one holds yet. The card says so where a name would be, and is drawn with a dashed edge. |

## Translation

Everything the chart says and doesn't draw is in `labels`, in English until you give another. The ones that put names or numbers into a sentence are functions.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `roleDescription` | `string` |  | What kind of thing the chart is, read after its name. |
| `instructions` | `((orientation: OrgChartOrientation) => string)` |  | How to get around the chart with the keyboard, for each way it grows. |
| `vacant` | `string` |  | Where a name would be, on the card of an open position. |
| `reports` | `((count: number) => string)` |  | How many report to someone, read after their name and shown on their card's button. |
| `showReports` | `((name: string, count: number) => string)` |  | The name of the button that shows someone's reports. |
| `hideReports` | `((name: string, count: number) => string)` |  | The name of the button that hides them. |
| `controls` | `string` |  | The name of the group of buttons. |
| `zoomIn` | `string` |  |  |
| `zoomOut` | `string` |  |  |
| `fit` | `string` |  |  |
| `find` | `string` |  | The name of the box that finds a person. |
| `findPlaceholder` | `string` |  | What the box shows while it's empty. |
| `findNext` | `string` |  |  |
| `findPrevious` | `string` |  |  |
| `matches` | `((index: number, count: number) => string)` |  | Which match is shown, of how many. Shown beside the box. |
| `noMatches` | `string` |  | Said when the box finds no one. |
| `found` | `((name: string, index: number, count: number) => string)` |  | Said when a match is shown, with the name the card is read by. |

```tsx
<OrgChart
  aria-label="Organigramm"
  people={people}
  labels={{
    roleDescription: "Organigramm",
    vacant: "Offene Stelle",
    reports: (count) => `${count} direkt unterstellt`,
    find: "Person suchen",
    findPlaceholder: "Person suchen",
  }}
/>
```

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Into the chart, on the first card or the one you were on. The find box and the buttons come before it. |
| <kbd>↑</kbd> | To the person's manager. |
| <kbd>↓</kbd> | Opens a closed team, and on an open one goes to the first report. |
| <kbd>←</kbd> <kbd>→</kbd> | To the colleague before or after, under the same manager, in a column of reports too. |
| <kbd>Home</kbd> <kbd>End</kbd> | To the first card or the last one shown. |
| <kbd>Space</kbd> | Opens or closes the person's team. |
| <kbd>Enter</kbd> | Chooses the person, and calls `onPersonOpen`. |
| <kbd>*</kbd> | Opens the teams of everyone beside the person. |
| <kbd>Esc</kbd> | Clears the choice. |
| A letter | To the next person shown whose name starts with it. |
| <kbd>+</kbd> <kbd>-</kbd> <kbd>0</kbd> | Zooms in, zooms out, fits the chart. |

In a sideways chart the arrows follow the lines too: the left arrow goes to the manager and the right one to the reports, the other way round where the page reads right to left, and the up and down arrows go between colleagues. In a vertical chart that reads right to left, the left and right arrows are mirrored with it.

### What the component handles

- The chart is a tree, with its name and "org chart" as what it is. Each card is an item of the tree, at its level, with its place among its colleagues. A manager's card says whether their team is open.
- A card is named in a sentence: the name, the title, the department, the badge and the number of reports, such as "Audrey Jast, Head of Operations, Operations, 4 direct reports".
- One card is a stop for Tab. The arrows move between the rest, and the view moves to keep the card with focus in sight. A team that closes around the card with focus hands it to the manager.
- How to use the keys is written out and read with the chart.
- What the find box finds is said in a live region.
- Each team's button is named for whose team it is, says whether it's open, and isn't a stop for Tab, since Space on the card does the same. A screen reader's cursor still finds it, which is how a team opens on a phone with VoiceOver or TalkBack.
- The buttons are 44 pixels on a touch screen, and so is the area a finger can tap around each team's button. In forced colors the lines are in the text color and the chosen card in the highlight color.

### What you need to handle

- Name the chart with `aria-label`, such as with the company's or the department's name.
- Give a card of your own words that tell people apart.
- What a screen reader says for each card hasn't been checked with NVDA and VoiceOver yet. The tests check the names, roles and states a browser passes on.

## On small screens

The frame is as wide as its container and 32rem tall. One finger drags to pan and two pinch to zoom, so the page doesn't scroll while a finger is on the chart. Keep the frame shorter than the screen, so there's page to scroll by around it. On a narrow screen a sideways chart, or one with only the top teams open, is easier to read.

## CSS variables

Set any of these on an `OrgChart`, or on anything around it.

```css
.company-chart {
  --nuv-org-chart-height: 40rem;
  --nuv-org-chart-card-bg: var(--color-muted);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-org-chart-fg` | `var(--color-foreground)` | Color of the text around the chart. |
| `--nuv-org-chart-height` | `32rem` | Height of the frame. |
| `--nuv-org-chart-border` | `var(--color-border)` | Color of the frame's border. |
| `--nuv-org-chart-radius` | `var(--radius-lg)` | Corner radius of the frame. |
| `--nuv-org-chart-bg` | `var(--color-background)` | Background of the frame. |
| `--nuv-org-chart-line` | `var(--color-border-strong)` | Color of the lines from managers to their reports. Keep it at 3:1 against the frame. |
| `--nuv-org-chart-card-fg` | `var(--color-surface-foreground)` | Color of a card's words. Keep it at 4.5:1 against the card. |
| `--nuv-org-chart-card-bg` | `var(--color-surface)` | Background of a card. |
| `--nuv-org-chart-card-border` | `var(--color-border)` | Color of a card's edge. |
| `--nuv-org-chart-card-radius` | `var(--radius-md)` | Corner radius of a card. |
| `--nuv-org-chart-card-border-hover` | `var(--color-border-strong)` | Color of a card's edge under the pointer. |
| `--nuv-org-chart-selected-border` | `var(--color-ring)` | Edge of the chosen card, and of the match that's shown. |
| `--nuv-org-chart-match-bg` | `var(--color-muted)` | Background of a card the find box matched. |
| `--nuv-org-chart-vacant-bg` | `var(--color-background)` | Background of an open position's card. |
| `--nuv-org-chart-toggle-fg` | `var(--color-muted-foreground)` | Color of the number on a team's button. |
| `--nuv-org-chart-toggle-bg` | `var(--color-surface)` | Background of a team's button. |
| `--nuv-org-chart-toggle-border` | `var(--color-border-strong)` | Color of a team's button's edge. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-org-chart` | OrgChart |
| `.nuv-org-chart__avatar` | Their photo, or their initials. |
| `.nuv-org-chart__badge` | The badge. |
| `.nuv-org-chart__bar` | The find box and the buttons, above the frame. |
| `.nuv-org-chart__card` | A person's card. |
| `.nuv-org-chart__chevron` | The arrow on that button. |
| `.nuv-org-chart__control` | One of the buttons above the frame. |
| `.nuv-org-chart__controls` | The zoom and fit buttons. |
| `.nuv-org-chart__department` | The department. |
| `.nuv-org-chart__find` | The find box with its count and its buttons. |
| `.nuv-org-chart__find-input` | The find box. |
| `.nuv-org-chart__frame` | The frame the chart is drawn in. |
| `.nuv-org-chart__hidden` | Text for screen readers only: the instructions and the live region. |
| `.nuv-org-chart__icon` | A button's icon. |
| `.nuv-org-chart__layer` | The chart at its own size, moved and scaled by the view. |
| `.nuv-org-chart__lines` | The lines from managers to their reports. |
| `.nuv-org-chart__matches` | Which match is shown, of how many. |
| `.nuv-org-chart__meta` | The department and the badge. |
| `.nuv-org-chart__name` | The name. |
| `.nuv-org-chart__seat` | The empty circle on an open position's card. |
| `.nuv-org-chart__text` | The words on a card. |
| `.nuv-org-chart__title` | The title. |
| `.nuv-org-chart__toggle` | The button that opens and closes a team. |
| `.nuv-org-chart__tree` | The tree the cards are in. |

A state is an attribute: `data-orientation` on the chart, and `data-selected`, `data-match`, `data-current-match` and `data-vacant` on a card.

## Do and don't

**Do**

- Start a large company with only its top teams open, and let the find box open the rest.
- Keep titles short enough for a card. The whole title is still read by a screen reader.
- Keep `expanded` yourself when the chart has to open where the reader left it.

**Don't**

- Don't show what isn't anyone's to see, such as pay. The chart shows everything in its cards to everyone who can see the page.
- Don't make a photo the only way to tell people apart. The name is on every card for that.
- Don't use an org chart for a list of people with no reporting lines. A list or a table says it more plainly.
