"use client";

import { TZDate } from "@date-fns/tz";
import { Calendar, type CalendarLocale } from "@nuvui/date-picker/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@nuvui/react/alert-dialog";
import { Button } from "@nuvui/react/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@nuvui/react/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nuvui/react/select";
import { ToggleGroup, ToggleGroupItem } from "@nuvui/react/toggle-group";
import { getWeek } from "date-fns";
import {
  type DragEvent,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type RefAttributes,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  addDays,
  addMonths,
  type DayKey,
  dayOf,
  daysFrom,
  endOfMonth,
  isWeekend,
  localTimeZone,
  momentOf,
  startOfMonth,
  startOfWeek,
} from "../../core/dates";
import {
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
  place,
  placeEvents,
} from "../../core/events";
import { formatters, usesTwelveHours } from "../../core/format";
import {
  type EventKeys,
  type ResourceKeys,
  readEvent,
  readResources,
  writeChange,
  writeEvent,
} from "../../core/keys";
import { englishLabels, type SchedulerLabels } from "../../core/labels";
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
  rulesOf,
} from "../../core/resources";
import {
  changeOccurrence,
  deleteOccurrence,
  type Scope,
  type SeriesOptions,
} from "../../core/series";
import { cx } from "../../utils/cx";
import { useControlled } from "../../utils/use-controlled";
import { useWidth } from "../../utils/use-width";
import { AgendaView } from "./agenda-view";
import {
  CalendarContext,
  type CalendarContextValue,
  type CalendarView,
  type EditingValue,
  type EventCalendarPreferences,
  type PreferenceName,
  type ResolvedPreferences,
} from "./context";
import {
  allFields,
  type Editing,
  EventEditor,
  type EventField,
  type EventFieldsProps,
} from "./editor";
import { timeOf } from "./event-button";
import { draggedItem, type ExternalEvent, eventType } from "./external";
import { MonthView } from "./month-view";
import { ResourceList } from "./resource-list";
import { TimeGrid } from "./time-grid";
import { spotAt, useDrag } from "./use-drag";

export type {
  CalendarView,
  EventCalendarPreferences,
  PreferenceName,
} from "./context";

const allViews: readonly CalendarView[] = ["day", "week", "month", "agenda"];

const defaultPreferenceOptions: readonly PreferenceName[] = [
  "twentyFourHours",
  "showWeekends",
  "showWeekNumbers",
  "showEmptyDays",
];

// Narrower than this, the week shows three days and the views are a menu.
// The "sm" breakpoint, measured on the calendar and not the window, since
// it's often beside a sidebar.
const narrowWidth = 640;
// Narrower than this, a week beside the side panel would leave each day
// too thin to read, so the panel opens over the days, and starts closed.
const panelWidth = 1024;

/** Passed to `onEditStart`. */
export interface EditStartDetails {
  /** It's being made, and isn't one of the events yet. */
  isNew: boolean;
  /** It opens to be read, not changed. */
  readOnly: boolean;
  /** The element it was opened from. */
  element: HTMLElement;
  /** Keeps the calendar's popover closed, to open your own form instead. */
  preventDefault: () => void;
}

/** Passed to `onEventDropOutside`. */
export interface EventDropOutsideDetails {
  /** The element under the pointer where it was let go. */
  target: Element | null;
  clientX: number;
  clientY: number;
}

export interface EventCalendarOwnProps<
  TEvent extends object = CalendarEvent,
  TResource extends object = CalendarResource,
