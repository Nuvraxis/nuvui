import type { CalendarLocale } from "@nuvui/date-picker/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@nuvui/react/alert-dialog";
import {
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { type DayKey, dayOf } from "../../core/dates";
import {
  type DragMode,
  dragTo,
  type EditOptions,
  nudge,
  type Spot,
  sameTimes,
  type Times,
  timesAt,
  timesOf,
  withTimes,
} from "../../core/edit";
import {
  applyChange,
  type CalendarEvent,
  type EventChange,
  type EventColor,
  type PlacedEvent,
  place,
  placeEvents,
} from "../../core/events";
import type { Formatters } from "../../core/format";
import {
  type EventKeys,
  type ResourceKeys,
  readEvent,
  readResources,
  writeChange,
  writeEvent,
} from "../../core/keys";
import type { SchedulerLabels } from "../../core/labels";
import {
  expandEvents,
  occurrenceOf,
  type RecurrenceRule,
  writeRule,
} from "../../core/recurrence";
import {
  type CalendarResource,
  indexResources,
  isShown,
  moveResource,
  rulesOf,
} from "../../core/resources";
import {
  changeOccurrence,
  deleteOccurrence,
  type Scope,
  type SeriesOptions,
} from "../../core/series";
import type { EditingValue } from "./context";
import {
  type Editing,
  EventEditor,
  type EventField,
  type EventFieldsProps,
} from "./editor";
import { timeOf } from "./event-button";
import { draggedItem, type ExternalEvent, eventType } from "./external";
import { useDrag } from "./use-drag";

/** Passed to `onEditStart`. */
export interface EditStartDetails {
  /** It's being made, and isn't one of the events yet. */
  isNew: boolean;
  /** It opens to be read, not changed. */
  readOnly: boolean;
  /** The element it was opened from. */
  element: HTMLElement;
  /** Keeps the popover closed, to open your own form instead. */
  preventDefault: () => void;
}

/** Passed to `onEventDropOutside`. */
export interface EventDropOutsideDetails {
  /** The element under the pointer where it was let go. */
  target: Element | null;
  clientX: number;
  clientY: number;
}

/** The props `EventCalendar` and `EventTimeline` share. */
export interface SchedulerOwnProps<TEvent extends object = CalendarEvent> {
  /**
   * The events, when you hold them. Pass `onEventsChange` too for them to
   * be changed: without it, they open to be read.
   */
  events?: readonly TEvent[];
  /** The events at first, when the component holds them. */
  defaultEvents?: readonly TEvent[];
  /**
   * Called with every event after one is made, changed or deleted, and
   * what the change was.
   */
  onEventsChange?: (events: TEvent[], change: EventChange<TEvent>) => void;
  /**
   * The names your events' fields have where they aren't these, such as
   * `{ title: "name", resourceIds: "roomId" }`. Events are read from them,
   * and changes are written back to them, with every other field of yours
   * kept.
   */
  eventKeys?: EventKeys;
  /** The names your resources' fields have where they aren't these. */
  resourceKeys?: ResourceKeys;
  /**
   * Every event needs a resource, and the popover offers no choice of
   * none. On the calendar, a new event is given the first resource shown.
   * @default false
   */
  resourceRequired?: boolean;
  /**
   * An event can be given several resources in its popover, not just one.
   * @default false
   */
  multipleResources?: boolean;
  /**
   * Events open to be read, and can't be made, changed, moved or deleted.
   * An event's own `readOnly` wins over this.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Whether new events can be made on empty time, with a click or by
   * dragging across it. Something dropped from elsewhere on the page is
   * still added.
   * @default true
   */
  creatable?: boolean;
  /**
   * What makes an event on empty time: a click, or a double click.
   * @default "click"
   */
  createOn?: "click" | "doubleClick";
  /**
   * Minutes a new event lasts when it's made with a click on a time, and
   * an all-day one dragged onto a time.
   * @default 60
   */
  defaultDuration?: number;
  /**
   * Minutes that times snap to while an event is dragged, and that the
   * arrow keys move it by.
   * @default 15
   */
  step?: number;
  /**
   * Asks before an event is deleted. An event that repeats is always asked
   * about, since which of its occurrences go is the question.
   * @default true
   */
  confirmDelete?: boolean;
  /**
   * The parts of an event's popover, in order. Leave one out to take it
   * away.
   * @default ["title", "time", "repeat", "resource", "color", "description"]
   */
  eventFields?: readonly EventField[];
  /** Fields of your own, shown in an event's popover after the rest. */
  renderEventFields?: (props: EventFieldsProps<TEvent>) => ReactNode;
  /**
   * Called before an event's popover opens, however it's opened. Call
   * `preventDefault` on the details to open your own form instead.
   */
  onEditStart?: (event: TEvent, details: EditStartDetails) => void;
  /**
   * Called when an event is dragged out of the component and let go, with
   * what's under the pointer. Return `true` to take it off.
   */
  onEventDropOutside?: (
    event: TEvent,
    details: EventDropOutsideDetails,
  ) => boolean | undefined;
  /** Makes the id of a new event. A random UUID by default. */
  createId?: () => string;
  /** A moment in the period shown, when you control it. */
  date?: Date;
  /**
   * A moment in the period shown at first, when you don't control it.
   * Today by default.
   */
  defaultDate?: Date;
  /** Called with the start of the day moved to. */
  onDateChange?: (date: Date) => void;
  /**
   * The time zone events are shown in, such as `"Europe/Paris"`. It changes
   * how they're drawn, not when they happen. The browser's own by default.
   */
  timeZone?: string;
  /**
   * The language dates and times are written in, and the first day of the
   * week. Any locale from `@nuvui/date-picker/locale`.
   */
  locale?: CalendarLocale;
  /**
   * The moment taken as now. Set it for a server, a screenshot or a test.
   * The browser's clock by default.
   */
  today?: Date;
  /**
   * The color of events that have none of their own, and none from a
   * resource.
   * @default "1"
   */
  color?: EventColor;
  /**
   * The words it shows and says. Translate them with the rest of your
   * interface.
   */
  labels?: Partial<SchedulerLabels>;
  /**
   * Called when an event is pressed, with the element pressed, before its
   * popover opens.
   */
  onEventClick?: (event: TEvent, element: HTMLElement) => void;
}

const never = () => () => {};

let made = 0;
export function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  made += 1;
  return `event-${Date.now()}-${made}`;
}

