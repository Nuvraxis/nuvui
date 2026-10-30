"use client";

import { Button } from "@nuvui/react/button";
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
  type ReactNode,
  type RefAttributes,
  useCallback,
  useId,
  useMemo,
  useRef,
} from "react";
import {
  addDays,
  type DayKey,
  dayOf,
  localTimeZone,
  momentOf,
} from "../../core/dates";
import type { CalendarEvent } from "../../core/events";
import { formatters, usesTwelveHours } from "../../core/format";
import type { ResourceKeys } from "../../core/keys";
import { englishLabels } from "../../core/labels";
import type { CalendarResource } from "../../core/resources";
import {
  axisOf,
  defaultSpans,
  periodStart,
  rowsOf,
  shiftPeriod,
  type TimelineRow,
  type TimelineScale,
  timelineScales,
} from "../../core/timeline";
import { cx } from "../../utils/cx";
import { useControlled } from "../../utils/use-controlled";
import { useWidth } from "../../utils/use-width";
import {
  CalendarContext,
  type CalendarContextValue,
  type ResolvedPreferences,
} from "../event-calendar/context";
import { allFields } from "../event-calendar/editor";
import { Chevron } from "../event-calendar/icons";
import {
  noDate,
  noEvents,
  noIds,
  type SchedulerOwnProps,
  useHydrated,
  useNow,
  useScheduler,
  validHours,
} from "../event-calendar/scheduler";
import { scrollTimeline, TimelineGrid, timelineSpotAt } from "./timeline-grid";

export type { TimelineScale } from "../../core/timeline";

// Narrower than this, the scales are a menu, and the resources' column is
// narrower. The "sm" breakpoint, measured on the timeline.
const narrowWidth = 640;

const noSpans: Partial<Record<TimelineScale, number>> = {};

export interface EventTimelineOwnProps<
  TEvent extends object = CalendarEvent,
  TResource extends object = CalendarResource,
> extends SchedulerOwnProps<TEvent> {
  /**
   * What events are booked against, a row each: vehicles, people, rooms.
   * Those inside a resource are rows under it, which fold away. An event
   * is drawn in the row of each of its resources.
   */
  resources?: readonly TResource[];
  /** The ids of the folded resources, when you control them. */
  collapsedResources?: readonly string[];
  /** The resources folded at first, when you don't control them. */
  defaultCollapsedResources?: readonly string[];
  /** Called with the ids of every folded resource when one folds or opens. */
  onCollapsedResourcesChange?: (collapsed: string[]) => void;
  /** What a column is, when you control it. */
  scale?: TimelineScale;
  /**
   * What a column is at first, when you don't control it: an hour, a day,
   * a week, a month or a year.
   * @default "days"
   */
  defaultScale?: TimelineScale;
  /** Called with the scale chosen. */
  onScaleChange?: (scale: TimelineScale) => void;
  /**
   * The scales offered in the header, in order. With one, there's no
   * choice to make, and no switch.
   * @default ["hours", "days", "weeks", "months", "years"]
   */
  scales?: readonly TimelineScale[];
  /**
   * How much each scale shows at once, and how far Previous and Next go:
   * days for `hours`, months for `days` and `weeks`, and years for
   * `months` and `years`. Those left out keep theirs.
   * @default { hours: 3, days: 1, weeks: 3, months: 1, years: 10 }
   */
  spans?: Partial<Record<TimelineScale, number>>;
  /**
   * The hours of each day the hours scale shows, from the first to the
   * last, which isn't included. Whole hours from 0 to 24. An event partly
   * outside them is cut where they end, and marked so.
   * @default [0, 24]
   */
  hours?: readonly [number, number];
  /**
   * The hour the hours scale opens scrolled to, when now isn't in the
   * days shown.
   * @default 7
   */
  scrollToHour?: number;
  /**
   * What a resource's row shows beside its fold button: its title by
   * default. The row is still named by the title.
   */
  renderResource?: (resource: TResource) => ReactNode;
  /**
   * The level of the heading with the period shown.
   * @default 2
   */
  headingLevel?: 2 | 3 | 4 | 5;
}

export interface EventTimelineProps<
  TEvent extends object = CalendarEvent,
  TResource extends object = CalendarResource,
> extends EventTimelineOwnProps<TEvent, TResource>,
    Omit<
      HTMLAttributes<HTMLElement>,
      keyof EventTimelineOwnProps | "children"
    > {}

type AnyProps = EventTimelineProps<object, object>;

/**
 * The app's own resource objects by their ids, to hand to
 * `renderResource`, walked beside the resources as they're read.
 */
