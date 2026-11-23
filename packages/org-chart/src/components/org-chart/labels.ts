import type { OrgChartOrientation } from "./types";

/**
 * Everything the chart says and doesn't draw. Each has an English
 * default. The ones that put names or numbers into a sentence are
 * functions, since the order of the words differs between languages.
 */
export interface OrgChartLabels {
  /** What kind of thing the chart is, read after its name. */
  roleDescription?: string;
  /** How to get around the chart with the keyboard, for each way it grows. */
  instructions?: (orientation: OrgChartOrientation) => string;
  /** Where a name would be, on the card of an open position. */
  vacant?: string;
  /** How many report to someone, read after their name and shown on their card's button. */
  reports?: (count: number) => string;
  /** The name of the button that shows someone's reports. */
  showReports?: (name: string, count: number) => string;
  /** The name of the button that hides them. */
  hideReports?: (name: string, count: number) => string;
  /** The name of the group of buttons. */
  controls?: string;
  zoomIn?: string;
  zoomOut?: string;
  fit?: string;
  /** The name of the box that finds a person. */
  find?: string;
  /** What the box shows while it's empty. */
  findPlaceholder?: string;
  findNext?: string;
  findPrevious?: string;
  /** Which match is shown, of how many. Shown beside the box. */
  matches?: (index: number, count: number) => string;
  /** Said when the box finds no one. */
  noMatches?: string;
  /** Said when a match is shown, with the name the card is read by. */
  found?: (name: string, index: number, count: number) => string;
}

const people = (count: number) =>
  `${count} ${count === 1 ? "direct report" : "direct reports"}`;

export const englishLabels: Required<OrgChartLabels> = {
  roleDescription: "org chart",
  instructions: (orientation) =>
    orientation === "vertical"
      ? "Press the up arrow to go to someone's manager and the down arrow to their reports, showing them if they're hidden. Press the left and right arrows to move between colleagues. Press Space to show or hide someone's reports, and Enter to choose them. Press plus or minus to zoom, and 0 to fit the chart."
      : "Press the arrow toward the start of the line to go to someone's manager, and the other way to their reports, showing them if they're hidden. Press the up and down arrows to move between colleagues. Press Space to show or hide someone's reports, and Enter to choose them. Press plus or minus to zoom, and 0 to fit the chart.",
  vacant: "Open position",
  reports: people,
  showReports: (name, count) => `Show ${name}'s ${people(count)}`,
  hideReports: (name, count) => `Hide ${name}'s ${people(count)}`,
  controls: "Chart controls",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  fit: "Fit the chart",
  find: "Find a person",
  findPlaceholder: "Find a person",
  findNext: "Next match",
  findPrevious: "Previous match",
  matches: (index, count) => `${index} of ${count}`,
  noMatches: "No one found",
  found: (name, index, count) => `${name}. ${index} of ${count}.`,
};
