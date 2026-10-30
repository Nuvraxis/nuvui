import type {
  CSSProperties,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useRef } from "react";
import { canDrag } from "../../core/edit";
import type { PlacedEvent } from "../../core/events";
import type { Formatters } from "../../core/format";
import type { SchedulerLabels } from "../../core/labels";
import { occurrenceOf } from "../../core/recurrence";
import { resourcesOf } from "../../core/resources";
import { cx } from "../../utils/cx";
import { useCalendar } from "./context";

// The chart colors by their number. Anything else is a CSS color already.
export function colorOf(color: string | undefined): string | undefined {
  if (!color) return undefined;
  return /^[1-8]$/.test(color) ? `var(--color-chart-${color})` : color;
}

/** When an event is, in words: its time, or all day, and its days. */
export function timeOf(
  placed: PlacedEvent,
  format: Formatters,
  labels: SchedulerLabels,
): string {
  const { firstDay, lastDay, start, end } = placed;
  if (placed.allDay) {
    return firstDay === lastDay
      ? `${labels.allDay}, ${format.day(firstDay)}`
      : `${labels.allDay}, ${labels.timeRange(format.day(firstDay), format.day(lastDay))}`;
  }
  if (firstDay === lastDay) {
    return `${labels.timeRange(format.time(start), format.time(end))}, ${format.day(firstDay)}`;
  }
  return labels.timeRange(
    `${format.day(firstDay)} ${format.time(start)}`,
    `${format.day(lastDay)} ${format.time(end)}`,
  );
}

/** A key for an event in a list, apart from its own preview. */
export const keyOf = (placed: PlacedEvent) =>
  placed.preview ? `${placed.event.id}:preview` : placed.event.id;

export type EventLook = "block" | "bar" | "line" | "item";

export interface EventButtonProps {
  placed: PlacedEvent;
  /**
   * `block` on the time grid, `bar` across days, `line` for a timed event
   * in a month, `item` in a list.
   */
  look: EventLook;
  tabbable: boolean;
  /** It began before the part of it drawn here. */
  startsBefore?: boolean;
  /** It goes on after the part of it drawn here. */
  endsAfter?: boolean;
  /**
   * The timeline's row it's drawn in: its resource, or `null` for the row
   * of events with none.
   */
  row?: string | null;
  className?: string;
  style?: CSSProperties;
}