> {
  /**
   * The events, when you hold them. Pass `onEventsChange` too for them to
   * be changed in the calendar: without it, they open to be read.
   */
  events?: readonly TEvent[];
  /** The events at first, when the calendar holds them. */
  defaultEvents?: readonly TEvent[];
  /**
   * Called with every event after one is made, changed or deleted, and
   * what the change was.
   */
  onEventsChange?: (events: TEvent[], change: EventChange<TEvent>) => void;
  /**
   * The names your events' fields have where they aren't the calendar's,
   * such as `{ title: "name", resourceIds: "roomId" }`. Events are read
   * from them, and changes are written back to them, with every other
   * field of yours kept.
   */
  eventKeys?: EventKeys;
  /**
   * What events are booked against: rooms, people, machines. Listed in the
   * side panel, where each can be shown or hidden, and offered in an
   * event's popover.
   */
  resources?: readonly TResource[];
  /** The names your resources' fields have where they aren't the calendar's. */
  resourceKeys?: ResourceKeys;
  /**
   * Every event needs a resource. A new event is given the first one shown,
   * and the popover offers no choice of none.
   * @default false
   */
  resourceRequired?: boolean;
  /**
   * An event can be given several resources in its popover, not just one.
   * @default false
   */
  multipleResources?: boolean;
  /** The ids of the resources whose events are hidden, when you control them. */
  hiddenResources?: readonly string[];
  /** The resources hidden at first, when you don't control them. */
  defaultHiddenResources?: readonly string[];
  /** Called with the ids of every hidden resource when one is shown or hidden. */
  onHiddenResourcesChange?: (hidden: string[]) => void;
  /**
   * The ids of the resources folded in the side panel, with those inside
   * them out of sight, when you control them.
   */
  collapsedResources?: readonly string[];
  /** The resources folded at first, when you don't control them. */
  defaultCollapsedResources?: readonly string[];
  /** Called with the ids of every folded resource when one folds or opens. */
  onCollapsedResourcesChange?: (collapsed: string[]) => void;
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
   * Minutes a new event lasts when it's made with a click, and an all-day
   * one dragged onto a time.
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
   * Called when an event is dragged out of the calendar and let go, with
   * what's under the pointer. Return `true` to take it off the calendar.
   */
  onEventDropOutside?: (
    event: TEvent,
    details: EventDropOutsideDetails,
  ) => boolean | undefined;
  /** Makes the id of a new event. A random UUID by default. */
  createId?: () => string;
  /** The view shown, when you control it. */
  view?: CalendarView;
  /**
   * The view shown at first, when you don't control it.
   * @default "week"
   */
  defaultView?: CalendarView;
  /** Called with the view chosen. */
  onViewChange?: (view: CalendarView) => void;
  /**
   * The views offered in the header, in order.
   * @default ["day", "week", "month", "agenda"]
   */
  views?: readonly CalendarView[];
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
   * The hours the day and week views show, from the first to the last,
   * which isn't included. Whole hours from 0 to 24.
   * @default [0, 24]
   */
  hours?: readonly [number, number];
  /**
   * The hour the day and week views open scrolled to.
   * @default 7
   */
  scrollToHour?: number;
  /**
   * How many days the agenda lists at a time.
   * @default 7
   */
  agendaDays?: number;
  /** What the person looking has chosen, when you control it. */
  preferences?: EventCalendarPreferences;
  /** What's chosen at first, when you don't control it. */
  defaultPreferences?: EventCalendarPreferences;
  /** Called with every preference, after one changes. */
  onPreferencesChange?: (preferences: EventCalendarPreferences) => void;
  /**
   * The preferences offered in the menu, in order. An empty list takes the
   * menu away.
   * @default ["twentyFourHours", "showWeekends", "showWeekNumbers", "showEmptyDays"]
   */
  preferenceOptions?: readonly PreferenceName[];
  /**
   * Whether the side panel is open beside the days, when you control it.
   * That's on a calendar 1024 pixels wide or wider.
   */
  panelOpen?: boolean;
  /**
   * Whether the side panel is open at first beside the days. On a calendar
   * narrower than 1024 pixels it opens over the days instead, and starts
   * closed.
   * @default true
   */
  defaultPanelOpen?: boolean;
  /** Called with whether the side panel is open beside the days. */
  onPanelOpenChange?: (open: boolean) => void;
  /**
   * The color of events that have none of their own, and none from a
   * resource.
   * @default "1"
   */
  color?: EventColor;
  /**
   * The level of the heading with the period shown. The agenda's days are
   * a level below.
   * @default 2
   */
  headingLevel?: 2 | 3 | 4 | 5;
  /**
   * The words the calendar shows and says. Translate them with the rest of
   * your interface.
   */
  labels?: Partial<SchedulerLabels>;
  /**
   * Called when an event is pressed, with the element pressed, before its
   * popover opens.
   */
  onEventClick?: (event: TEvent, element: HTMLElement) => void;
}

