/** One person in the chart, or a position no one holds yet. */
export interface OrgChartPerson {
  /** Unique in the chart. */
  id: string;
  /**
   * The id of the person they report to. Leave it out, or `null`, for
   * someone at the top. An id that isn't in the chart counts as none.
   */
  managerId?: string | null;
  /** Their name. An open position has none. */
  name?: string;
  /** Their job title. */
  title?: string;
  department?: string;
  /**
   * The address of their photo. Their initials show while it loads, and in
   * its place if it doesn't.
   */
  avatar?: string;
  /** A word or two on the card, such as "On leave". */
  badge?: string;
  /**
   * A position no one holds yet. The card says so where a name would be,
   * and is drawn with a dashed edge.
   */
  vacant?: boolean;
}

/** Which way the chart grows from the top. */
export type OrgChartOrientation = "vertical" | "horizontal";

/**
 * Where the view is: the chart's top left corner on the screen, in pixels
 * from the frame's, and how far it's zoomed.
 */
export interface OrgChartViewport {
  x: number;
  y: number;
  zoom: number;
}

/** The size of every card, in the chart's own units, which are pixels at a zoom of 1. */
export interface OrgChartCardSize {
  width: number;
  height: number;
}

/** What a card's own content is told besides the person. */
export interface OrgChartCardInfo {
  /** How many people report to them directly. */
  reports: number;
  /** How far down the chart they are. The top is 1. */
  level: number;
  /** Whether their reports are shown. */
  expanded: boolean;
}
