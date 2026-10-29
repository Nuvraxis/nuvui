import type { CalendarEvent, EventColor } from "./events";

/**
 * Something events are booked against: a room, a person, a machine. An
 * event belongs to the resources listed in its `resourceIds`.
 */
export interface CalendarResource {
  /** Unique among the resources, at every level. */
  id: string;
  title: string;
  /**
   * The color of its events that have none of their own. The color of the
   * resource it's inside by default.
   */
  color?: EventColor;
  /** The resources inside this one, such as the rooms of a building. */
  children?: readonly CalendarResource[];
  /**
   * Its events open to be read, unless an event says otherwise. The
   * setting of the resource it's inside by default.
   */
  readOnly?: boolean;
  /**
   * Whether its events can be moved, unless an event says otherwise. The
   * setting of the resource it's inside by default.
   */
  draggable?: boolean;
  /**
   * Which ends of its events can be dragged, unless an event says
   * otherwise. The setting of the resource it's inside by default.
   */
  resizable?: boolean | "start" | "end";
}

/** A resource's settings, its own or the nearest ones above it. */
type Inherited = Pick<
  CalendarResource,
  "color" | "readOnly" | "draggable" | "resizable"
>;

/** A resource with where it is in the tree. */
export interface ResourceEntry {
  resource: CalendarResource;
  /** How many resources it's inside. */
  depth: number;
  /** The ids of the resources it's inside, the nearest last. */
  parents: string[];
  /** The ids of every resource inside it, at every level. */
  descendants: string[];
  /** Its settings, with those it doesn't have from the resources it's in. */
  settings: Inherited;
}

/** Every resource by its id, in the order they're listed, parents first. */
export type ResourceIndex = Map<string, ResourceEntry>;

export function indexResources(
  resources: readonly CalendarResource[],
): ResourceIndex {
  const index: ResourceIndex = new Map();
  const walk = (
    list: readonly CalendarResource[],
    parents: string[],
    above: Inherited,
  ): string[] => {
    const ids: string[] = [];
    for (const resource of list) {
      const settings: Inherited = {
        color: resource.color ?? above.color,
        readOnly: resource.readOnly ?? above.readOnly,
        draggable: resource.draggable ?? above.draggable,
        resizable: resource.resizable ?? above.resizable,
      };
      const entry: ResourceEntry = {
        resource,
        depth: parents.length,
        parents,
        descendants: [],
        settings,
      };
      index.set(resource.id, entry);
      entry.descendants = walk(
        resource.children ?? [],
        [...parents, resource.id],
        settings,
      );
      ids.push(resource.id, ...entry.descendants);
    }
    return ids;
  };
  walk(resources, [], {});
  return index;
}

/** The resources an event belongs to that are in the index, in its order. */
export function resourcesOf(
  event: CalendarEvent,
  index: ResourceIndex,
): ResourceEntry[] {
  const found: ResourceEntry[] = [];
  for (const id of event.resourceIds ?? []) {
    const entry = index.get(id);
    if (entry) found.push(entry);
  }
  return found;
}

/**
 * Whether an event is shown: it belongs to no resource that's listed, or
 * to one at least that isn't hidden.
 */
export function isShown(
  event: CalendarEvent,
  index: ResourceIndex,
  hidden: ReadonlySet<string>,
): boolean {
  const known = (event.resourceIds ?? []).filter((id) => index.has(id));
  return known.length === 0 || known.some((id) => !hidden.has(id));
}

/** What an event may do, with what it doesn't say taken from its resources. */
export interface EventRules {
  color: EventColor | undefined;
  readOnly: boolean;
  draggable: boolean;
  resizable: boolean | "start" | "end";
}

/**
 * The event's own color and rules first, then its resources'. With several
 * resources, the color is the first one's that has one, and a rule that
 * holds an event back wins over one that lets it go.
 */
export function rulesOf(
  event: CalendarEvent,
  index: ResourceIndex,
): EventRules {
  const resources = resourcesOf(event, index).map((entry) => entry.settings);
  let resizable = event.resizable;
  if (resizable === undefined) {
    for (const { resizable: own } of resources) {
      if (own === undefined || own === true) continue;
      // Two resources that each let a different end go let neither.
      resizable = resizable === undefined || resizable === own ? own : false;
    }
  }
  return {
    color: event.color ?? resources.find((item) => item.color)?.color,
    readOnly:
      event.readOnly ?? resources.some((item) => item.readOnly === true),
    draggable:
      event.draggable ?? !resources.some((item) => item.draggable === false),
    resizable: resizable ?? true,
  };
}

/**
 * Hides or shows a resource and everything inside it: shows them all when
 * any of them is hidden, and hides them all when none is.
 */
export function toggleResource(
  id: string,
  index: ResourceIndex,
  hidden: readonly string[],
): string[] {
  const entry = index.get(id);
  if (!entry) return [...hidden];
  const group = [id, ...entry.descendants];
  const anyHidden = group.some((item) => hidden.includes(item));
  return anyHidden
    ? hidden.filter((item) => !group.includes(item))
    : [...hidden, ...group.filter((item) => !hidden.includes(item))];
}

/** Whether a resource and those inside it are all shown, all hidden, or some of each. */
export function shownState(
  id: string,
  index: ResourceIndex,
  hidden: ReadonlySet<string>,
): boolean | "indeterminate" {
  const entry = index.get(id);
  const group = [id, ...(entry?.descendants ?? [])];
  const count = group.filter((item) => hidden.has(item)).length;
  if (count === 0) return true;
  return count === group.length ? false : "indeterminate";
}