export interface EventCalendarProps<
  TEvent extends object = CalendarEvent,
  TResource extends object = CalendarResource,
> extends EventCalendarOwnProps<TEvent, TResource>,
    Omit<
      HTMLAttributes<HTMLElement>,
      keyof EventCalendarOwnProps | "children"
    > {}

const never = () => () => {};

let made = 0;
function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  made += 1;
  return `event-${Date.now()}-${made}`;
}

const noEvents: readonly object[] = [];
const noIds: readonly string[] = [];

// The same keys for as long as they say the same, since they're often
// written inline, and events are read again when they change.
function useSameKeys<T extends object>(keys: T | undefined): T | undefined {
  const text = keys ? JSON.stringify(keys) : "";
  // biome-ignore lint/correctness/useExhaustiveDependencies: what they say, not the object
  return useMemo(() => keys, [text]);
}

// False on the server, and in the browser while it takes over the HTML the
// server sent. The server can't know the time zone of the person looking.
function useHydrated() {
  return useSyncExternalStore(
    never,
    () => true,
    () => false,
  );
}

function validHours(
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

function Chevron({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg
      aria-hidden="true"
      className={`nuv-event-calendar__chevron nuv-event-calendar__chevron--${direction}`}
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d={
          direction === "previous"
            ? "M10 3.5 5.5 8l4.5 4.5"
            : "M6 3.5 10.5 8 6 12.5"
        }
      />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <path d="M6 3v10" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M2.5 4.5h4M9.5 4.5h4M2.5 11.5h7M12.5 11.5h1" />
      <circle cx="8" cy="4.5" r="1.5" />
      <circle cx="11" cy="11.5" r="1.5" />
    </svg>
  );
}

type AnyProps = EventCalendarProps<object, object>;

const UntypedEventCalendar = forwardRef<HTMLElement, AnyProps>(
  function EventCalendar(
    {
      events: eventsProp,
      defaultEvents = noEvents,
      onEventsChange,
      eventKeys: eventKeysProp,
      resources: resourcesProp = noEvents,
      resourceKeys: resourceKeysProp,
      resourceRequired = false,
      multipleResources = false,
      hiddenResources: hiddenProp,
      defaultHiddenResources = noIds,
      onHiddenResourcesChange,
      collapsedResources: collapsedProp,
      defaultCollapsedResources = noIds,
      onCollapsedResourcesChange,
      readOnly = false,
      creatable: creatableProp = true,
      createOn = "click",
      defaultDuration = 60,
      step = 15,
      confirmDelete = true,
      eventFields = allFields,
      renderEventFields,
      onEditStart,
      onEventDropOutside,
      createId = randomId,
      view: viewProp,
      defaultView = "week",
      onViewChange,
      views = allViews,
      date: dateProp,
      defaultDate,
      onDateChange,
      timeZone: timeZoneProp,
      locale,
      today: todayProp,
      hours: hoursProp = [0, 24],
      scrollToHour = 7,
      agendaDays = 7,
      preferences: preferencesProp,
      defaultPreferences = {},
      onPreferencesChange,
      preferenceOptions = defaultPreferenceOptions,
      panelOpen: panelOpenProp,
      defaultPanelOpen = true,
      onPanelOpenChange,
      color = "1",
      headingLevel = 2,
      labels: labelsProp,
      onEventClick,
      className,
      "aria-label": ariaLabel,
      ...props
    },
    forwardedRef,
  ) {
    const id = useId();
    const root = useRef<HTMLElement | null>(null);
    const setRoot = useCallback(
      (node: HTMLElement | null) => {
        root.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );
    const hydrated = useHydrated();
    const timeZone = timeZoneProp ?? (hydrated ? localTimeZone() : "UTC");
    const width = useWidth(root, panelWidth);
    const narrow = width < narrowWidth;
    const panelOver = width < panelWidth;
    const labels = useMemo(
      () => ({ ...englishLabels, ...labelsProp }),
      [labelsProp],
    );
    const hours = useMemo(
      () => validHours(hoursProp),
      // The two numbers, not the array, which is often written inline.
      [hoursProp[0], hoursProp[1]],
    );

    // The clock moves the line at the time now, once the browser has the
    // page. The server draws no line and marks no day as today, since it
    // can't know which: a page built ahead would keep the day it was built.
    const [clock, setClock] = useState<Date | null>(null);
    useEffect(() => {
      if (todayProp) return;
      setClock(new Date());
      const timer = setInterval(() => setClock(new Date()), 30_000);
      return () => clearInterval(timer);
    }, [todayProp]);
    const now = todayProp ?? clock;
    const today = now ? dayOf(now, timeZone) : null;

    const [view, setView] = useControlled(
      viewProp !== undefined,
      viewProp ?? defaultView,
      defaultView,
      onViewChange,
    );
    const [date, setDateValue] = useControlled<Date>(
      dateProp !== undefined,
      dateProp ?? new Date(0),
      defaultDate ?? todayProp ?? new Date(),
      onDateChange,
    );
    const day = dayOf(date, timeZone);
    const setDate = useCallback(
      (next: DayKey) => setDateValue(momentOf(next, 0, timeZone)),
      [setDateValue, timeZone],
    );

    const [chosen, setChosen] = useControlled(
      preferencesProp !== undefined,
      preferencesProp ?? {},
      defaultPreferences,
      onPreferencesChange,
    );
    const localeCode = locale?.code ?? "en-US";
    const preferences: ResolvedPreferences = {
      twentyFourHours: chosen.twentyFourHours ?? !usesTwelveHours(localeCode),
      showWeekends: chosen.showWeekends ?? true,
      showWeekNumbers: chosen.showWeekNumbers ?? false,
      weekStartsOn: chosen.weekStartsOn ?? locale?.options?.weekStartsOn ?? 0,
      showEmptyDays: chosen.showEmptyDays ?? true,
    };
    const prefer = (change: EventCalendarPreferences) =>
      setChosen({ ...chosen, ...change });

    const [panelOpen, setPanelOpen] = useControlled(
      panelOpenProp !== undefined,
      panelOpenProp ?? false,
      defaultPanelOpen,
      onPanelOpenChange,
    );
    const [overPanelOpen, setOverPanelOpen] = useState(false);
    const open = panelOver ? overPanelOpen : panelOpen;
    const setOpen = panelOver ? setOverPanelOpen : setPanelOpen;

    const format = useMemo(
      () => formatters(localeCode, timeZone, !preferences.twentyFourHours),
      [localeCode, timeZone, preferences.twentyFourHours],
    );

    const shown = (list: DayKey[]) =>
      preferences.showWeekends ? list : list.filter((key) => !isWeekend(key));

    // The days the view shows, how far previous and next go, and its name.
    const period = (() => {
      const { weekStartsOn } = preferences;
      switch (view) {
        case "day":
          return { days: [day], step: (by: number) => addDays(day, by) };
        case "month": {
          const first = startOfWeek(startOfMonth(day), weekStartsOn);
          const last = addDays(startOfWeek(endOfMonth(day), weekStartsOn), 6);
          return {
            days: shown(daysFrom(first, last)),
            step: (by: number) => addMonths(day, by),
          };
        }
        case "agenda": {
          // A day at least, so the agenda always has one to start from.
          const span = Math.max(1, Math.floor(agendaDays));
          return {
            days: daysFrom(day, addDays(day, span - 1)),
            step: (by: number) => addDays(day, by * span),
          };
        }
        default: {
          if (narrow) {
            return {
              days: daysFrom(day, addDays(day, 2)),
              step: (by: number) => addDays(day, by * 3),
            };
          }
          const first = startOfWeek(day, weekStartsOn);
          const days = shown(daysFrom(first, addDays(first, 6)));
          return {
            days: days.length > 0 ? days : [first],
            step: (by: number) => addDays(day, by * 7),
          };
        }
      }
    })();
    const days = period.days;
    const first = days[0] ?? day;
    const last = days[days.length - 1] ?? first;
    const title =
      view === "day"
        ? format.fullDay(day)
        : view === "month"
          ? format.month(day)
          : format.range(first, last);

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
    const resources = useMemo(
      () => indexResources(resourceList),
      [resourceList],
    );
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

    // Resources whose events are hidden, and those folded in the panel.
    const [hidden, setHidden] = useControlled<readonly string[]>(
      hiddenProp !== undefined,
      hiddenProp ?? noIds,
      defaultHiddenResources,
      onHiddenResourcesChange as
        | ((hidden: readonly string[]) => void)
        | undefined,
    );
    const [collapsed, setCollapsed] = useControlled<readonly string[]>(
      collapsedProp !== undefined,
      collapsedProp ?? noIds,
      defaultCollapsedResources,
      onCollapsedResourcesChange as
        | ((collapsed: readonly string[]) => void)
        | undefined,
    );
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
    const options: EditOptions = { step, defaultDuration, timeZone };

    // Moves said in words, for those who can't see them.
    const [announcement, setAnnouncement] = useState("");
    const when = (event: CalendarEvent) =>
      timeOf(place(event, timeZone), format, labels);

    // What takes the focus after the next render: an event that's moved
    // and drawn again, or what's left where one was deleted.
    const focusNext = useRef<(() => HTMLElement | null | undefined) | null>(
      null,
    );
    useEffect(() => {
      const find = focusNext.current;
      if (!find) return;
      focusNext.current = null;
      find()?.focus();
    });
    // An event, or for one that repeats, the first of its occurrences shown.
    const eventElement = (eventId: string) => {
      const id = CSS.escape(eventId);
      return (
        root.current?.querySelector<HTMLElement>(
          `[data-event-id="${id}"]:not([data-preview])`,
        ) ??
        root.current?.querySelector<HTMLElement>(
          `[data-event-id^="${id}:"]:not([data-preview])`,
        ) ??
        null
      );
    };

    // An event on the move: dragged with a pointer, picked up from the
    // keyboard, or dragged in from elsewhere on the page.
    const [drag, setDrag] = useState<{
      base: CalendarEvent;
      times: Times;
      via: "pointer" | "keyboard" | "outside";
      hidden?: boolean;
    } | null>(null);
    const [editing, setEditing] = useState<
      (Editing & { times?: Times }) | null
    >(null);
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
    // A press on the calendar while a popover is open closes it, and
    // isn't also the start of a new event.
    const closing = useRef(false);
    const outside = useRef(false);

    const placed = useMemo(() => {
      const moved = drag ? withTimes(drag.base, drag.times, timeZone) : null;
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

    const startCreate = (times: Times, element: HTMLElement) => {
      if (!creatable) return;
      const resourceIds = firstResource();
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
        root.current?.querySelector<HTMLElement>(
          '.nuv-event-calendar__view [tabindex="0"]',
        );
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

    const onPointerDown = useDrag(root, {
      editable,
      creatable,
      find,
      rules,
      onMove: ({ mode, placed: item, from, to }) => {
        if (!to) {
          // Out of the calendar, to be dropped on the page.
          if (onEventDropOutside && mode === "move") {
            setDrag((was) => was && { ...was, hidden: true });
          }
          return;
        }
        setDrag({
          base: item?.event ?? blank(""),
          times: dragTo(mode, item, from, to, options),
          via: "pointer",
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
          if (cell) startCreate(times, cell);
          return;
        }
        if (sameTimes(times, timesOf(item))) return;
        const next = withTimes(item.event, times, timeZone);
        if (occurrenceOf(item.event)) {
          setAsking({
            occurrence: item.event,
            next,
            dropped: true,
            element: eventElement(item.event.id),
          });
          return;
        }
        commit({ type: "update", event: next, previous: item.event });
        setAnnouncement(labels.dropped(next.title, when(next)));
      },
      onCancel: () => setDrag(null),
    });

    const spotOf = (cell: HTMLElement): Spot => ({
      day: cell.dataset.spotDay ?? day,
      minute:
        cell.dataset.spotHour === undefined
          ? null
          : Number(cell.dataset.spotHour) * 60,
    });

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
        spotAt(root.current, click.clientX, click.clientY) ?? spotOf(cell);
      startCreate(timesAt(spot, defaultDuration, options), cell);
    };

    const createFromKey = (key: KeyboardEvent<HTMLElement>) => {
      const cell = key.target as HTMLElement;
      if (key.key !== "Enter" || !creatable) return;
      if (cell.dataset.spotDay === undefined) return;
      key.preventDefault();
      startCreate(timesAt(spotOf(cell), defaultDuration, options), cell);
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
        ? spotAt(root.current, over.clientX, over.clientY)
        : null;
      if (!item || !spot) return;
      const times = timesFor(item, spot);
      if (drag?.via === "outside" && sameTimes(drag.times, times)) return;
      setDrag({
        base: {
          ...blank(""),
          title: item.title,
          color: item.color,
          ...(item.resourceIds ? { resourceIds: item.resourceIds } : null),
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
        ? spotAt(root.current, dropped.clientX, dropped.clientY)
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
      const resourceIds = fields.resourceIds ?? firstResource();
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
        afterDialog.current = () =>
          eventElement(focus) ?? (element?.isConnected ? element : null);
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
    // The alert dialogs give the focus back where the calendar says.
    const focusAfterDialog = (closing: Event) => {
      closing.preventDefault();
      const find = afterDialog.current;
      afterDialog.current = null;
      find?.()?.focus();
    };

    const edit: EditingValue = {
      editable,
      creatable,
      options,
      picked: drag?.via === "keyboard" ? drag.base.id : null,
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
          anchor: () => eventElement(event.id) ?? element,
        });
      },
      remove: requestDelete,
      pick: (item) => {
        setEditing(null);
        setDrag({ base: item.event, times: timesOf(item), via: "keyboard" });
        setAnnouncement(
          labels.pickedUp(item.event.title, timeOf(item, format, labels)),
        );
      },
      nudge: (by, resize) => {
        if (drag?.via !== "keyboard") return;
        const current = place(
          withTimes(drag.base, drag.times, timeZone),
          timeZone,
        );
        const times = nudge(current, by, resize, options);
        const moved = place(withTimes(drag.base, times, timeZone), timeZone);
        setDrag({ ...drag, times });
        // Off the days shown, the calendar goes with it.
        const lead = resize ? moved.lastDay : moved.firstDay;
        if (lead < first || lead > last) setDate(lead);
        setAnnouncement(labels.movedTo(timeOf(moved, format, labels)));
        focusNext.current = () => eventElement(drag.base.id);
      },
      drop: () => {
        if (drag?.via !== "keyboard") return;
        const next = withTimes(drag.base, drag.times, timeZone);
        setDrag(null);
        const moved = !sameTimes(
          drag.times,
          timesOf(place(drag.base, timeZone)),
        );
        if (moved && occurrenceOf(drag.base)) {
          setAsking({
            occurrence: drag.base,
            next,
            dropped: true,
            element: eventElement(drag.base.id),
          });
          return;
        }
        if (moved) {
          commit({ type: "update", event: next, previous: drag.base });
        }
        setAnnouncement(labels.dropped(next.title, when(next)));
        focusNext.current = () => eventElement(next.id);
      },
      putBack: () => {
        if (drag?.via !== "keyboard") return;
        setDrag(null);
        setAnnouncement(labels.putBack(drag.base.title));
        focusNext.current = () => eventElement(drag.base.id);
      },
      create: startCreate,
    };

    const context: CalendarContextValue = {
      timeZone,
      locale,
      today,
      now,
      format,
      labels,
      preferences,
      color,
      hours,
      scrollToHour,
      headingLevel,
      id,
      weekNumber: (key) => {
        const [year = 0, month = 1, date = 1] = key.split("-").map(Number);
        return getWeek(new Date(year, month - 1, date), {
          weekStartsOn: preferences.weekStartsOn as 0,
          firstWeekContainsDate: locale?.options?.firstWeekContainsDate ?? 1,
        });
      },
      goToDay: (key) => {
        setDate(key);
        if (views.includes("day")) setView("day");
      },
      setDate,
      onEventClick: onEventClick
        ? (event, element) => onEventClick(write(event), element)
        : undefined,
      edit,
      resources,
      rules,
      resourceRequired,
      multipleResources,
      write,
    };

    const Heading = `h${headingLevel}` as "h2";
    const zonedDay = (key: DayKey) =>
      new TZDate(momentOf(key, 12 * 60, timeZone).getTime(), timeZone);
    const panelId = `${id}-panel`;

    return (
      <section
        ref={setRoot}
        aria-label={ariaLabel ?? labels.calendar}
        data-view={view}
        data-narrow={narrow ? "" : undefined}
        data-panel-over={panelOver ? "" : undefined}
        // Drawn by a server that can't know the time zone of the person
        // looking. It keeps its place and shows the days once it does.
        data-pending={!timeZoneProp && !hydrated ? "" : undefined}
        className={cx("nuv-event-calendar", className)}
        {...props}
      >
        <CalendarContext.Provider value={context}>
          <div className="nuv-event-calendar__header">
            <Button
              intent="ghost"
              size="sm"
              className="nuv-event-calendar__icon-button"
              aria-label={labels.sidePanel}
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen(!open)}
            >
              <PanelIcon />
            </Button>
            <Button
              intent="secondary"
              size="sm"
              onClick={() => setDate(dayOf(now ?? new Date(), timeZone))}
            >
              {labels.today}
            </Button>
            <div className="nuv-event-calendar__steps">
              <Button
                intent="ghost"
                size="sm"
                className="nuv-event-calendar__icon-button"
                aria-label={labels.previous}
                onClick={() => setDate(period.step(-1))}
              >
                <Chevron direction="previous" />
              </Button>
              <Button
                intent="ghost"
                size="sm"
                className="nuv-event-calendar__icon-button"
                aria-label={labels.next}
                onClick={() => setDate(period.step(1))}
              >
                <Chevron direction="next" />
              </Button>
            </div>
            <Heading className="nuv-event-calendar__title" aria-live="polite">
              {title}
            </Heading>
            <div className="nuv-event-calendar__tools">
              {views.length < 2 ? null : narrow ? (
                <Select
                  value={view}
                  onValueChange={(next) => setView(next as CalendarView)}
                >
                  <SelectTrigger
                    aria-label={labels.view}
                    className="nuv-event-calendar__view-select"
                  >
                    <SelectValue>{labels[view]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {views.map((option) => (
                      <SelectItem key={option} value={option}>
                        {labels[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <ToggleGroup
                  type="single"
                  size="sm"
                  aria-label={labels.view}
                  value={view}
                  onValueChange={(next) => {
                    if (next) setView(next as CalendarView);
                  }}
                >
                  {views.map((option) => (
                    <ToggleGroupItem key={option} value={option}>
                      {labels[option]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
              {preferenceOptions.length === 0 ? null : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      intent="ghost"
                      size="sm"
                      className="nuv-event-calendar__icon-button"
                      aria-label={labels.preferences}
                    >
                      <SettingsIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {preferenceOptions.map((name) =>
                      name === "weekStartsOn" ? (
                        <DropdownMenuSub key={name}>
                          <DropdownMenuSubTrigger>
                            {labels.weekStartsOn}
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup
                              value={String(preferences.weekStartsOn)}
                              onValueChange={(next) =>
                                prefer({
                                  weekStartsOn: Number(
                                    next,
                                  ) as EventCalendarPreferences["weekStartsOn"],
                                })
                              }
                            >
                              {/* 18 October 2026 is a Sunday. */}
                              {daysFrom("2026-10-18", "2026-10-24").map(
                                (key, weekday) => (
                                  <DropdownMenuRadioItem
                                    key={key}
                                    value={String(weekday)}
                                  >
                                    {format.longWeekday(key)}
                                  </DropdownMenuRadioItem>
                                ),
                              )}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      ) : (
                        <DropdownMenuCheckboxItem
                          key={name}
                          checked={preferences[name]}
                          // The menu stays open, to change another.
                          onSelect={(event) => event.preventDefault()}
                          onCheckedChange={(checked) =>
                            prefer({ [name]: checked === true })
                          }
                        >
                          {labels[name]}
                        </DropdownMenuCheckboxItem>
                      ),
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          <div className="nuv-event-calendar__main">
            <aside
              id={panelId}
              aria-label={labels.sidePanel}
              hidden={!open}
              className="nuv-event-calendar__panel"
              onKeyDown={(event) => {
                if (panelOver && event.key === "Escape") setOpen(false);
              }}
            >
              <Calendar
                key={day.slice(0, 7)}
                mode="single"
                required
                selected={zonedDay(day)}
                defaultMonth={zonedDay(day)}
                {...(today ? { today: zonedDay(today) } : null)}
                timeZone={timeZone}
                locale={locale}
                weekStartsOn={preferences.weekStartsOn as 0}
                showWeekNumber={preferences.showWeekNumbers}
                onSelect={(picked: Date | undefined) => {
                  if (!picked) return;
                  setDate(dayOf(picked, timeZone));
                  if (panelOver) setOpen(false);
                }}
              />
              {resourceList.length > 0 ? (
                <ResourceList
                  resources={resourceList}
                  hidden={hidden}
                  onHiddenChange={setHidden}
                  collapsed={collapsed}
                  onCollapsedChange={setCollapsed}
                />
              ) : null}
            </aside>
            {/* biome-ignore lint/a11y/noStaticElementInteractions: the clicks, keys and drags of the grids' cells and events, taken here once rather than on each. */}
            <div
              className="nuv-event-calendar__view"
              onPointerDown={(down) => {
                closing.current = editing !== null;
                onPointerDown(down);
              }}
              onClick={createOn === "click" ? createFromClick : undefined}
              onDoubleClick={
                createOn === "doubleClick" ? createFromClick : undefined
              }
              onKeyDown={createFromKey}
              onDragOver={dragOver}
              onDragLeave={dragLeave}
              onDrop={dropIn}
            >
              {view === "month" ? (
                <MonthView
                  days={days}
                  placed={placed}
                  label={title}
                  month={day.slice(0, 7)}
                  perWeek={preferences.showWeekends ? 7 : 5}
                />
              ) : view === "agenda" ? (
                <AgendaView
                  days={days}
                  placed={placed}
                  label={title}
                  events={shownEvents}
                />
              ) : (
                <TimeGrid days={days} placed={placed} label={title} />
              )}
            </div>
          </div>
          <EventEditor
            editing={editing}
            fields={eventFields}
            renderFields={renderEventFields}
            defaultDuration={defaultDuration}
            scrollToHour={scrollToHour}
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
              const event =
                rule === undefined ? merged : withRule(merged, rule);
              commit(
                was.isNew
                  ? { type: "create", event }
                  : { type: "update", event, previous: was.event },
              );
              setEditing(null);
              const element = returnTo.current;
              focusNext.current = () =>
                eventElement(event.id) ??
                (element?.isConnected ? element : null);
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
            onTimesChange={(times) =>
              setEditing((was) => was && { ...was, times })
            }
          />
          <AlertDialog
            open={deleting !== null}
            onOpenChange={(open) => {
              if (open || !deleting) return;
              const { element } = deleting;
              setDeleting(null);
              // Cancelled: back to the event.
              afterDialog.current ??= () =>
                element.isConnected ? element : null;
            }}
          >
            <AlertDialogContent onCloseAutoFocus={focusAfterDialog}>
              <AlertDialogTitle>
                {labels.deleteQuestion(
                  deleting?.event.title || labels.untitled,
                )}
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
        </CalendarContext.Provider>
      </section>
    );
  },
);

/**
 * Events in a day, a week, a month or a list. Events that overlap are set
 * side by side, those over several days are bars across them, and a full
 * day in a month keeps the rest behind "3 more".
 */
export const EventCalendar = UntypedEventCalendar as <
  TEvent extends object = CalendarEvent,
  TResource extends object = CalendarResource,
>(
  props: EventCalendarProps<TEvent, TResource> & RefAttributes<HTMLElement>,
) => ReactElement | null;
