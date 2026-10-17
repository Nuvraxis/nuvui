import type { FlowPath, FlowShape, Point, Size } from "./geometry";

export type { FlowPath, FlowShape, FlowViewport } from "./geometry";

/** The colors a node or an edge can be drawn in, as elsewhere in nuvui. */
export type FlowIntent =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger";

/** One shape in the diagram. */
export interface FlowNode {
  /** What edges and changes know it by. Unique in the diagram. */
  id: string;
  /** The words in the shape, and its name for a screen reader. */
  label: string;
  /** Its top left corner, in the diagram's own units. */
  position: Point;
  /** @default "rounded" */
  shape?: FlowShape;
  /** Its size, in the diagram's units. Each shape has its own default. */
  size?: Size;
  /** @default "neutral" */
  intent?: FlowIntent;
  /** More about it, read after its name and shown in the list. */
  description?: string;
  /**
   * In an editable diagram, it can't be moved, joined to another or
   * removed. It can still be selected.
   */
  locked?: boolean;
}

/** One line from a node to another, or to itself. */
export interface FlowEdge {
  /** What changes know it by. Unique among the edges. */
  id: string;
  /** The id of the node it starts at. */
  from: string;
  /** The id of the node it goes to. */
  to: string;
  /** Words on the line, such as "yes" after a decision. */
  label?: string;
  /** How the line goes. The diagram's `edgePath` when it isn't given. */
  path?: FlowPath;
  /** Which ends have an arrowhead. @default "end" */
  arrow?: "end" | "start" | "both" | "none";
  /** @default "neutral" */
  intent?: FlowIntent;
  /** A dashed line, such as for something that may happen. */
  dashed?: boolean;
  /**
   * A dashed line that moves toward its end, such as for something
   * happening now. It stands still when less motion is asked for.
   */
  animated?: boolean;
}

/** What's selected, by id. */
export interface FlowSelection {
  nodes: string[];
  edges: string[];
}

/** What a change to the nodes was. */
export type FlowNodesChange =
  | { type: "move"; ids: string[] }
  | { type: "remove"; ids: string[] };

/** What a change to the edges was. */
export type FlowEdgesChange =
  | { type: "add"; ids: string[] }
  | { type: "remove"; ids: string[] };