export const noEvents: readonly object[] = [];
export const noIds: readonly string[] = [];

// The same keys for as long as they say the same, since they're often
// written inline, and events are read again when they change.
export function useSameKeys<T extends object>(
  keys: T | undefined,
): T | undefined {
  const text = keys ? JSON.stringify(keys) : "";
  // biome-ignore lint/correctness/useExhaustiveDependencies: what they say, not the object
  return useMemo(() => keys, [text]);
}

// False on the server, and in the browser while it takes over the HTML the
// server sent. The server can't know the time zone of the person looking.
export function useHydrated() {
  return useSyncExternalStore(
    never,
    () => true,
    () => false,
  );
}

export function validHours(
  hours: readonly [number, number],
): readonly [number, number] {
  const [from, to] = hours;
  const whole = Number.isInteger(from) && Number.isInteger(to);
  if (whole && from >= 0 && to <= 24 && from < to) return hours;
  if (typeof console !== "undefined") {
    console.warn(
      `@nuvui/scheduler: hours should be two whole hours from 0 to 24, the first before the last. [${from}, ${to}] isn't, so the whole day is shown.`,
    );
  }
  return [0, 24];
}

/**
 * Now, and today in the time zone shown. The clock moves once the browser
 * has the page. The server knows neither, since a page built ahead would
 * keep the day it was built.
 */
export function useNow(todayProp: Date | undefined, timeZone: string) {
  const [clock, setClock] = useState<Date | null>(null);
  useEffect(() => {
    if (todayProp) return;
    setClock(new Date());
    const timer = setInterval(() => setClock(new Date()), 30_000);
    return () => clearInterval(timer);
  }, [todayProp]);
  const now = todayProp ?? clock;
  return { now, today: now ? dayOf(now, timeZone) : null };
}

/** An event on the move, with its resources when it's moved to another row. */
interface Drag {
  base: CalendarEvent;
  times: Times;
  via: "pointer" | "keyboard" | "outside";
  hidden?: boolean;
  /** Its resources after the move, when it's moved to another row. */
  resourceIds?: readonly string[];
  /** The timeline's row it's in, while it's moved from the keyboard. */
  row?: string | null;
}

/** What a component tells the scheduler about itself. */
export interface SchedulerSetup {
  root: RefObject<HTMLElement | null>;
  timeZone: string;
  labels: SchedulerLabels;
  format: Formatters;
  /** The first and last day shown, which repeating events are worked out for. */
  first: DayKey;
  last: DayKey;
  /** Resources whose events are hidden. */
  hidden: readonly string[];
  /** The hour a timed event starts at when an all-day one is made timed. */
  scrollToHour: number;
  /** The spot under a point. */
  locate: (root: HTMLElement, x: number, y: number) => Spot | null;
  /** Scrolls the view while an event is dragged near its edges. */
  scrollNear: (root: HTMLElement, x: number, y: number) => void;
  /** A picked-up event was moved from the keyboard to a day not shown. */
  follow: (day: DayKey) => void;
  /**
   * The row `by` rows from another, for an event moved to another resource
   * from the keyboard, or `undefined` past the first or the last.
   */
  rowAfter?: (row: string | null, by: number) => string | null | undefined;
}

