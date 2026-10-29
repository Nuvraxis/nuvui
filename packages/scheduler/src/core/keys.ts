import type { CalendarEvent, EventChange } from "./events";
import type { CalendarResource } from "./resources";

/**
 * The names your events' fields have where they aren't the calendar's,
 * such as `{ title: "name", resourceIds: "roomId" }`.
 */
export type EventKeys = Partial<Record<keyof CalendarEvent, string>>;

/** The names your resources' fields have where they aren't the calendar's. */
export type ResourceKeys = Partial<Record<keyof CalendarResource, string>>;

const eventNames: readonly (keyof CalendarEvent)[] = [
  "id",
  "title",
  "start",
  "end",
  "allDay",
  "timeZone",
  "color",
  "resourceIds",
  "description",
  "className",
  "readOnly",
  "draggable",
  "resizable",
];

const resourceNames: readonly (keyof CalendarResource)[] = [
  "id",
  "title",
  "color",
  "children",
  "readOnly",
  "draggable",
  "resizable",
];

// The app's own object an event was read from, carried along as the event
// is copied and changed, so what it has that the calendar doesn't is kept.
const origin = Symbol("origin");

type Fields = Record<string, unknown>;
type Read = CalendarEvent & { [origin]?: Fields };

// The event read from each of the app's objects, so the same object reads
// as the same event, and one that hasn't changed goes back as it came.
const reads = new WeakMap<object, { keys: EventKeys; event: Read }>();

/** One of the app's events, as the calendar reads it. */
export function readEvent(item: object, keys: EventKeys): CalendarEvent {
  const cached = reads.get(item);
  if (cached?.keys === keys) return cached.event;
  const source = item as Fields;
  const event: Fields & { [origin]?: Fields } = { [origin]: source };
  for (const name of eventNames) {
    const value = source[keys[name] ?? name];
    if (value === undefined) continue;
    // One id on its own is a list of one.
    event[name] =
      name === "resourceIds" && typeof value === "string" ? [value] : value;
  }
  const read = event as unknown as Read;
  reads.set(item, { keys, event: read });
  return read;
}

/**
 * An event as the app's object: the one it was read from if it hasn't
 * changed, or that one with what changed written under the app's names.
 * `oneResource` writes a single resource as an id and not a list, for an
 * event that had none to go by.
 */
export function writeEvent(
  event: CalendarEvent,
  keys: EventKeys,
  oneResource = false,
): Fields {
  const from = (event as Read)[origin];
  if (from && reads.get(from)?.event === event) return from;
  const out: Fields = { ...from };
  const fields = event as unknown as Fields;
  for (const name of eventNames) {
    const to = keys[name] ?? name;
    const value = fields[name];
    if (value === undefined) {
      delete out[to];
      continue;
    }
    if (name === "resourceIds" && Array.isArray(value)) {
      const had = from?.[to];
      const single =
        typeof had === "string" || (had === undefined && oneResource);
      if (single && value.length <= 1) {
        if (value.length === 1) out[to] = value[0];
        else delete out[to];
        continue;
      }
    }
    out[to] = value;
  }
  // Fields of the app's own, from the popover's fields of the app's own.
  for (const [name, value] of Object.entries(fields)) {
    if (!eventNames.includes(name as keyof CalendarEvent)) out[name] = value;
  }
  return out;
}

/** A change, with its events as the app's objects. */
export function writeChange(
  change: EventChange,
  keys: EventKeys,
  oneResource = false,
): EventChange<Fields> {
  const write = (event: CalendarEvent) => writeEvent(event, keys, oneResource);
  return change.type === "update"
    ? {
        type: "update",
        event: write(change.event),
        previous: write(change.previous),
      }
    : { type: change.type, event: write(change.event) };
}

/** The app's resources, and those inside them, as the calendar reads them. */
export function readResources(
  items: readonly object[],
  keys: ResourceKeys,
): CalendarResource[] {
  return items.map((item) => {
    const source = item as Fields;
    const resource: Fields = {};
    for (const name of resourceNames) {
      const value = source[keys[name] ?? name];
      if (value === undefined) continue;
      resource[name] =
        name === "children" && Array.isArray(value)
          ? readResources(value, keys)
          : value;
    }
    return resource as unknown as CalendarResource;
  });
}