function originalsOf(
  items: readonly object[],
  keys: ResourceKeys | undefined,
  into = new Map<string, object>(),
): Map<string, object> {
  for (const item of items) {
    const fields = item as Record<string, unknown>;
    const id = fields[keys?.id ?? "id"];
    if (typeof id === "string") into.set(id, item);
    const children = fields[keys?.children ?? "children"];
    if (Array.isArray(children)) originalsOf(children, keys, into);
  }
  return into;
}

const UntypedEventTimeline = forwardRef<HTMLElement, AnyProps>(
  function EventTimeline(props, forwardedRef) {
    const {
      // The scheduler's, which useScheduler reads from the props.
      events: _events,
      defaultEvents: _defaultEvents,
      onEventsChange: _onEventsChange,
      eventKeys: _eventKeys,
      resources: resourcesProp = noEvents,
      resourceKeys,
      resourceRequired: _resourceRequired,
      multipleResources: _multipleResources,
      readOnly: _readOnly,
      creatable: _creatable,
      createOn: _createOn,
      defaultDuration = 60,
      step = 15,
      confirmDelete: _confirmDelete,
      eventFields = allFields,
      renderEventFields: _renderEventFields,
      onEditStart: _onEditStart,
      onEventDropOutside: _onEventDropOutside,
      createId: _createId,
      onEventClick: _onEventClick,
      // The timeline's own.
      collapsedResources: collapsedProp,
      defaultCollapsedResources = noIds,
      onCollapsedResourcesChange,
      scale: scaleProp,
      defaultScale = "days",
      onScaleChange,
      scales = timelineScales,
      spans = noSpans,
      date: dateProp,
      defaultDate,
      onDateChange,
      timeZone: timeZoneProp,
      locale,
      today: todayProp,
      hours: hoursProp = [0, 24],
      scrollToHour = 7,
      renderResource,
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
    const narrow = useWidth(root, 1024) < narrowWidth;
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

    const [scale, setScale] = useControlled(
      scaleProp !== undefined,
      scaleProp ?? defaultScale,
      defaultScale,
      onScaleChange,
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

    const localeCode = locale?.code ?? "en-US";
    const weekStartsOn = locale?.options?.weekStartsOn ?? 0;
    const preferences: ResolvedPreferences = {
      twentyFourHours: !usesTwelveHours(localeCode),
      showWeekends: true,
      showWeekNumbers: false,
      weekStartsOn,
      showEmptyDays: true,
    };
    const format = useMemo(
      () => formatters(localeCode, timeZone, usesTwelveHours(localeCode)),
      [localeCode, timeZone],
    );

    // The columns shown, and how far previous and next go.
    const span = Math.max(1, Math.floor(spans[scale] ?? defaultSpans[scale]));
    const start = periodStart(scale, day, span);
    const axis = useMemo(
      () => axisOf(scale, start, span, weekStartsOn, hours),
      [scale, start, span, weekStartsOn, hours],
    );
    const title =
      scale === "hours"
        ? format.range(axis.first, axis.last)
        : scale === "days" || scale === "weeks"
          ? format.monthRange(
              start,
              addDays(shiftPeriod(scale, start, span, 1), -1),
            )
          : format.yearRange(axis.first, axis.last);

    const [collapsed, setCollapsed] = useControlled<readonly string[]>(
      collapsedProp !== undefined,
      collapsedProp ?? noIds,
      defaultCollapsedResources,
      onCollapsedResourcesChange as
        | ((collapsed: readonly string[]) => void)
        | undefined,
    );

    // The rows depend on the resources the scheduler reads, and the
    // scheduler on the rows, for an event moved to the next one from the
    // keyboard. The rows are kept here for it to read when it's asked.
    const rowsRef = useRef<TimelineRow[]>([]);
    const scheduler = useScheduler(
      { ...props, defaultDuration, eventFields },
      {
        root,
        timeZone,
        labels,
        format,
        first: axis.first,
        last: axis.last,
        hidden: noIds,
        scrollToHour,
        locate: timelineSpotAt(axis),
        scrollNear: scrollTimeline,
        follow: setDate,
        rowAfter: (row, by) => {
          const list = rowsRef.current;
          const index = list.findIndex((item) => item.id === row);
          return index === -1 ? undefined : list[index + by]?.id;
        },
      },
    );
    const { placed, resources } = scheduler;

    const collapsedSet = useMemo(() => new Set(collapsed), [collapsed]);
    const rows = useMemo(() => {
      const list = rowsOf(scheduler.resourceList, collapsedSet);
      // A row for the events with no resource, when there are any, or
      // when there are no resources at all.
      const unassigned = placed.some(
        (item) => !item.event.resourceIds?.some((key) => resources.has(key)),
      );
      return unassigned || list.length === 0
        ? [...list, { id: null, resource: null, depth: 0, parent: false }]
        : list;
    }, [scheduler.resourceList, collapsedSet, placed, resources]);
    rowsRef.current = rows;

    const originals = useMemo(
      () => originalsOf(resourcesProp, resourceKeys),
      [resourcesProp, resourceKeys],
    );
    const renderRow = renderResource
      ? (resource: CalendarResource) =>
          renderResource(originals.get(resource.id) ?? resource)
      : undefined;

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
          weekStartsOn: weekStartsOn as 0,
          firstWeekContainsDate: locale?.options?.firstWeekContainsDate ?? 1,
        });
      },
      goToDay: (key) => {
        setDate(key);
        if (scales.includes("hours")) setScale("hours");
      },
      setDate,
      onEventClick: scheduler.onEventClick,
      edit: {
        ...scheduler.edit,
        along: scale === "hours" ? { minutes: step } : { days: 1 },
      },
      resources,
      rules: scheduler.rules,
      resourceRequired: scheduler.resourceRequired,
      multipleResources: scheduler.multipleResources,
      write: scheduler.write,
    };

    const Heading = `h${headingLevel}` as "h2";
    const pickedRow =
      scheduler.drag?.via === "keyboard" ? scheduler.drag.row : undefined;

    return (
      <section
        ref={setRoot}
        aria-label={ariaLabel ?? labels.timeline}
        data-scale={scale}
        data-narrow={narrow ? "" : undefined}
        // Drawn by a server that can't know the time zone of the person
        // looking, or the day they're looking on. It keeps its place and
        // shows the days once it does.
        data-pending={!hydrated && (!timeZoneProp || undated) ? "" : undefined}
        className={cx("nuv-event-timeline", className)}
        {...rest}
      >
        <CalendarContext.Provider value={context}>
          <div className="nuv-event-timeline__header">
            <Button
              intent="secondary"
              size="sm"
              onClick={() => setDate(dayOf(now ?? new Date(), timeZone))}
            >
              {labels.today}
            </Button>
            <div className="nuv-event-timeline__steps">
              <Button
                intent="ghost"
                size="sm"
                className="nuv-event-timeline__icon-button"
                aria-label={labels.previous}
                onClick={() => setDate(shiftPeriod(scale, start, span, -1))}
              >
                <Chevron
                  direction="previous"
                  className="nuv-event-timeline__chevron"
                />
              </Button>
              <Button
                intent="ghost"
                size="sm"
                className="nuv-event-timeline__icon-button"
                aria-label={labels.next}
                onClick={() => setDate(shiftPeriod(scale, start, span, 1))}
              >
                <Chevron
                  direction="next"
                  className="nuv-event-timeline__chevron"
                />
              </Button>
            </div>
            <Heading className="nuv-event-timeline__title" aria-live="polite">
              {title}
            </Heading>
            {scales.length < 2 ? null : (
              <div className="nuv-event-timeline__tools">
                {narrow ? (
                  <Select
                    value={scale}
                    onValueChange={(next) => setScale(next as TimelineScale)}
                  >
                    <SelectTrigger
                      aria-label={labels.scale}
                      className="nuv-event-timeline__scale-select"
                    >
                      <SelectValue>{labels.scaleName(scale)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {scales.map((option) => (
                        <SelectItem key={option} value={option}>
                          {labels.scaleName(option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <ToggleGroup
                    type="single"
                    size="sm"
                    aria-label={labels.scale}
                    value={scale}
                    onValueChange={(next) => {
                      if (next) setScale(next as TimelineScale);
                    }}
                  >
                    {scales.map((option) => (
                      <ToggleGroupItem key={option} value={option}>
                        {labels.scaleName(option)}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                )}
              </div>
            )}
          </div>
          {/* The clicks, keys and drags of the grid's cells and events, taken here once rather than on each. */}
          <div className="nuv-event-timeline__view" {...scheduler.viewHandlers}>
            <TimelineGrid
              axis={axis}
              rows={rows}
              placed={placed}
              label={title}
              collapsed={collapsed}
              onCollapsedChange={setCollapsed}
              renderResource={renderRow}
              pickedRow={pickedRow}
            />
          </div>
          {scheduler.dialogs}
        </CalendarContext.Provider>
      </section>
    );
  },
);

/**
 * Resources down the side, time across, and events as bars along their
 * rows. Only the rows and columns in view are drawn, so thousands of
 * resources and years of days stay quick.
 */
export const EventTimeline = UntypedEventTimeline as <
  TEvent extends object = CalendarEvent,
  TResource extends object = CalendarResource,
>(
  props: EventTimelineProps<TEvent, TResource> & RefAttributes<HTMLElement>,
) => ReactElement | null;
