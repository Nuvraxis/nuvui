import { useCallback, useEffect, useRef, useState } from "react";
import { addDays, type DayKey, momentOf } from "../../core/dates";
import {
  applyChange,
  type CalendarEvent,
  type EventChange,
} from "../../core/events";
import {
  type DayRange,
  mergeRanges,
  missingRanges,
  overlaps,
} from "../../core/ranges";

/** The days `getEvents` is asked for. */
export interface EventRange {
  /** The first day, as `yyyy-MM-dd`, in the time zone shown. */
  from: DayKey;
  /** The last day, included. */
  to: DayKey;
  /** The moment the first day starts, in the time zone shown. */
  start: Date;
  /** The moment the day after the last one starts. */
  end: Date;
  /** Aborted when the events are no longer wanted. Pass it to `fetch`. */
  signal: AbortSignal;
}

/** What changed, passed to `saveEvents`. */
export interface EventChanges<TEvent = CalendarEvent> {
  created: TEvent[];
  updated: TEvent[];
  deleted: TEvent[];
}

/**
 * What `saveEvents` can resolve with: the events as they were saved, in the
 * order they were passed, to replace those passed. Leave out what's the same.
 */
export interface SavedEvents<TEvent = CalendarEvent> {
  created?: readonly TEvent[];
  updated?: readonly TEvent[];
}

/** Where the events come from and go to, when they live on a server. */
export interface EventDataSource<TEvent extends object = CalendarEvent> {
  /**
   * Called for the events that touch any day of the range. Only days that
   * haven't been loaded are asked for, and what's loaded is kept. An event
   * that repeats is returned as its series when any of its occurrences is
   * in the range.
   */
  getEvents: (range: EventRange) => Promise<readonly TEvent[]>;
  /**
   * Called with what was made, changed and deleted. The change is shown at
   * once, and undone if the promise is rejected. Without it, events open to
   * be read, unless `onEventsChange` is passed.
   */
  saveEvents?: (changes: EventChanges<TEvent>) => Promise<SaveResult<TEvent>>;
}

// An async function that returns nothing gives a Promise<void>.
// biome-ignore lint/suspicious/noConfusingVoidType: what such a function returns
type SaveResult<TEvent> = SavedEvents<TEvent> | undefined | void;

interface Status {
  count: number;
  loading: readonly DayRange[];
  failed: readonly DayRange[];
  saveFailed: boolean;
}

const idle = (count: number): Status => ({
  count,
  loading: [],
  failed: [],
  saveFailed: false,
});

interface Request {
  range: DayRange;
  controller: AbortController;
}

interface Options {
  timeZone: string;
  first: DayKey;
  last: DayKey;
  /** An event of the app's, read under its own names. */
  read: (item: object) => CalendarEvent;
  /** An event written out under the app's own names. */
  write: (event: CalendarEvent) => object;
  /** A save failed, and these changes undid it. */
  onUndo: (events: CalendarEvent[], changes: EventChange[]) => void;
}

/** The change that takes another back. */
function inverse(change: EventChange): EventChange {
  switch (change.type) {
    case "create":
      return { type: "delete", event: change.event };
    case "delete":
      return { type: "create", event: change.event };
    default:
      return {
        type: "update",
        event: change.previous,
        previous: change.event,
      };
  }
}

/**
 * Changes made together, with those to the same event made one: one made
 * and then changed is made as it ended, and one made and deleted is left
 * out.
 */
export function batchOf(changes: readonly EventChange[]) {
  const created = new Map<string, CalendarEvent>();
  const updated = new Map<string, CalendarEvent>();
  const deleted = new Map<string, CalendarEvent>();
  for (const change of changes) {
    const { id } = change.event;
    if (change.type === "create") {
      created.set(id, change.event);
    } else if (change.type === "update") {
      if (created.has(id)) created.set(id, change.event);
      else updated.set(id, change.event);
    } else if (created.has(id)) {
      created.delete(id);
    } else {
      updated.delete(id);
      deleted.set(id, change.event);
    }
  }
  return {
    created: [...created.values()],
    updated: [...updated.values()],
    deleted: [...deleted.values()],
  };
}

const sameSource = (a: EventDataSource<object>, b: EventDataSource<object>) =>
  a.getEvents === b.getEvents && a.saveEvents === b.saveEvents;