type SharedProps = SchedulerOwnProps<object> & {
  events?: readonly object[];
  resources?: readonly object[];
  eventFields: readonly EventField[];
  defaultDuration: number;
};

/** An event with these resources, `[]` for none. */
function withResourceIds(
  event: CalendarEvent,
  resourceIds: readonly string[],
): CalendarEvent {
  return { ...event, resourceIds: [...resourceIds] };
}

const sameIds = (
  a: readonly string[] | undefined,
  b: readonly string[] | undefined,
) =>
  (a ?? []).length === (b ?? []).length &&
  (a ?? []).every((id, index) => (b ?? [])[index] === id);

/**
 * The events, and everything that changes them: the popover, dragging with
 * a pointer and from the keyboard, things dropped from elsewhere on the
 * page, the questions before a delete and about a series, and what's said
 * as it happens. The calendar and the timeline differ in how they draw
 * events, and share this.
 */
export function useScheduler(props: SharedProps, setup: SchedulerSetup) {
  const {
    events: eventsProp,
    defaultEvents = noEvents,
    onEventsChange,
    eventKeys: eventKeysProp,
    resources: resourcesProp = noEvents,
    resourceKeys: resourceKeysProp,
    resourceRequired = false,
    readOnly = false,
    creatable: creatableProp = true,
    defaultDuration,
    step = 15,
    confirmDelete = true,
    eventFields,
    renderEventFields,
    onEditStart,
    onEventDropOutside,
    createId = randomId,
    onEventClick,
  } = props;
  const { root, timeZone, labels, format, first, last, hidden } = setup;

  // The app's events and resources, read under its own names.
  const eventKeys = useSameKeys(eventKeysProp);
  const resourceKeys = useSameKeys(resourceKeysProp);
  const read = useCallback(
    (item: object) =>
      eventKeys ? readEvent(item, eventKeys) : (item as CalendarEvent),
    [eventKeys],
  );
  const resourceList = useMemo(
    () =>
      resourceKeys
        ? readResources(resourcesProp, resourceKeys)
        : (resourcesProp as readonly CalendarResource[]),
    [resourcesProp, resourceKeys],
  );
  const resources = useMemo(() => indexResources(resourceList), [resourceList]);
  const rules = useCallback(
    (event: CalendarEvent) => rulesOf(event, resources),
    [resources],
  );

  // The events, kept here unless the app keeps them. Changes need
  // somewhere to go: here, or to the app through onEventsChange.
  const [ownEvents, setOwnEvents] = useState(() => defaultEvents.map(read));
  const eventsHeld = eventsProp !== undefined;
  const heldEvents = useMemo(() => eventsProp?.map(read), [eventsProp, read]);
  const events = heldEvents ?? ownEvents;
  const latestEvents = useRef(events);
  latestEvents.current = events;
  // An app that gives each event one resource id, not a list, has new
  // events written the same way.
  const resourceKey = eventKeys?.resourceIds ?? "resourceIds";
  const oneResource = (eventsProp ?? defaultEvents).some(
    (item) =>
      typeof (item as Record<string, unknown>)[resourceKey] === "string",
  );
  // An app that writes its rules as objects has new ones written so too.
  const recurrenceKey = eventKeys?.recurrence ?? "recurrence";
  const objectRules = (eventsProp ?? defaultEvents).some((item) => {
    const rule = (item as Record<string, unknown>)[recurrenceKey];
    return typeof rule === "object" && rule !== null;
  });
  const seriesOptions: SeriesOptions = { timeZone, createId, objectRules };
  // An occurrence of a repeating event is handed over as its series, at
  // the occurrence's own times.
  const write = (event: CalendarEvent): object => {
    const occurrence = occurrenceOf(event);
    const outward = occurrence
      ? { ...occurrence.series, start: event.start, end: event.end }
      : event;
    return eventKeys ? writeEvent(outward, eventKeys, oneResource) : outward;
  };
  const editable = !readOnly && (!eventsHeld || onEventsChange !== undefined);
  const creatable = editable && creatableProp;
  const commit = (change: EventChange) => {
    const next = applyChange(latestEvents.current, change);
    latestEvents.current = next;
    if (!eventsHeld) setOwnEvents(next);
    onEventsChange?.(
      next.map(write),
      eventKeys ? writeChange(change, eventKeys, oneResource) : change,
    );
  };

  const shownEvents = useMemo(() => {
    if (hidden.length === 0 || resources.size === 0) return events;
    const set = new Set(hidden);
    return events.filter((event) => isShown(event, resources, set));
  }, [events, hidden, resources]);
  // What a new event belongs to when it has to belong to something: the
  // first resource shown that has none inside it, or else the first shown.
  const firstResource = () => {
    if (!resourceRequired) return undefined;
    const shown = [...resources.values()].filter(
      (entry) => !hidden.includes(entry.resource.id),
    );
    const entry =
      shown.find((item) => item.descendants.length === 0) ?? shown[0];
    return entry ? [entry.resource.id] : undefined;
  };
  // A new event's resources: the row it's made in, on the timeline.
  const resourcesAt = (resource: string | null | undefined) =>
    resource ? [resource] : firstResource();
  const options: EditOptions = { step, defaultDuration, timeZone };

  // Moves said in words, for those who can't see them.
  const [announcement, setAnnouncement] = useState("");
  const when = (event: CalendarEvent) =>
    timeOf(place(event, timeZone), format, labels);

  // What takes the focus after the next render: an event that's moved
  // and drawn again, or what's left where one was deleted.
  const focusNext = useRef<(() => HTMLElement | null | undefined) | null>(null);
  useEffect(() => {
    const find = focusNext.current;
    if (!find) return;
    focusNext.current = null;
    find()?.focus();
  });
  // An event, or for one that repeats, the first of its occurrences shown.
  // On the timeline, the one in a row, or any when it's in none drawn.
  const eventElement = (
    eventId: string,
    row?: string | null,
  ): HTMLElement | null => {
    const id = CSS.escape(eventId);
    const inRow =
      row === undefined ? "" : `[data-resource="${CSS.escape(row ?? "")}"]`;
    const found =
      root.current?.querySelector<HTMLElement>(
        `[data-event-id="${id}"]${inRow}:not([data-preview])`,
      ) ??
      root.current?.querySelector<HTMLElement>(
        `[data-event-id^="${id}:"]${inRow}:not([data-preview])`,
      ) ??
      null;
    return found ?? (row === undefined ? null : eventElement(eventId));
  };

  // An event on the move: dragged with a pointer, picked up from the
  // keyboard, or dragged in from elsewhere on the page.
  const [drag, setDrag] = useState<Drag | null>(null);
  const [editing, setEditing] = useState<(Editing & { times?: Times }) | null>(
    null,
  );
  const [deleting, setDeleting] = useState<{
    event: CalendarEvent;
    element: HTMLElement;
  } | null>(null);
  // An occurrence of a repeating event being changed or deleted, waiting
  // to be told which of the series it's for.
  const [asking, setAsking] = useState<{
    occurrence: CalendarEvent;
    /** Where it's going, or nothing when it's being deleted. */
    next?: CalendarEvent;
    /** The series' rule after the change, when that changed. */
    rule?: RecurrenceRule | null;
    /** It was dragged, so the drop is said in words. */
    dropped?: boolean;
    element: HTMLElement | null;
  } | null>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  // A press on the view while a popover is open closes it, and isn't also
  // the start of a new event.
  const closing = useRef(false);
  const outside = useRef(false);

  // The event a drag puts somewhere: at its new times, and in its new row.
  const movedOf = (current: Drag) => {
    const timed = withTimes(current.base, current.times, timeZone);
    return current.resourceIds
      ? withResourceIds(timed, current.resourceIds)
      : timed;
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: movedOf reads only drag and the time zone, both listed
  const placed = useMemo(() => {
    const moved = drag ? movedOf(drag) : null;
    // Drawn faintly where it would go, and not heard.
    const previews: CalendarEvent[] = [];
    if (moved && drag?.via !== "keyboard" && !drag?.hidden) {
      previews.push(moved);
    }
    if (editing?.isNew) {
      previews.push(
        editing.times
          ? withTimes(editing.event, editing.times, timeZone)
          : editing.event,
      );
    }
    // From the keyboard the event itself moves, and keeps the focus.
    const expanded = expandEvents(shownEvents, timeZone, first, last);
    const shown =
      moved && drag?.via === "keyboard"
        ? expanded.map((event) => (event.id === moved.id ? moved : event))
        : expanded;
    return placeEvents([...shown, ...previews], timeZone, first, last).map(
      (item) =>
        previews.includes(item.event) ? { ...item, preview: true } : item,
    );
  }, [shownEvents, drag, editing, timeZone, first, last]);

  // A new event, written as clock times like the ones it's put among.
  const blank = (eventId: string): CalendarEvent => ({
    id: eventId,
    title: "",
    start: "2000-01-01T00:00",
    end: "2000-01-01T00:00",
  });

  const allowed = (
    event: CalendarEvent,
    details: Omit<EditStartDetails, "preventDefault">,
  ) => {
    let prevented = false;
    onEditStart?.(write(event), {
      ...details,
      preventDefault: () => {
        prevented = true;
      },
    });
    return !prevented;
  };

  const startCreate = (
    times: Times,
    element: HTMLElement,
    resource?: string | null,
  ) => {
    if (!creatable) return;
    const resourceIds = resourcesAt(resource);
    const draft = withTimes(
      { ...blank(createId()), ...(resourceIds ? { resourceIds } : null) },
      times,
      timeZone,
    );
    if (!allowed(draft, { isNew: true, readOnly: false, element })) return;
    returnTo.current = element;
    outside.current = false;
    setEditing({
      event: draft,
      isNew: true,
      mode: "edit",
      times,
      anchor: () =>
        root.current?.querySelector<HTMLElement>(
          `[data-preview][data-event-id="${CSS.escape(draft.id)}"]`,
        ) ?? element,
    });
  };

  const closeEditor = () => {
    const was = editing;
    setEditing(null);
    // A click elsewhere closes it and leaves the focus where it went.
    if (outside.current) return;
    const element = returnTo.current;
    focusNext.current = () =>
      (was && !was.isNew ? eventElement(was.event.id) : null) ??
      (element?.isConnected ? element : null);
  };

  // Where the focus goes when an event goes: its cell, or the event after
  // it in a list.
  const whereAfter = (element: HTMLElement) => {
    const cell = element.closest<HTMLElement>('[role="gridcell"]');
    if (cell) return () => cell;
    const item = element.closest("li");
    const next =
      item?.nextElementSibling?.querySelector<HTMLElement>("button") ??
      item?.previousElementSibling?.querySelector<HTMLElement>("button");
    if (next) return () => next;
    return () =>
      root.current?.querySelector<HTMLElement>('[role="grid"] [tabindex="0"]');
  };

  // Deletes an event, and says where the focus goes after it.
  const removeNow = (event: CalendarEvent, element: HTMLElement) => {
    const after = whereAfter(element);
    commit({ type: "delete", event });
    setAnnouncement(labels.deleted(event.title || labels.untitled));
    return after;
  };

  // The alert dialog holds the focus until it has finished closing, so
  // where it goes then is kept apart.
  const afterDialog = useRef<(() => HTMLElement | null | undefined) | null>(
    null,
  );

  const requestDelete = (event: CalendarEvent, element: HTMLElement) => {
    setEditing(null);
    // Which of a series to delete is asked, and that's the confirmation.
    if (occurrenceOf(event)) setAsking({ occurrence: event, element });
    else if (confirmDelete) setDeleting({ event, element });
    else focusNext.current = removeNow(event, element);
  };

  const find = (eventId: string) =>
    placed.find((item) => !item.preview && item.event.id === eventId);

  // The resources an event dragged with a pointer has where it is: those
  // of the row it's drawn in, on the timeline, or `undefined` when they
  // stay as they were.
  const resourcesFor = (
    mode: DragMode,
    item: PlacedEvent | null,
    from: Spot,
    to: Spot,
  ): readonly string[] | undefined => {
    if (to.resource === undefined || from.resource === undefined) {
      return undefined;
    }
    if (mode === "create" || !item) return from.resource ? [from.resource] : [];
    if (mode !== "move" || from.resource === to.resource) return undefined;
    const moved = moveResource(
      item.event.resourceIds,
      from.resource,
      to.resource,
    );
    // An event that needs a resource can't go to the row for none.
    if (resourceRequired && !moved.some((id) => resources.has(id))) {
      return undefined;
    }
    return moved;
  };

  const onPointerDown = useDrag(root, {
    editable,
    creatable,
    find,
    rules,
    locate: setup.locate,
    scrollNear: setup.scrollNear,
    onMove: ({ mode, placed: item, from, to }) => {
      if (!to) {
        // Out of the view, to be dropped on the page.
        if (onEventDropOutside && mode === "move") {
          setDrag((was) => was && { ...was, hidden: true });
        }
        return;
      }
      const resourceIds = resourcesFor(mode, item, from, to);
      setDrag({
        base: item?.event ?? blank(""),
        times: dragTo(mode, item, from, to, options),
        via: "pointer",
        ...(resourceIds ? { resourceIds } : null),
      });
    },
    onDrop: ({ mode, placed: item, from, to, clientX, clientY }) => {
      setDrag(null);
      if (!to) {
        if (item && onEventDropOutside && mode === "move") {
          const target = document.elementFromPoint(clientX, clientY);
          const taken = onEventDropOutside(write(item.event), {
            target,
            clientX,
            clientY,
          });
          if (taken === true) {
            const from = occurrenceOf(item.event);
            commit(
              from
                ? deleteOccurrence(from, "one", seriesOptions)
                : { type: "delete", event: item.event },
            );
          }
        }
        return;
      }
      const times = dragTo(mode, item, from, to, options);
      if (mode === "create" || !item) {
        const cell =
          document
            .elementFromPoint(clientX, clientY)
            ?.closest<HTMLElement>("[data-spot-day]") ?? root.current;
        if (cell) startCreate(times, cell, from.resource);
        return;
      }
      const resourceIds = resourcesFor(mode, item, from, to);
      if (sameTimes(times, timesOf(item)) && !resourceIds) return;
      const next = movedOf({
        base: item.event,
        times,
        via: "pointer",
        ...(resourceIds ? { resourceIds } : null),
      });
      const row = to.resource;
      if (occurrenceOf(item.event)) {
        setAsking({
          occurrence: item.event,
          next,
          dropped: true,
          element: eventElement(item.event.id, row),
        });
        return;
      }
      commit({ type: "update", event: next, previous: item.event });
      setAnnouncement(labels.dropped(next.title, when(next)));
    },
    onCancel: () => setDrag(null),
  });

  const spotOf = (cell: HTMLElement): Spot => {
    const resource = cell.dataset.spotResource;
    return {
      day: cell.dataset.spotDay ?? first,
      minute:
        cell.dataset.spotHour === undefined
          ? null
          : Number(cell.dataset.spotHour) * 60,
      ...(resource === undefined ? null : { resource: resource || null }),
    };
  };

  const createFromClick = (click: MouseEvent<HTMLElement>) => {
    if (closing.current) {
      closing.current = false;
      return;
    }
    if (!creatable) return;
    const target = click.target as HTMLElement;
    if (target.closest("button, a, input, [data-event-id]")) return;
    const cell = target.closest<HTMLElement>("[data-spot-day]");
    if (!cell || !root.current) return;
    const spot =
      setup.locate(root.current, click.clientX, click.clientY) ?? spotOf(cell);
    startCreate(timesAt(spot, defaultDuration, options), cell, spot.resource);
  };

  const createFromKey = (key: KeyboardEvent<HTMLElement>) => {
    const cell = key.target as HTMLElement;
    if (key.key !== "Enter" || !creatable) return;
    if (cell.dataset.spotDay === undefined) return;
    key.preventDefault();
    const spot = spotOf(cell);
    startCreate(timesAt(spot, defaultDuration, options), cell, spot.resource);
  };

  // Something of the app's dragged in from elsewhere on the page.
  const timesFor = (item: ExternalEvent, spot: Spot) =>
    timesAt(spot, item.duration ?? defaultDuration, options, item.allDay);
  const dragOver = (over: DragEvent<HTMLElement>) => {
    if (!editable || !over.dataTransfer.types.includes(eventType)) return;
    over.preventDefault();
    over.dataTransfer.dropEffect = "copy";
    const item = draggedItem();
    const spot = root.current
      ? setup.locate(root.current, over.clientX, over.clientY)
      : null;
    if (!item || !spot) return;
    const times = timesFor(item, spot);
    const resourceIds = item.resourceIds ?? resourcesAt(spot.resource);
    if (
      drag?.via === "outside" &&
      sameTimes(drag.times, times) &&
      sameIds(drag.base.resourceIds, resourceIds)
    ) {
      return;
    }
    setDrag({
      base: {
        ...blank(""),
        title: item.title,
        color: item.color,
        ...(resourceIds ? { resourceIds } : null),
      },
      times,
      via: "outside",
    });
  };
  const dragLeave = (leave: DragEvent<HTMLElement>) => {
    if (leave.currentTarget.contains(leave.relatedTarget as Node | null)) {
      return;
    }
    if (drag?.via === "outside") setDrag(null);
  };
  const dropIn = (dropped: DragEvent<HTMLElement>) => {
    if (!editable) return;
    const data = dropped.dataTransfer.getData(eventType);
    const spot = root.current
      ? setup.locate(root.current, dropped.clientX, dropped.clientY)
      : null;
    setDrag(null);
    if (!data || !spot) return;
    dropped.preventDefault();
    let item: ExternalEvent;
    try {
      item = JSON.parse(data) as ExternalEvent;
    } catch {
      return;
    }
    const { duration: _, allDay: __, ...fields } = item;
    const resourceIds = fields.resourceIds ?? resourcesAt(spot.resource);
    const event = withTimes(
      {
        ...blank(createId()),
        ...fields,
        ...(resourceIds ? { resourceIds } : null),
      },
      timesFor(item, spot),
      timeZone,
    );
    commit({ type: "create", event });
    setAnnouncement(labels.added(event.title, when(event)));
  };

  // An event given a rule to repeat by, written like the app's others,
  // or one that no longer repeats.
  const withRule = (
    event: CalendarEvent,
    rule: RecurrenceRule | null,
  ): CalendarEvent => {
    const { recurrence, exceptions, ...rest } = event;
    if (!rule) return rest;
    return {
      ...rest,
      ...(exceptions ? { exceptions } : null),
      recurrence: writeRule(
        rule,
        recurrence,
        objectRules,
        event.allDay === true,
        event.timeZone ?? timeZone,
      ),
    };
  };

  // The answer to which of a series a change or a delete is for.
  const answer = (scope: Scope) => {
    const from = asking && occurrenceOf(asking.occurrence);
    if (!asking || !from) return;
    const { occurrence, next, rule, dropped, element } = asking;
    if (next) {
      const { changes, focus } = changeOccurrence(
        from,
        next,
        scope,
        rule,
        seriesOptions,
      );
      for (const change of changes) commit(change);
      if (dropped) setAnnouncement(labels.dropped(next.title, when(next)));
      const row = element?.dataset.resource;
      afterDialog.current = () =>
        eventElement(focus, row === undefined ? undefined : row || null) ??
        (element?.isConnected ? element : null);
      return;
    }
    const after = element ? whereAfter(element) : null;
    commit(deleteOccurrence(from, scope, seriesOptions));
    setAnnouncement(labels.deleted(occurrence.title || labels.untitled));
    afterDialog.current = after;
  };
  // One occurrence can't take a new rule of its own.
  const scopes: readonly Scope[] =
    asking?.rule === undefined
      ? ["one", "following", "all"]
      : ["following", "all"];
  const scopeLabels: Record<Scope, string> = {
    one: labels.thisEvent,
    following: labels.followingEvents,
    all: labels.allEvents,
  };
  // The alert dialogs give the focus back where the view says.
  const focusAfterDialog = (closed: Event) => {
    closed.preventDefault();
    const after = afterDialog.current;
    afterDialog.current = null;
    after?.()?.focus();
  };

  // The name of a row, said when an event is moved to it.
  const rowName = (row: string | null) =>
    row === null
      ? labels.unassigned
      : (resources.get(row)?.resource.title ?? labels.unassigned);

  const edit: EditingValue = {
    editable,
    creatable,
    options,
    picked: drag?.via === "keyboard" ? drag.base.id : null,
    pickedRow: drag?.via === "keyboard" ? drag.row : undefined,
    dragging: drag?.via === "pointer" ? drag.base.id || null : null,
    open: (event, element, by) => {
      const readable = !editable || rules(event).readOnly;
      if (!allowed(event, { isNew: false, readOnly: readable, element })) {
        return;
      }
      returnTo.current = element;
      outside.current = false;
      setEditing({
        event,
        isNew: false,
        mode: readable ? "read" : by === "touch" ? "actions" : "edit",
        anchor: () => (element.isConnected ? element : eventElement(event.id)),
      });
    },
    remove: requestDelete,
    pick: (item, _look, row) => {
      setEditing(null);
      setDrag({
        base: item.event,
        times: timesOf(item),
        via: "keyboard",
        ...(row === undefined ? null : { row }),
      });
      setAnnouncement(
        labels.pickedUp(item.event.title, timeOf(item, format, labels)),
      );
    },
    nudge: (by, resize) => {
      if (drag?.via !== "keyboard") return;
      const row = drag.row;
      if (by.rows) {
        if (resize || row === undefined || !setup.rowAfter) return;
        const to = setup.rowAfter(row, by.rows);
        if (to === undefined) return;
        const resourceIds = moveResource(
          drag.resourceIds ?? drag.base.resourceIds,
          row,
          to,
        );
        if (resourceRequired && !resourceIds.some((id) => resources.has(id))) {
          return;
        }
        setDrag({ ...drag, resourceIds, row: to });
        setAnnouncement(labels.movedTo(rowName(to)));
        focusNext.current = () => eventElement(drag.base.id, to);
        return;
      }
      const current = place(movedOf(drag), timeZone);
      const times = nudge(current, by, resize, options);
      const moved = place(movedOf({ ...drag, times }), timeZone);
      setDrag({ ...drag, times });
      // Off the days shown, the view goes with it.
      const lead = resize ? moved.lastDay : moved.firstDay;
      if (lead < first || lead > last) setup.follow(lead);
      setAnnouncement(labels.movedTo(timeOf(moved, format, labels)));
      focusNext.current = () => eventElement(drag.base.id, row);
    },
    drop: () => {
      if (drag?.via !== "keyboard") return;
      const next = movedOf(drag);
      setDrag(null);
      const moved =
        !sameTimes(drag.times, timesOf(place(drag.base, timeZone))) ||
        (drag.resourceIds !== undefined &&
          !sameIds(drag.resourceIds, drag.base.resourceIds));
      if (moved && occurrenceOf(drag.base)) {
        setAsking({
          occurrence: drag.base,
          next,
          dropped: true,
          element: eventElement(drag.base.id, drag.row),
        });
        return;
      }
      if (moved) {
        commit({ type: "update", event: next, previous: drag.base });
      }
      setAnnouncement(labels.dropped(next.title, when(next)));
      focusNext.current = () => eventElement(next.id, drag.row);
    },
    putBack: () => {
      if (drag?.via !== "keyboard") return;
      setDrag(null);
      setAnnouncement(labels.putBack(drag.base.title));
      // Back in the row it was picked up from.
      const back = drag.row;
      focusNext.current = () => eventElement(drag.base.id, back);
    },
    create: startCreate,
  };

  // For the view's element: the clicks, keys and drags of its cells and
  // events, taken there once rather than on each.
  const createOn = props.createOn ?? "click";
  const viewHandlers = {
    onPointerDown: (down: ReactPointerEvent<HTMLElement>) => {
      closing.current = editing !== null;
      onPointerDown(down);
    },
    onClick: createOn === "click" ? createFromClick : undefined,
    onDoubleClick: createOn === "doubleClick" ? createFromClick : undefined,
    onKeyDown: createFromKey,
    onDragOver: dragOver,
    onDragLeave: dragLeave,
    onDrop: dropIn,
  };

  const dialogs = (
    <>
      <EventEditor
        editing={editing}
        fields={eventFields}
        renderFields={renderEventFields}
        defaultDuration={defaultDuration}
        scrollToHour={setup.scrollToHour}
        onSave={(saved, changes, rule) => {
          const was = editing;
          if (!was) return;
          // The app's own fields, under its own names.
          const merged = eventKeys
            ? readEvent(
                {
                  ...writeEvent(saved, eventKeys, oneResource),
                  ...changes,
                },
                eventKeys,
              )
            : ({ ...saved, ...changes } as CalendarEvent);
          if (occurrenceOf(was.event)) {
            setEditing(null);
            setAsking({
              occurrence: was.event,
              next: merged,
              rule,
              element: returnTo.current,
            });
            return;
          }
          const event = rule === undefined ? merged : withRule(merged, rule);
          commit(
            was.isNew
              ? { type: "create", event }
              : { type: "update", event, previous: was.event },
          );
          setEditing(null);
          const element = returnTo.current;
          const row = element?.dataset.resource;
          focusNext.current = () =>
            eventElement(
              event.id,
              row === undefined ? undefined : row || null,
            ) ?? (element?.isConnected ? element : null);
        }}
        onDelete={(event) => {
          const element =
            returnTo.current ?? eventElement(event.id) ?? root.current;
          if (element) requestDelete(event, element);
        }}
        onEdit={() => {
          if (!editing) return;
          const element = returnTo.current;
          if (
            element &&
            !allowed(editing.event, {
              isNew: false,
              readOnly: false,
              element,
            })
          ) {
            setEditing(null);
            return;
          }
          setEditing({ ...editing, mode: "edit" });
        }}
        onClose={closeEditor}
        onOutside={() => {
          outside.current = true;
        }}
        onTimesChange={(times) => setEditing((was) => was && { ...was, times })}
      />
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (open || !deleting) return;
          const { element } = deleting;
          setDeleting(null);
          // Cancelled: back to the event.
          afterDialog.current ??= () => (element.isConnected ? element : null);
        }}
      >
        <AlertDialogContent onCloseAutoFocus={focusAfterDialog}>
          <AlertDialogTitle>
            {labels.deleteQuestion(deleting?.event.title || labels.untitled)}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {labels.deleteWarning}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
            <AlertDialogAction
              intent="danger"
              onClick={() => {
                if (!deleting) return;
                afterDialog.current = removeNow(
                  deleting.event,
                  deleting.element,
                );
              }}
            >
              {labels.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={asking !== null}
        onOpenChange={(open) => {
          if (open || !asking) return;
          const { occurrence, element } = asking;
          setAsking(null);
          // Cancelled: back to the occurrence, where it was.
          afterDialog.current ??= () =>
            element?.isConnected ? element : eventElement(occurrence.id);
        }}
      >
        <AlertDialogContent onCloseAutoFocus={focusAfterDialog}>
          <AlertDialogTitle>
            {(asking?.next ? labels.changeQuestion : labels.deleteQuestion)(
              asking?.occurrence.title || labels.untitled,
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {asking?.next ? labels.whichChange : labels.whichDelete}
          </AlertDialogDescription>
          <div className="nuv-event-calendar__scopes">
            {scopes.map((scope) => (
              <AlertDialogAction
                key={scope}
                intent={asking?.next ? "secondary" : "danger"}
                onClick={() => answer(scope)}
              >
                {scopeLabels[scope]}
              </AlertDialogAction>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div role="status" className="nuv-event-calendar__announcer">
        {announcement}
      </div>
    </>
  );

  return {
    resourceList,
    resources,
    rules,
    write,
    resourceRequired,
    multipleResources: props.multipleResources ?? false,
    onEventClick: onEventClick
      ? (event: CalendarEvent, element: HTMLElement) =>
          onEventClick(write(event), element)
      : undefined,
    shownEvents,
    placed,
    drag,
    edit,
    viewHandlers,
    dialogs,
  };
}