export function EventButton({
  placed,
  look,
  tabbable,
  startsBefore = false,
  endsAfter = false,
  row,
  className: ownClassName,
  style,
}: EventButtonProps) {
  const { format, labels, color, onEventClick, edit, resources, rules } =
    useCalendar();
  const { event } = placed;
  const when = timeOf(placed, format, labels);
  const rule = rules(event);
  const resourceNames = resourcesOf(event, resources)
    .map((entry) => entry.resource.title)
    .join(", ");
  const name = [
    event.title,
    when,
    ...(occurrenceOf(event) ? [labels.repeats] : []),
    ...(resourceNames ? [resourceNames] : []),
  ].join(", ");
  const time = placed.allDay ? null : format.timeSpan(placed.start, placed.end);
  // A tap opens a toolbar on a touch screen, where there's no right click.
  const pointer = useRef<string>("mouse");

  const className = cx(
    "nuv-event-calendar__event",
    `nuv-event-calendar__event--${look}`,
    placed.allDay && "nuv-event-calendar__event--all-day",
    ownClassName,
    event.className,
  );
  // The timeline's bars have room for the time after the title.
  const along = edit.along;
  const resource = row === undefined ? undefined : (row ?? "");
  const colored = {
    "--nuv-event-color": colorOf(rule.color ?? color),
    ...style,
  } as CSSProperties;

  const content =
    look === "line" ? (
      <>
        <span className="nuv-event-calendar__event-dot" />
        <span className="nuv-event-calendar__event-time">
          {format.time(placed.start)}
        </span>
        <span className="nuv-event-calendar__event-title">{event.title}</span>
      </>
    ) : look === "item" ? (
      <>
        <span className="nuv-event-calendar__event-dot" />
        <span className="nuv-event-calendar__event-time">
          {time ?? labels.allDay}
        </span>
        <span className="nuv-event-calendar__event-title">{event.title}</span>
        {resourceNames ? (
          <span className="nuv-event-calendar__event-resource">
            {resourceNames}
          </span>
        ) : null}
        {event.description ? (
          <span className="nuv-event-calendar__event-description">
            {event.description}
          </span>
        ) : null}
      </>
    ) : (
      <>
        <span className="nuv-event-calendar__event-title">{event.title}</span>
        {time && (look === "block" || along) ? (
          <span className="nuv-event-calendar__event-time">{time}</span>
        ) : null}
      </>
    );

  // Where a dragged event would go: seen, and not heard, since the move is
  // said in words.
  if (placed.preview) {
    return (
      <div
        aria-hidden="true"
        data-event-id={event.id}
        data-resource={resource}
        data-preview=""
        data-starts-before={startsBefore ? "" : undefined}
        data-ends-after={endsAfter ? "" : undefined}
        className={cx(className, "nuv-event-calendar__event--preview")}
        style={colored}
      >
        {content}
      </div>
    );
  }

  // On the timeline, only where it is of the rows it's drawn in.
  const picked =
    edit.picked === event.id &&
    (row === undefined ||
      edit.pickedRow === undefined ||
      edit.pickedRow === row);
  const movable = canDrag(rule, edit.editable, "move");
  // Handles on the ends that can be dragged, where the event ends in view.
  const resizable = look === "block" || look === "bar";
  const startHandle =
    resizable && !startsBefore && canDrag(rule, edit.editable, "start");
  const endHandle =
    resizable && !endsAfter && canDrag(rule, edit.editable, "end");

  const onKeyDown = (key: KeyboardEvent<HTMLButtonElement>) => {
    const element = key.currentTarget;
    if (picked) {
      // Tab drops it where it is, and moves on.
      if (key.key === "Tab") {
        edit.drop();
        return;
      }
      // Day by day across the grid, and the time up and down on the time
      // grid, or a week at a time everywhere else. Along its row on the
      // timeline, and up and down to the next resource.
      const ahead = getComputedStyle(element).direction === "rtl" ? -1 : 1;
      const timed = look === "block";
      const step = edit.options.step;
      const back = (by: { minutes?: number; days?: number }, sign: number) => ({
        ...(by.minutes ? { minutes: by.minutes * sign } : null),
        ...(by.days ? { days: by.days * sign } : null),
      });
      const moves: Record<
        string,
        { minutes?: number; days?: number; rows?: number }
      > = along
        ? {
            ArrowUp: { rows: -1 },
            ArrowDown: { rows: 1 },
            ArrowLeft: back(along, -ahead),
            ArrowRight: back(along, ahead),
          }
        : {
            ArrowUp: timed ? { minutes: -step } : { days: -7 },
            ArrowDown: timed ? { minutes: step } : { days: 7 },
            ArrowLeft: { days: -ahead },
            ArrowRight: { days: ahead },
          };
      const move = moves[key.key];
      if (move) edit.nudge(move, key.shiftKey);
      else if (key.key === " " || key.key === "Enter") edit.drop();
      else if (key.key === "Escape") edit.putBack();
      else return;
      key.preventDefault();
      key.stopPropagation();
      return;
    }
    if (key.key === " " && movable) {
      key.preventDefault();
      edit.pick(placed, look, row);
    } else if (
      (key.key === "Delete" || key.key === "Backspace") &&
      edit.editable &&
      !rule.readOnly
    ) {
      key.preventDefault();
      edit.remove(event, element);
    }
  };

  return (
    <button
      type="button"
      tabIndex={tabbable || picked ? 0 : -1}
      aria-label={name}
      aria-pressed={picked ? true : undefined}
      data-event-id={event.id}
      data-resource={resource}
      data-dragging={edit.dragging === event.id ? "" : undefined}
      data-picked={picked ? "" : undefined}
      data-movable={movable ? "" : undefined}
      data-starts-before={startsBefore ? "" : undefined}
      data-ends-after={endsAfter ? "" : undefined}
      className={className}
      style={colored}
      onPointerDown={(down: ReactPointerEvent) => {
        pointer.current = down.pointerType;
      }}
      onKeyDown={onKeyDown}
      // Picked up and left for something else: it stays where it was put.
      onBlur={(blur) => {
        if (picked && blur.relatedTarget) edit.drop();
      }}
      // Space picks an event up, and isn't a press of it.
      onKeyUp={(key) => {
        if (key.key === " " && movable) key.preventDefault();
      }}
      onClick={(click) => {
        const element = click.currentTarget;
        onEventClick?.(event, element);
        // A click from the keyboard has no pointer, and a press of Enter
        // comes here too.
        const by =
          click.detail === 0
            ? "keyboard"
            : pointer.current === "touch"
              ? "touch"
              : "pointer";
        edit.open(event, element, by);
      }}
    >
      {content}
      {startHandle ? (
        <span
          aria-hidden="true"
          data-handle="start"
          className="nuv-event-calendar__handle nuv-event-calendar__handle--start"
        />
      ) : null}
      {endHandle ? (
        <span
          aria-hidden="true"
          data-handle="end"
          className="nuv-event-calendar__handle nuv-event-calendar__handle--end"
        />
      ) : null}
    </button>
  );
}
