"use client";

import {
  Field,
  FieldControl,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@nuvui/react";
import {
  type CalendarEvent,
  EventCalendar,
  type EventChanges,
  type EventDataSource,
  type EventRange,
} from "@nuvui/scheduler";
import { useId, useMemo, useRef, useState } from "react";
import "./workshop-bookings.scss";

// A server made up for the block. Every weekday has bookings, made from the
// day itself, so any week the calendar goes to has some. What's changed is
// kept beside them, as a database would.

const services = [
  { title: "Annual service", minutes: 120, color: "1" },
  { title: "Brake pads and discs", minutes: 90, color: "2" },
  { title: "Tyres, all four", minutes: 60, color: "3" },
  { title: "Battery check", minutes: 30, color: "4" },
  { title: "Air conditioning regas", minutes: 60, color: "5" },
  { title: "Diagnostic scan", minutes: 45, color: "6" },
] as const;

const customers = [
  "Imogen Vale",
  "Teodor Brask",
  "Sunniva Holt",
  "Okello Marr",
  "Priya Venn",
  "Ansel Quade",
  "Marisol Teague",
  "Halvard Linde",
];

const pad = (value: number) => String(value).padStart(2, "0");
const keyOf = (date: Date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

/** The same number for the same text, to pick a day's bookings by. */
function seed(text: string) {
  let hash = 7;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) % 9973;
  return hash;
}

/** A day's bookings, the same each time it's asked for. */
function bookingsOn(day: string): CalendarEvent[] {
  const date = new Date(`${day}T12:00:00Z`);
  const weekday = date.getUTCDay();
  if (weekday === 0 || weekday === 6) return [];
  const base = seed(day);
  const count = 2 + (base % 3);
  // Bays open at eight, and a booking starts on the hour or the half hour.
  let minute = 8 * 60 + (base % 2) * 30;
  const list: CalendarEvent[] = [];
  for (let slot = 0; slot < count; slot += 1) {
    const service = services[(base + slot * 5) % services.length];
    const customer = customers[(base + slot * 3) % customers.length];
    if (!service || !customer) continue;
    const end = minute + service.minutes;
    if (end > 17 * 60) break;
    const time = (at: number) => `${pad(Math.floor(at / 60))}:${pad(at % 60)}`;
    list.push({
      id: `${day}-${slot}`,
      title: `${service.title}, ${customer}`,
      start: `${day}T${time(minute)}`,
      end: `${day}T${time(end)}`,
      color: service.color,
    });
    minute = end + 30 * (1 + ((base + slot) % 3));
  }
  return list;
}

const daysOf = (range: EventRange) => {
  const days: string[] = [];
  const at = new Date(`${range.from}T12:00:00Z`);
  for (let key = range.from; key <= range.to; key = keyOf(at)) {
    days.push(key);
    at.setUTCDate(at.getUTCDate() + 1);
  }
  return days;
};

const dayOfEvent = (event: CalendarEvent) => String(event.start).slice(0, 10);

const shortDay = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const spanOf = (range: EventRange) =>
  range.from === range.to
    ? shortDay.format(new Date(`${range.from}T12:00:00Z`))
    : `${shortDay.format(new Date(`${range.from}T12:00:00Z`))} to ${shortDay.format(new Date(`${range.to}T12:00:00Z`))}`;

const delays = [
  { value: "300", label: "Fast, 0.3 seconds" },
  { value: "1500", label: "Slow, 1.5 seconds" },
  { value: "4000", label: "Very slow, 4 seconds" },
];

interface Entry {
  id: number;
  text: string;
  failed: boolean;
}

const plural = (count: number, one: string) =>
  `${count} ${count === 1 ? one : `${one}s`}`;

export default function WorkshopBookings() {
  const id = useId();
  const [delay, setDelay] = useState("1500");
  const [failNext, setFailNext] = useState(false);
  const [log, setLog] = useState<Entry[]>([]);

  // Read when a request is made, so the source keeps the same functions and
  // what's loaded is kept.
  const settings = useRef({ delay, failNext });
  settings.current = { delay, failNext };
  const changed = useRef(new Map<string, CalendarEvent | null>());
  const count = useRef(0);

  const dataSource = useMemo<EventDataSource>(() => {
    const note = (text: string, failed = false) => {
      count.current += 1;
      const entry = { id: count.current, text, failed };
      setLog((was) => [entry, ...was].slice(0, 8));
    };
    // Waits as a network would, and fails once when asked to.
    const answer = (signal?: AbortSignal) =>
      new Promise<boolean>((resolve, reject) => {
        const fail = settings.current.failNext;
        if (fail) setFailNext(false);
        const timer = setTimeout(
          () => resolve(fail),
          Number(settings.current.delay),
        );
        signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(signal.reason);
        });
      });

    return {
      getEvents: async (range) => {
        const failed = await answer(range.signal);
        if (failed) {
          note(`Couldn't load ${spanOf(range)}`, true);
          throw new Error("The workshop's server didn't answer.");
        }
        const days = new Set(daysOf(range));
        const found = [...days].flatMap(bookingsOn).filter((event) => {
          const now = changed.current.get(event.id);
          return now !== null;
        });
        const merged = found.map(
          (event) => changed.current.get(event.id) ?? event,
        );
        // Those made in the calendar, and those moved into these days.
        for (const [key, event] of changed.current) {
          if (!event || !days.has(dayOfEvent(event))) continue;
          if (!merged.some((item) => item.id === key)) merged.push(event);
        }
        const shown = merged.filter((event) => days.has(dayOfEvent(event)));
        note(`Loaded ${spanOf(range)}: ${plural(shown.length, "booking")}`);
        return shown;
      },
      saveEvents: async ({ created, updated, deleted }: EventChanges) => {
        const failed = await answer();
        const total = created.length + updated.length + deleted.length;
        if (failed) {
          note(`Couldn't save ${plural(total, "change")}`, true);
          throw new Error("The workshop's server didn't answer.");
        }
        for (const event of [...created, ...updated]) {
          changed.current.set(event.id, event as CalendarEvent);
        }
        for (const event of deleted) {
          changed.current.set((event as CalendarEvent).id, null);
        }
        note(`Saved ${plural(total, "change")}`);
      },
    };
  }, []);

  return (
    <main className="workshop-bookings">
      <header className="workshop-bookings__head">
        <div className="workshop-bookings__heading">
          <h1 className="workshop-bookings__title">Workshop bookings</h1>
          <p className="workshop-bookings__meta">
            Each week is loaded from the server when it's first shown, and kept.
            Changes are drawn at once and taken back if they can't be saved.
          </p>
        </div>
        <div className="workshop-bookings__controls">
          <Field className="workshop-bookings__delay">
            <FieldLabel>Server speed</FieldLabel>
            <Select value={delay} onValueChange={setDelay}>
              <FieldControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FieldControl>
              <SelectContent>
                {delays.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="workshop-bookings__fail">
            <label htmlFor={`${id}-fail`}>Fail the next request</label>
            <Switch
              id={`${id}-fail`}
              checked={failNext}
              onCheckedChange={setFailNext}
            />
          </div>
        </div>
      </header>

      <div className="workshop-bookings__layout">
        <EventCalendar
          aria-label="Workshop bookings"
          dataSource={dataSource}
          views={["day", "week", "month", "agenda"]}
          hours={[7, 19]}
          scrollToHour={8}
          step={15}
          defaultPanelOpen={false}
          defaultPreferences={{ showWeekends: false }}
          eventFields={["title", "time", "color", "description"]}
          className="workshop-bookings__calendar"
        />

        <aside
          className="workshop-bookings__side"
          aria-labelledby={`${id}-log`}
        >
          <h2 className="workshop-bookings__subtitle" id={`${id}-log`}>
            Requests
          </h2>
          {log.length > 0 ? (
            <ol className="workshop-bookings__log">
              {log.map((entry) => (
                <li
                  key={entry.id}
                  className="workshop-bookings__entry"
                  data-failed={entry.failed ? "" : undefined}
                >
                  {entry.text}
                </li>
              ))}
            </ol>
          ) : (
            <p className="workshop-bookings__hint">Waiting for the first.</p>
          )}
        </aside>
      </div>
    </main>
  );
}
