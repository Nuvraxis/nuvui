import type { CSSProperties } from "react";
import type { PlacedEvent } from "../../core/events";
import type { Formatters } from "../../core/format";
import type { SchedulerLabels } from "../../core/labels";
import { cx } from "../../utils/cx";
import { useCalendar } from "./context";

// The chart colors by their number. Anything else is a CSS color already.
function colorOf(color: string | undefined): string | undefined {
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

export interface EventButtonProps {
  placed: PlacedEvent;
  /**
   * `block` on the time grid, `bar` across days, `line` for a timed event
   * in a month, `item` in a list.
   */
  look: "block" | "bar" | "line" | "item";
  tabbable: boolean;
  /** It began before the part of it drawn here. */
  startsBefore?: boolean;
  /** It goes on after the part of it drawn here. */
  endsAfter?: boolean;
  style?: CSSProperties;
}

export function EventButton({
  placed,
  look,
  tabbable,
  startsBefore = false,
  endsAfter = false,
  style,
}: EventButtonProps) {
  const { format, labels, color, onEventClick } = useCalendar();
  const { event } = placed;
  const when = timeOf(placed, format, labels);
  const time = placed.allDay ? null : format.timeSpan(placed.start, placed.end);

  return (
    <button
      type="button"
      tabIndex={tabbable ? 0 : -1}
      aria-label={`${event.title}, ${when}`}
      data-event-id={event.id}
      data-starts-before={startsBefore ? "" : undefined}
      data-ends-after={endsAfter ? "" : undefined}
      className={cx(
        "nuv-event-calendar__event",
        `nuv-event-calendar__event--${look}`,
        placed.allDay && "nuv-event-calendar__event--all-day",
        event.className,
      )}
      style={
        {
          "--nuv-event-color": colorOf(event.color ?? color),
          ...style,
        } as CSSProperties
      }
      onClick={(click) => onEventClick?.(event, click.currentTarget)}
    >
      {look === "line" ? (
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
          {event.description ? (
            <span className="nuv-event-calendar__event-description">
              {event.description}
            </span>
          ) : null}
        </>
      ) : (
        <>
          <span className="nuv-event-calendar__event-title">{event.title}</span>
          {time && look === "block" ? (
            <span className="nuv-event-calendar__event-time">{time}</span>
          ) : null}
        </>
      )}
    </button>
  );
}
