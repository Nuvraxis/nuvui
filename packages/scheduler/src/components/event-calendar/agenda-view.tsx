import { Button } from "@nuvui/react/button";
import { useMemo } from "react";
import { addDays, type DayKey } from "../../core/dates";
import { type CalendarEvent, eventsOn, placeEvents } from "../../core/events";
import { cx } from "../../utils/cx";
import { useCalendar, type ViewProps } from "./context";
import { EventButton } from "./event-button";

/** How far ahead an empty agenda looks for the next day with an event. */
const ahead = 180;

interface AgendaViewProps extends ViewProps {
  events: readonly CalendarEvent[];
}

/** The events as a list, day by day. */
export function AgendaView({ days, placed, label, events }: AgendaViewProps) {
  const {
    timeZone,
    today,
    format,
    labels,
    preferences,
    headingLevel,
    id,
    setDate,
  } = useCalendar();
  const Heading = `h${headingLevel + 1}` as "h3";
  // The calendar always gives the agenda a day at least.
  const first = days[0] as DayKey;
  const last = days[days.length - 1] as DayKey;

  const groups = days
    .map((day) => ({
      day,
      items: eventsOn(placed, day).filter((item) => !item.preview),
    }))
    .filter((group) => preferences.showEmptyDays || group.items.length > 0);

  // Only worked out when the days shown are empty and left out.
  const empty = groups.length === 0;
  const next = useMemo(() => {
    if (!empty) return null;
    const from = addDays(last, 1);
    const upcoming = placeEvents(events, timeZone, from, addDays(last, ahead));
    const firstDay = upcoming[0]?.firstDay;
    if (!firstDay) return null;
    return firstDay < from ? from : firstDay;
  }, [empty, events, timeZone, last]);

  return (
    <section aria-label={label} className="nuv-event-calendar__agenda">
      {empty ? (
        <div className="nuv-event-calendar__empty">
          <p className="nuv-event-calendar__empty-text">
            {labels.nothingBetween(format.day(first), format.day(last))}
          </p>
          {next ? (
            <Button intent="secondary" size="sm" onClick={() => setDate(next)}>
              {labels.nextEvent(format.day(next))}
            </Button>
          ) : (
            <p className="nuv-event-calendar__empty-text">
              {labels.nothingAhead}
            </p>
          )}
        </div>
      ) : (
        groups.map(({ day, items }) => (
          <section
            key={day}
            aria-labelledby={`${id}-${day}`}
            className={cx(
              "nuv-event-calendar__agenda-day",
              day === today && "nuv-event-calendar__agenda-day--today",
            )}
          >
            <Heading
              id={`${id}-${day}`}
              className="nuv-event-calendar__agenda-heading"
              aria-current={day === today ? "date" : undefined}
            >
              {format.day(day)}
            </Heading>
            {items.length > 0 ? (
              <ul className="nuv-event-calendar__list">
                {items.map((item) => (
                  <li key={item.event.id}>
                    <EventButton placed={item} look="item" tabbable />
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))
      )}
    </section>
  );
}
