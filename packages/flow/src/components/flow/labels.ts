import type { FlowShape } from "./geometry";

/** A node a link goes to, with the words on the link if it has any. */
export interface FlowLinkTarget {
  label: string;
  edgeLabel?: string;
}

/**
 * Everything the diagram says and doesn't draw. Each has an English
 * default. The ones that put names into a sentence are functions, since
 * the order of the words differs between languages.
 */
export interface FlowLabels {
  /** What kind of thing the diagram is, read after its name. */
  roleDescription?: string;
  /** What each shape means, read after a node's name. */
  shapes?: Partial<Record<FlowShape, string>>;
  /** Where a node leads, read after its name and shown in the list. */
  leadsTo?: (targets: FlowLinkTarget[]) => string;
  /** How to get around the diagram with the keyboard. */
  instructions?: string;
  /** How to change it with the keyboard, read after `instructions`. */
  editInstructions?: string;
  /** The name of the group of buttons. */
  controls?: string;
  zoomIn?: string;
  zoomOut?: string;
  fit?: string;
  /** The button that shows the diagram as a list. */
  showList?: string;
  hideList?: string;
  /** The name of the list. */
  list?: string;
  /** The button at the end of a long list. */
  showMore?: (count: number) => string;
  /** A step's button in the list, which finds it in the diagram. */
  find?: (label: string) => string;
  /** A link's button in the list of an editable diagram. */
  removeLink?: (from: string, to: string) => string;
  /** Said when a link is started with the keyboard. */
  linking?: (from: string) => string;
  /** Said when a link is made. */
  linked?: (from: string, to: string) => string;
  /** Said when a link that was started is let go. */
  linkCancelled?: string;
  /** Said when nodes are moved. */
  moved?: (labels: string[]) => string;
  /** Said when nodes and links are removed. */
  removed?: (nodes: number, links: number) => string;
}

const list = (items: string[]) =>
  items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

export const englishLabels: Required<FlowLabels> = {
  roleDescription: "flow diagram",
  shapes: {
    box: "step",
    rounded: "step",
    circle: "event",
    diamond: "decision",
    pill: "start or end",
  },
  leadsTo: (targets) =>
    `leads to ${list(
      targets.map((target) =>
        target.edgeLabel
          ? `${target.label} (${target.edgeLabel})`
          : target.label,
      ),
    )}`,
  instructions:
    "Use the arrow keys to move between steps. Press Space to select a step, and Enter to open it. Press plus or minus to zoom, and 0 to fit the diagram.",
  editInstructions:
    "Hold Shift and press an arrow key to move the selected steps. Press L to start a link from a step, move to another and press L again to join them. Press Delete to remove what is selected.",
  controls: "Diagram controls",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  fit: "Fit the diagram",
  showList: "Show as a list",
  hideList: "Hide the list",
  list: "Steps",
  showMore: (count) => `Show ${count} more`,
  find: (label) => `Find ${label} in the diagram`,
  removeLink: (from, to) => `Remove the link from ${from} to ${to}`,
  linking: (from) =>
    `Linking from ${from}. Move to another step and press L, or press Escape to cancel.`,
  linked: (from, to) => `Linked ${from} to ${to}.`,
  linkCancelled: "Link cancelled.",
  moved: (labels) => `Moved ${list(labels)}.`,
  removed: (nodes, links) =>
    nodes && links
      ? `Removed ${plural(nodes, "step", "steps")} and ${plural(links, "link", "links")}.`
      : nodes
        ? `Removed ${plural(nodes, "step", "steps")}.`
        : `Removed ${plural(links, "link", "links")}.`,
};