/**
 * Events loaded a range at a time from the app's `dataSource`, and changes
 * sent back to it. Ranges are days in the time zone shown, so a new time
 * zone loads again. A new `getEvents` or `saveEvents` starts from nothing.
 */
export function useEventSource(
  dataSource: EventDataSource<object> | undefined,
  options: Options,
) {
  const { timeZone, first, last } = options;
  const latest = useRef(options);
  latest.current = options;

  // A new source is one with other functions, not a new object around the
  // same ones, which an app writing it inline would make on every render.
  const sourceRef = useRef(dataSource);
  if (
    !dataSource ||
    !sourceRef.current ||
    !sameSource(dataSource, sourceRef.current)
  ) {
    sourceRef.current = dataSource;
  }
  const source = sourceRef.current;
  const active = source !== undefined;

  // The events, in a ref so that a load and a change in the same moment
  // both see the other, and a count to draw them again.
  const events = useRef<CalendarEvent[]>([]);
  const [, setVersion] = useState(0);
  const redraw = useCallback(() => setVersion((count) => count + 1), []);

  const loaded = useRef<DayRange[]>([]);
  const requests = useRef<Request[]>([]);
  // What's loading and what failed, for the source and time zone it was
  // for: after a restart, what an older one said is left behind.
  const generation = useRef({
    source,
    timeZone,
    count: 0,
    restarts: [] as number[],
  });
  const [stored, setStored] = useState<Status>(() => idle(0));
  const setStatus = useCallback((change: (was: Status) => Status) => {
    const { count } = generation.current;
    setStored((was) => change(was.count === count ? was : idle(count)));
  }, []);
  const [attempt, setAttempt] = useState(0);
  // Events with a save on the way, which a load mustn't put back as they
  // were.
  const saving = useRef(new Map<string, number>());

  const showLoading = useCallback(() => {
    setStatus((was) => ({
      ...was,
      loading: requests.current.map((request) => request.range),
    }));
  }, [setStatus]);

  // Starts over: for a new source, everything, and for a new time zone, the
  // days loaded, which are days in that zone.
  if (generation.current.source !== source) {
    events.current = [];
  }
  const restart =
    generation.current.source !== source ||
    generation.current.timeZone !== timeZone;
  if (restart) {
    for (const request of requests.current) request.controller.abort();
    requests.current = [];
    loaded.current = [];
    const now = Date.now();
    const restarts = [
      ...generation.current.restarts.filter((at) => now - at < 2000),
      now,
    ];
    const count = generation.current.count + 1;
    if (restarts.length === 5 && typeof console !== "undefined") {
      console.warn(
        "@nuvui/scheduler: dataSource's getEvents or saveEvents is a new function on every render, so the events are loaded again each time. Make them once, outside the component or with useMemo or useCallback.",
      );
    }
    generation.current = { source, timeZone, count, restarts };
  }
  const status =
    stored.count === generation.current.count
      ? stored
      : idle(generation.current.count);

  const load = useCallback(
    (range: DayRange) => {
      const from = sourceRef.current;
      if (!from) return;
      const busy = [
        ...loaded.current,
        ...requests.current.map((request) => request.range),
      ];
      const missing = missingRanges(range, busy);
      if (missing.length === 0) return;
      setStatus((was) => ({
        ...was,
        failed: was.failed.filter(
          (failed) => !missing.some((part) => overlaps(part, failed)),
        ),
      }));
      for (const part of missing) {
        const controller = new AbortController();
        const request = { range: part, controller };
        requests.current = [...requests.current, request];
        const { timeZone: zone } = latest.current;
        let promise: Promise<readonly object[]>;
        try {
          promise = Promise.resolve(
            from.getEvents({
              from: part.from,
              to: part.to,
              start: momentOf(part.from, 0, zone),
              end: momentOf(addDays(part.to, 1), 0, zone),
              signal: controller.signal,
            }),
          );
        } catch (error) {
          promise = Promise.reject(error);
        }
        promise.then(
          (items) => {
            if (controller.signal.aborted) return;
            requests.current = requests.current.filter((r) => r !== request);
            loaded.current = mergeRanges([...loaded.current, part]);
            const { read } = latest.current;
            const fresh = new Map<string, CalendarEvent>();
            for (const item of items) {
              const event = read(item);
              if (!saving.current.has(event.id)) fresh.set(event.id, event);
            }
            const kept = events.current.map((event) => {
              const next = fresh.get(event.id);
              if (next) fresh.delete(event.id);
              return next ?? event;
            });
            events.current = [...kept, ...fresh.values()];
            showLoading();
            redraw();
          },
          () => {
            if (controller.signal.aborted) return;
            requests.current = requests.current.filter((r) => r !== request);
            setStatus((was) => ({
              ...was,
              loading: requests.current.map((r) => r.range),
              failed: [...was.failed, part],
            }));
          },
        );
      }
      showLoading();
    },
    [redraw, showLoading, setStatus],
  );

  // The days shown, whenever they change, and again after Try again.
  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt asks for the same days again
  useEffect(() => {
    if (source) load({ from: first, to: last });
  }, [source, timeZone, first, last, attempt, load]);

  // Nothing is asked for once the component has gone.
  useEffect(
    () => () => {
      for (const request of requests.current) request.controller.abort();
      requests.current = [];
    },
    [],
  );

  // Changes made in the same moment, such as the two that end a series and
  // start another, are saved together.
  const queue = useRef<EventChange[]>([]);
  const flush = useCallback(() => {
    const changes = queue.current;
    queue.current = [];
    const save = sourceRef.current?.saveEvents;
    if (!save || changes.length === 0) return;
    const batch = batchOf(changes);
    const ids = [...batch.created, ...batch.updated, ...batch.deleted].map(
      (event) => event.id,
    );
    for (const id of ids) {
      saving.current.set(id, (saving.current.get(id) ?? 0) + 1);
    }
    const done = () => {
      for (const id of ids) {
        const count = (saving.current.get(id) ?? 1) - 1;
        if (count > 0) saving.current.set(id, count);
        else saving.current.delete(id);
      }
    };
    const { write } = latest.current;
    let promise: Promise<SaveResult<object>>;
    try {
      promise = Promise.resolve(
        save({
          created: batch.created.map(write),
          updated: batch.updated.map(write),
          deleted: batch.deleted.map(write),
        }),
      );
    } catch (error) {
      promise = Promise.reject(error);
    }
    promise.then(
      (saved) => {
        done();
        setStatus((was) =>
          was.saveFailed ? { ...was, saveFailed: false } : was,
        );
        if (!saved) return;
        const { read } = latest.current;
        // The server's own version of each, by the id it was sent with.
        const replace = new Map<string, CalendarEvent>();
        saved.created?.forEach((item, index) => {
          const sent = batch.created[index];
          if (sent) replace.set(sent.id, read(item));
        });
        saved.updated?.forEach((item, index) => {
          const sent = batch.updated[index];
          if (sent) replace.set(sent.id, read(item));
        });
        if (replace.size === 0) return;
        events.current = events.current.map(
          (event) => replace.get(event.id) ?? event,
        );
        redraw();
      },
      () => {
        done();
        const undo = [...changes].reverse().map(inverse);
        let next = events.current;
        for (const change of undo) next = applyChange(next, change);
        events.current = next;
        setStatus((was) => ({ ...was, saveFailed: true }));
        redraw();
        latest.current.onUndo(next, undo);
      },
    );
  }, [redraw, setStatus]);

  /** Shows a change at once, and sends it to be saved. */
  const apply = useCallback(
    (change: EventChange) => {
      events.current = applyChange(events.current, change);
      redraw();
      if (queue.current.length === 0) queueMicrotask(flush);
      queue.current.push(change);
      return events.current;
    },
    [flush, redraw],
  );

  const shown = { from: first, to: last };
  const loading = status.loading.some((range) => overlaps(range, shown));
  const failed = !loading && status.failed.some((r) => overlaps(r, shown));

  return {
    active,
    canSave: source?.saveEvents !== undefined,
    events: events.current,
    /** The days shown are loading. */
    loading,
    /** Anything at all is loading. */
    busy: status.loading.length > 0,
    failed,
    saveFailed: status.saveFailed,
    load,
    apply,
    retry: () => setAttempt((count) => count + 1),
    dismiss: () => setStatus((was) => ({ ...was, saveFailed: false })),
  };
}
