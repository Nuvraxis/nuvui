<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/org-chart/index.mdx. Don't edit it here: run `pnpm skill`. -->

# Org charts

The @nuvui/org-chart package. People under their managers, with teams that open and close, a box that finds a person, and a view that pans and zooms.

An org chart is a package of its own, `@nuvui/org-chart`. It needs no library the core doesn't have, but most apps have no org chart, and an app without one shouldn't carry it.

| Component | What it is |
| --- | --- |
| [OrgChart](org-chart.md) | People under their managers, laid out from a list of who reports to whom, in a frame that pans and zooms. Teams open and close, and a box finds a person. |

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

`@nuvui/react` is a peer dependency: a card's photo, its badge and the buttons are the core's. Nothing else is installed with it. The layout, the panning and the zooming are written in the package.

## Load the styles

Import the package's stylesheet once, after the core's:

```tsx title="app/layout.tsx"
import "@nuvui/react/styles.css";
import "@nuvui/org-chart/styles.css";
```

Both files open with the same line naming the cascade layers, so the order you import them in doesn't decide which rule wins. The chart's styles are also on their own, at `@nuvui/org-chart/css/org-chart.css`.

## What it keeps and what you keep

The chart is a list of people, each with an `id` and the `managerId` of the person they report to, which is how most HR systems keep them:

```ts
const people = [
  { id: "1", name: "Emmanuelle Muller", title: "Chief Executive Officer" },
  { id: "2", managerId: "1", name: "Rodger Huel", title: "Head of Marketing" },
  { id: "3", managerId: "1", name: "Audrey Jast", title: "Head of Operations" },
];
```

The chart works out where each card goes. Which teams are open and who is chosen can be kept by the chart or by you.

## The people in these examples

They're from [FakerJson](https://fakerjson.com), a service that makes up companies and their employees, each with a manager, under the MIT license. Its photos are Faker's portraits, which are drawn by a model and are CC0. The people were fetched once, by `pnpm org-chart:fetch`, and are kept in the repository, so these pages never call the service. None of them is a real person.

## What it leaves out

- **Editing the chart,** dragging a person to a new manager. Change `managerId` in your list and pass it again.
- **People with two managers,** a dotted line to a second one. Each person has one manager in the chart.
- **Printing or saving the chart as a picture.**
- **Drawing only what's in view.** Every open card is on the page. A chart of a few hundred open cards is quick, and a larger one is best started with only the top teams open.
