import "@nuvui/react/styles.css";
import "@nuvui/date-picker/styles.css";
import "../../styles/index.scss";
import { axe, outsideLandmarks } from "@nuvui/tooling/test/axe";
import { setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { CalendarEvent } from "../../core/events";
import { EventTimeline } from "../event-timeline/event-timeline";
import {
  batchOf,
  type EventChanges,
  type EventDataSource,
  type EventRange,
} from "./data-source";
import { EventCalendar, type EventCalendarProps } from "./event-calendar";

// Every test is on Wednesday 14 October 2026, at half past ten, in UTC. The
// week shown is Sunday 11 to Saturday 17 October.
const today = new Date("2026-10-14T10:30:00Z");

const planning: CalendarEvent = {
  id: "planning",
  title: "Planning",
  start: "2026-10-14T10:00",
  end: "2026-10-14T12:00",
};
const review: CalendarEvent = {
  id: "review",
  title: "Review",
  start: "2026-10-21T09:00",
  end: "2026-10-21T10:00",
};

/** A promise to settle from the test. */
function later<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (error: unknown) => void = () => {};
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

let made = 0;

function Calendar(props: Partial<EventCalendarProps>) {
  return (
    <EventCalendar
      aria-label="Team calendar"
      timeZone="UTC"
      today={today}
      scrollToHour={8}
      defaultPanelOpen={false}
      confirmDelete={false}
      createId={() => {
        made += 1;
        return `new-${made}`;
      }}
      style={{ inlineSize: 1100 }}
      {...props}
    />
  );
}

/** The events that touch the days asked for, from a list. */
const from =
  (list: readonly CalendarEvent[]) =>
  async ({ from: first, to: last }: EventRange) =>
    list.filter(
      (event) =>
        String(event.start).slice(0, 10) <= last &&
        String(event.end).slice(0, 10) >= first,
    );

const ranges = (spy: { mock: { calls: readonly unknown[][] } }) =>
  spy.mock.calls.map((call) => {
    const range = call[0] as EventRange;
    return [range.from, range.to];
  });

const event = (name: string | RegExp) => page.getByRole("button", { name });
const popover = () => page.getByRole("dialog");
const status = () =>
  document.querySelector(".nuv-event-calendar__status-text")?.textContent ?? "";
const said = () =>
  document.querySelector(".nuv-event-calendar__announcer")?.textContent ?? "";
const view = () =>
  document.querySelector(".nuv-event-calendar__view") as HTMLElement;

beforeEach(async () => {
  await setViewport("desktop");
});

describe("loading by range", () => {
  test("the days shown are asked for once, and their events drawn when they come", async () => {
    const getEvents = vi.fn(from([planning]));
    await render(<Calendar dataSource={{ getEvents }} />);
    await expect.element(event(/^Planning/)).toBeVisible();
    expect(getEvents).toHaveBeenCalledTimes(1);
    const range = getEvents.mock.calls[0]?.[0] as EventRange;
    expect(range.from).toBe("2026-10-11");
    expect(range.to).toBe("2026-10-17");
    expect(range.start.toISOString()).toBe("2026-10-11T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-10-18T00:00:00.000Z");
    expect(range.signal).toBeInstanceOf(AbortSignal);
  });

  test("Next asks only for the days not loaded, and going back asks for none", async () => {
    const getEvents = vi.fn(from([planning, review]));
    await render(<Calendar dataSource={{ getEvents }} />);
    await expect.element(event(/^Planning/)).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();
    await expect.element(event(/^Review/)).toBeVisible();
    await page.getByRole("button", { name: "Previous" }).click();
    await expect.element(event(/^Planning/)).toBeVisible();
    expect(ranges(getEvents)).toEqual([
      ["2026-10-11", "2026-10-17"],
      ["2026-10-18", "2026-10-24"],
    ]);
  });

  test("a month asks for each part it doesn't have", async () => {
    const getEvents = vi.fn(from([planning]));
    await render(<Calendar dataSource={{ getEvents }} />);
    await expect.element(event(/^Planning/)).toBeVisible();
    await page.getByRole("radio", { name: "Month" }).click();
    await expect.poll(() => getEvents.mock.calls.length).toBe(3);
    expect(ranges(getEvents)).toEqual([
      ["2026-10-11", "2026-10-17"],
      ["2026-09-27", "2026-10-10"],
      ["2026-10-18", "2026-10-31"],
    ]);
  });

  test("while the days shown load, the header says so and they're busy", async () => {
    const reply = later<CalendarEvent[]>();
    await render(<Calendar dataSource={{ getEvents: () => reply.promise }} />);
    await expect.poll(status).toBe("Loading events");
    expect(view().getAttribute("aria-busy")).toBe("true");
    reply.resolve([planning]);
    await expect.element(event(/^Planning/)).toBeVisible();
    await expect.poll(status).toBe("");
    expect(view().hasAttribute("aria-busy")).toBe(false);
  });

  test("a failed load says so, and Try again asks again", async () => {
    const getEvents = vi
      .fn<EventDataSource["getEvents"]>()
      .mockRejectedValueOnce(new Error("Offline"))
      .mockImplementation(from([planning]));
    await render(<Calendar dataSource={{ getEvents }} />);
    await expect.poll(status).toBe("The events couldn't be loaded.");
    await page.getByRole("button", { name: "Try again" }).click();
    await expect.element(event(/^Planning/)).toBeVisible();
    await expect.poll(status).toBe("");
    expect(getEvents).toHaveBeenCalledTimes(2);
    await expect
      .element(page.getByRole("button", { name: "Try again" }))
      .not.toBeInTheDocument();
  });

  test("an event in two ranges is drawn once, as it was last loaded", async () => {
    const across: CalendarEvent = {
      id: "trip",
      title: "Trip",
      start: "2026-10-16",
      end: "2026-10-19",
      allDay: true,
    };
    const getEvents = vi
      .fn<EventDataSource["getEvents"]>()
      .mockResolvedValueOnce([across])
      .mockResolvedValueOnce([{ ...across, title: "Trip to Lisbon" }]);
    await render(<Calendar dataSource={{ getEvents }} />);
    await expect.element(event(/^Trip/)).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();
    await expect.element(event(/^Trip to Lisbon/)).toBeVisible();
    await page.getByRole("button", { name: "Previous" }).click();
    await expect.element(event(/^Trip to Lisbon/)).toBeVisible();
    expect(document.querySelectorAll('[data-event-id="trip"]').length).toBe(1);
  });

  test("another time zone asks for the days again, which are days there", async () => {
    const getEvents = vi.fn(from([planning]));
    const { rerender } = await render(<Calendar dataSource={{ getEvents }} />);
    await expect.element(event(/^Planning/)).toBeVisible();
    await rerender(
      <Calendar dataSource={{ getEvents }} timeZone="America/New_York" />,
    );
    await expect.poll(() => getEvents.mock.calls.length).toBe(2);
    const range = getEvents.mock.calls[1]?.[0] as EventRange;
    expect(range.from).toBe("2026-10-11");
    expect(range.start.toISOString()).toBe("2026-10-11T04:00:00.000Z");
  });

  test("the same functions in a new object load nothing again", async () => {
    const getEvents = vi.fn(from([planning]));
    const { rerender } = await render(<Calendar dataSource={{ getEvents }} />);
    await expect.element(event(/^Planning/)).toBeVisible();
    await rerender(<Calendar dataSource={{ getEvents }} />);
    await rerender(<Calendar dataSource={{ getEvents }} />);
    expect(getEvents).toHaveBeenCalledTimes(1);
  });

  test("a new getEvents starts from nothing", async () => {
    const first = vi.fn(from([planning]));
    const second = vi.fn(from([review]));
    const { rerender } = await render(
      <Calendar dataSource={{ getEvents: first }} />,
    );
    await expect.element(event(/^Planning/)).toBeVisible();
    await rerender(<Calendar dataSource={{ getEvents: second }} />);
    await expect.element(event(/^Planning/)).not.toBeInTheDocument();
    expect(ranges(second)).toEqual([["2026-10-11", "2026-10-17"]]);
  });

  test("what's being loaded is let go once the calendar has gone", async () => {
    const getEvents = vi.fn(() => later<CalendarEvent[]>().promise);
    const { unmount } = await render(<Calendar dataSource={{ getEvents }} />);
    await expect.poll(() => getEvents.mock.calls.length).toBe(1);
    const { signal } = (getEvents.mock.calls[0] as unknown as [EventRange])[0];
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });

  test("events and defaultEvents aren't read", async () => {
    await render(
      <Calendar
        dataSource={{ getEvents: async () => [] }}
        events={[planning]}
        defaultEvents={[planning]}
      />,
    );
    await expect.poll(status).toBe("");
    await expect.element(event(/^Planning/)).not.toBeInTheDocument();
  });

  test.for(themes)(
    "a failed load has no axe violations in %s",
    async (theme) => {
      const { container } = await renderThemed(
        theme,
        <Calendar
          dataSource={{ getEvents: () => Promise.reject(new Error("Down")) }}
        />,
      );
      await expect.poll(status).toBe("The events couldn't be loaded.");
      expect(await axe(container, outsideLandmarks)).toHaveNoViolations();
    },
  );
});

describe("saving", () => {
  test("a change is drawn at once and sent to saveEvents", async () => {
    const saveEvents = vi.fn(async (_changes: EventChanges) => {});
    await render(
      <Calendar dataSource={{ getEvents: from([planning]), saveEvents }} />,
    );
    (event(/^Planning/).element() as HTMLElement).focus();
    await userEvent.keyboard("{Delete}");
    await expect.element(event(/^Planning/)).not.toBeInTheDocument();
    await expect.poll(() => saveEvents.mock.calls.length).toBe(1);
    expect(saveEvents.mock.calls[0]?.[0]).toEqual({
      created: [],
      updated: [],
      deleted: [planning],
    });
  });

  test("a failed save takes the change back, and says so", async () => {
    const onEventsChange = vi.fn();
    await render(
      <Calendar
        onEventsChange={onEventsChange}
        dataSource={{
          getEvents: from([planning]),
          saveEvents: () => Promise.reject(new Error("Conflict")),
        }}
      />,
    );
    (event(/^Planning/).element() as HTMLElement).focus();
    await userEvent.keyboard("{Delete}");
    await expect.element(event(/^Planning/)).toBeVisible();
    await expect
      .poll(status)
      .toBe("The change couldn't be saved, so it was undone.");
    await expect
      .poll(said)
      .toBe("The change couldn't be saved, so it was undone.");
    // The app hears about the change, and then the one that undid it.
    expect(onEventsChange.mock.calls.map((call) => call[1].type)).toEqual([
      "delete",
      "create",
    ]);
    await page.getByRole("button", { name: "Close" }).click();
    await expect.poll(status).toBe("");
  });

  test("what saveEvents resolves with takes the place of what was sent", async () => {
    const saveEvents = vi.fn(async (changes: EventChanges) => ({
      created: changes.created.map((item) => ({
        ...(item as CalendarEvent),
        id: "from-server",
      })),
    }));
    await render(<Calendar dataSource={{ getEvents: from([]), saveEvents }} />);
    await expect.poll(status).toBe("");
    await page
      .getByRole("gridcell", { name: "Thursday, October 15, 2 PM" })
      .click({ position: { x: 5, y: 5 } });
    await userEvent.keyboard("Budget review");
    await popover().getByRole("button", { name: "Save" }).click();
    await expect
      .poll(() => document.querySelector('[data-event-id="from-server"]'))
      .not.toBeNull();
    expect(saveEvents.mock.calls[0]?.[0].created).toMatchObject([
      { title: "Budget review", start: "2026-10-15T14:00" },
    ]);
  });

  test("a load doesn't put back an event while its change is being saved", async () => {
    const saved = later<undefined>();
    await render(
      <Calendar
        dataSource={{
          // Every event, whatever the days asked for.
          getEvents: async () => [planning],
          saveEvents: () => saved.promise,
        }}
      />,
    );
    (event(/^Planning/).element() as HTMLElement).focus();
    await userEvent.keyboard("{Delete}");
    await page.getByRole("radio", { name: "Month" }).click();
    await expect.poll(status).toBe("");
    expect(document.querySelector('[data-event-id="planning"]')).toBeNull();
    saved.resolve(undefined);
  });

  test("without saveEvents, events open to be read", async () => {
    await render(<Calendar dataSource={{ getEvents: from([planning]) }} />);
    await event(/^Planning/).click();
    await expect.element(popover()).toBeVisible();
    await expect
      .element(popover().getByRole("textbox"))
      .not.toBeInTheDocument();
  });
});

describe("changes made together", () => {
  const a: CalendarEvent = { ...planning, id: "a" };
  const b: CalendarEvent = { ...planning, id: "b" };

  test("each kind is listed apart", () => {
    expect(
      batchOf([
        { type: "update", event: { ...a, title: "A" }, previous: a },
        { type: "create", event: b },
      ]),
    ).toEqual({ created: [b], updated: [{ ...a, title: "A" }], deleted: [] });
  });

  test("one made and then changed is made as it ended", () => {
    const changed = { ...b, title: "B" };
    expect(
      batchOf([
        { type: "create", event: b },
        { type: "update", event: changed, previous: b },
      ]),
    ).toEqual({ created: [changed], updated: [], deleted: [] });
  });

  test("one made and deleted is left out, and one changed and deleted is deleted", () => {
    expect(
      batchOf([
        { type: "create", event: b },
        { type: "update", event: { ...a, title: "A" }, previous: a },
        { type: "delete", event: b },
        { type: "delete", event: { ...a, title: "A" } },
      ]),
    ).toEqual({ created: [], updated: [], deleted: [{ ...a, title: "A" }] });
  });
});

describe("in the agenda", () => {
  test("with empty days left out, it loads further ahead for the next event", async () => {
    const getEvents = vi.fn(
      from([{ ...review, start: "2026-11-02T09:00", end: "2026-11-02T10:00" }]),
    );
    await render(
      <Calendar
        defaultView="agenda"
        defaultPreferences={{ showEmptyDays: false }}
        dataSource={{ getEvents }}
      />,
    );
    await expect
      .element(page.getByRole("button", { name: /^Go to/ }))
      .toBeVisible();
    expect(ranges(getEvents)).toEqual([
      ["2026-10-14", "2026-10-20"],
      ["2026-10-21", "2027-04-18"],
    ]);
  });
});

describe("the timeline", () => {
  test("it asks for the days of its period, and draws what comes", async () => {
    const getEvents = vi.fn(from([planning]));
    await render(
      <EventTimeline
        aria-label="Fleet"
        timeZone="UTC"
        today={today}
        dataSource={{ getEvents }}
        style={{ inlineSize: 1100 }}
      />,
    );
    await expect.element(event(/^Planning/)).toBeVisible();
    expect(ranges(getEvents)).toEqual([["2026-10-01", "2026-10-31"]]);
    await page.getByRole("button", { name: "Next" }).click();
    await expect.poll(() => getEvents.mock.calls.length).toBe(2);
    expect(ranges(getEvents)[1]).toEqual(["2026-11-01", "2026-11-30"]);
  });
});

describe("on the server", () => {
  test("drawn with no day given, nothing is loaded until the browser knows the day", async () => {
    const getEvents = vi.fn(from([]));
    const node = (
      <EventCalendar
        aria-label="Server calendar"
        timeZone="UTC"
        dataSource={{ getEvents }}
        defaultPanelOpen={false}
        style={{ inlineSize: 1100 }}
      />
    );
    const html = renderToString(node);
    expect(html).toContain("data-pending");
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    hydrateRoot(host, node);
    await expect.poll(() => getEvents.mock.calls.length).toBe(1);
    // The week the browser is on, and not the stand-in drawn before it knew.
    const range = getEvents.mock.calls[0]?.[0] as EventRange;
    const now = new Date().toISOString().slice(0, 10);
    expect(range.from <= now && now <= range.to).toBe(true);
    host.remove();
  });
});
