import type {
  CalendarEvent,
  EventChanges,
  EventDataSource,
  EventRange,
} from "@nuvui/scheduler";
import { teamEvents } from "./events";

// A server made up for the examples, holding the events in memory and
// answering after a wait, as a network would.

interface ServerOptions {
  /** Milliseconds before each answer. */
  delay?: number;
  /** Whether a load or a save fails, asked before each answers. */
  fails?: (kind: "load" | "save") => boolean;
}

const dayOf = (value: CalendarEvent["start"]) => String(value).slice(0, 10);

function wait(delay: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, delay);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

export function makeServer({
  delay = 800,
  fails = () => false,
}: ServerOptions = {}): EventDataSource {
  const stored = new Map(teamEvents.map((event) => [event.id, event]));
  return {
    getEvents: async ({ from, to, signal }: EventRange) => {
      await wait(delay, signal);
      if (fails("load")) throw new Error("The server didn't answer.");
      return [...stored.values()].filter(
        (event) => dayOf(event.start) <= to && dayOf(event.end) >= from,
      );
    },
    saveEvents: async ({ created, updated, deleted }: EventChanges) => {
      await wait(delay);
      if (fails("save")) throw new Error("The server didn't answer.");
      for (const event of [...created, ...updated]) {
        stored.set(event.id, event);
      }
      for (const event of deleted) stored.delete(event.id);
    },
  };
}
