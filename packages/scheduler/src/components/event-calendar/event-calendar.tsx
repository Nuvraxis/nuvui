"use client";

import { TZDate } from "@date-fns/tz";
import { Calendar } from "@nuvui/date-picker/calendar";
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
  forwardRef,
  type HTMLAttributes,
  type ReactElement,
  type RefAttributes,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
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
import type { CalendarEvent } from "../../core/events";
import { formatters, usesTwelveHours } from "../../core/format";
import { englishLabels } from "../../core/labels";
import type { CalendarResource } from "../../core/resources";
import { cx } from "../../utils/cx";
import { useControlled } from "../../utils/use-controlled";
import { useWidth } from "../../utils/use-width";
import { AgendaView } from "./agenda-view";
import {
  CalendarContext,
  type CalendarContextValue,
  type CalendarView,
  type EventCalendarPreferences,
  type PreferenceName,
  type ResolvedPreferences,
} from "./context";
import { allFields } from "./editor";
import { Chevron } from "./icons";
import { MonthView } from "./month-view";
import { ResourceList } from "./resource-list";
import {
  noDate,
  noIds,
  type SchedulerOwnProps,
  useHydrated,
  useNow,
  useScheduler,
  validHours,
} from "./scheduler";
import { TimeGrid } from "./time-grid";
import { scrollTimeGrid, spotAt } from "./use-drag";

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

export type { EditStartDetails, EventDropOutsideDetails } from "./scheduler";

export interface EventCalendarOwnProps<
  TEvent extends object = CalendarEvent,
  TResource extends object = CalendarResource,
> extends SchedulerOwnProps<TEvent> {
  /**
   * What events are booked against: rooms, people, machines. Listed in the
   * side panel, where each can be shown or hidden, and offered in an
   * event's popover.
   */
  resources?: readonly TResource[];
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
   * The level of the heading with the period shown. The agenda's days are
   * a level below.
   * @default 2
   */
  headingLevel?: 2 | 3 | 4 | 5;
}

export interface EventCalendarProps<
  TEvent extends object = CalendarEvent,
  TResource extends object = CalendarResource,
> extends EventCalendarOwnProps<TEvent, TResource>,
    Omit<
      HTMLAttributes<HTMLElement>,
      keyof EventCalendarOwnProps | "children"
    > {}

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
  function EventCalendar(props, forwardedRef) {
    const {
      // The scheduler's, which useScheduler reads from the props.
      events: _events,
      defaultEvents: _defaultEvents,
      onEventsChange: _onEventsChange,
      eventKeys: _eventKeys,
      resources: _resources,
      resourceKeys: _resourceKeys,
      resourceRequired: _resourceRequired,
      multipleResources: _multipleResources,
      readOnly: _readOnly,
      creatable: _creatable,
      createOn: _createOn,
      defaultDuration = 60,
      step: _step,
      confirmDelete: _confirmDelete,
      eventFields = allFields,
      renderEventFields: _renderEventFields,
      onEditStart: _onEditStart,
      onEventDropOutside: _onEventDropOutside,
      createId: _createId,
      onEventClick: _onEventClick,
      // The calendar's own.
      hiddenResources: hiddenProp,
      defaultHiddenResources = noIds,
      onHiddenResourcesChange,
      collapsedResources: collapsedProp,
      defaultCollapsedResources = noIds,
      onCollapsedResourcesChange,
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
      className,
      "aria-label": ariaLabel,
      ...rest
    } = props;
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
    const { now, today } = useNow(todayProp, timeZone);

    const [view, setView] = useControlled(
      viewProp !== undefined,
      viewProp ?? defaultView,
      defaultView,
      onViewChange,
    );
    const [date, setDateValue] = useControlled<Date>(
      dateProp !== undefined,
      dateProp ?? noDate,
      defaultDate ?? todayProp ?? new Date(),
      onDateChange,
    );
    const undated =
      !hydrated && (dateProp ?? defaultDate ?? todayProp) === undefined;
    const day = dayOf(undated ? noDate : date, timeZone);
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

    const scheduler = useScheduler(
      { ...props, defaultDuration, eventFields },
      {
        root,
        timeZone,
        labels,
        format,
        first,
        last,
        hidden,
        scrollToHour,
        locate: spotAt,
        scrollNear: scrollTimeGrid,
        follow: setDate,
      },
    );
    const { placed } = scheduler;

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
      onEventClick: scheduler.onEventClick,
      edit: scheduler.edit,
      resources: scheduler.resources,
      rules: scheduler.rules,
      resourceRequired: scheduler.resourceRequired,
      multipleResources: scheduler.multipleResources,
      write: scheduler.write,
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
        // looking, or the day they're looking on. It keeps its place and
        // shows the days once it does.
        data-pending={!hydrated && (!timeZoneProp || undated) ? "" : undefined}
        className={cx("nuv-event-calendar", className)}
        {...rest}
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
                <Chevron
                  direction="previous"
                  className="nuv-event-calendar__chevron"
                />
              </Button>
              <Button
                intent="ghost"
                size="sm"
                className="nuv-event-calendar__icon-button"
                aria-label={labels.next}
                onClick={() => setDate(period.step(1))}
              >
                <Chevron
                  direction="next"
                  className="nuv-event-calendar__chevron"
                />
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
                // Told no month, it draws its own stand-in, whose month can't
                // hold the day it uses to mark none as today.
                {...(undated ? null : { defaultMonth: zonedDay(day) })}
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
              {scheduler.resourceList.length > 0 ? (
                <ResourceList
                  resources={scheduler.resourceList}
                  hidden={hidden}
                  onHiddenChange={setHidden}
                  collapsed={collapsed}
                  onCollapsedChange={setCollapsed}
                />
              ) : null}
            </aside>
            {/* The clicks, keys and drags of the grids' cells and events, taken here once rather than on each. */}
            <div
              className="nuv-event-calendar__view"
              {...scheduler.viewHandlers}
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
                  events={scheduler.shownEvents}
                />
              ) : (
                <TimeGrid days={days} placed={placed} label={title} />
              )}
            </div>
          </div>
          {scheduler.dialogs}
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
