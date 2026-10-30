import "@nuvui/react/styles.css";
import "@nuvui/date-picker/styles.css";
import "../../styles/index.scss";
import { DirectionProvider } from "@nuvui/react/direction";
import { axe, outsideLandmarks } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import type { CSSProperties } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { CalendarEvent, EventChange } from "../../core/events";
import type { CalendarResource } from "../../core/resources";
import { EventTimeline, type EventTimelineProps } from "./event-timeline";

// Every test is on Wednesday 14 October 2026, at half past ten, in UTC.
const today = new Date("2026-10-14T10:30:00Z");

const resources: CalendarResource[] = [
  {
    id: "north",
    title: "North depot",
    color: "2",
    children: [
      { id: "van-1", title: "Van 1" },
      { id: "van-2", title: "Van 2" },
    ],
  },
  { id: "van-3", title: "Van 3", color: "5" },
];

const trip: CalendarEvent = {
  id: "trip",
  title: "Trip",
  start: "2026-10-14T09:00",
  end: "2026-10-15T17:00",
  resourceIds: ["van-1"],
};
const service: CalendarEvent = {
  id: "service",
  title: "Service",
  start: "2026-10-14",
  end: "2026-10-15",
  allDay: true,
  resourceIds: ["van-2"],
};
const inspection: CalendarEvent = {
  id: "inspection",
  title: "Inspection",
  start: "2026-10-16",
  end: "2026-10-16",
  allDay: true,
  resourceIds: ["van-1", "van-3"],
};
const spare: CalendarEvent = {
  id: "spare",
  title: "Spare run",
  start: "2026-10-13",
  end: "2026-10-13",
  allDay: true,
};

let made = 0;

function Timeline(props: Partial<EventTimelineProps>) {
  return (
    <EventTimeline
      aria-label="Fleet"
      defaultEvents={[trip, service, inspection, spare]}
      resources={resources}
      timeZone="UTC"
      today={today}
      createId={() => {
        made += 1;
        return `new-${made}`;
      }}
      style={{ inlineSize: 1100 }}
      {...props}
    />
  );
}

const box = (element: Element) => element.getBoundingClientRect();
const heading = () => page.getByRole("heading", { level: 2 });
const event = (name: string | RegExp) => page.getByRole("button", { name });
const row = (name: string) => page.getByRole("rowheader", { name });
const cell = (name: string) => page.getByRole("gridcell", { name });
const focused = () => document.activeElement;
const focusedName = () => focused()?.getAttribute("aria-label");
const said = () =>
  document.querySelector(".nuv-event-calendar__announcer")?.textContent ?? "";
const changes = (spy: ReturnType<typeof vi.fn>) =>
  spy.mock.calls.map((call) => call[1] as EventChange);
const intoGrid = () =>
  (
    page
      .getByRole("grid")
      .element()
      .querySelector('[role="gridcell"][tabindex="0"]') as HTMLElement
  ).focus();

beforeEach(async () => {
  await setViewport("desktop");
});

describe("rows", () => {
  test("a row for each resource, and one for the events with none", async () => {
    await render(<Timeline />);
    for (const name of [
      "North depot",
      "Van 1",
      "Van 2",
      "Van 3",
      "No resource",
    ]) {
      await expect.element(row(name)).toBeInTheDocument();
    }
    const grid = page.getByRole("grid").element();
    // Two rows of the header, and five of resources.
    expect(grid).toHaveAttribute("aria-rowcount", "7");
    // The resources, and a day of October in each column.
    expect(grid).toHaveAttribute("aria-colcount", "32");
  });

  test("the row for none is only there when an event has none", async () => {
    await render(<Timeline defaultEvents={[trip, service]} />);
    await expect.element(row("Van 1")).toBeInTheDocument();
    await expect.element(row("No resource")).not.toBeInTheDocument();
  });

  test("an event is named by its resources, and drawn in the row of each", async () => {
    await render(<Timeline />);
    const both = page
      .getByRole("button", { name: /^Inspection, .*, Van 1, Van 3$/ })
      .elements();
    expect(both.map((button) => button.dataset.resource)).toEqual([
      "van-1",
      "van-3",
    ]);
  });

  test("take their color from their resource, or the one they're in", async () => {
    await render(<Timeline />);
    const color = (name: RegExp) =>
      (event(name).element() as HTMLElement).style.getPropertyValue(
        "--nuv-event-color",
      );
    expect(color(/^Trip/)).toBe("var(--color-chart-2)");
    expect(color(/^Spare run/)).toBe("var(--color-chart-1)");
  });

  test("events that overlap in a row are in lanes, and the row is as tall as they need", async () => {
    await render(
      <Timeline
        defaultEvents={[
          trip,
          { ...service, id: "service-2", resourceIds: ["van-1"] },
        ]}
      />,
    );
    const one = box(event(/^Trip/).element());
    const two = box(event(/^Service/).element());
    expect(Math.abs(one.top - two.top)).toBeGreaterThanOrEqual(two.height);
    expect(box(row("Van 1").element()).height).toBeGreaterThan(
      box(row("Van 3").element()).height,
    );
  });

  test("a folded resource hides the rows inside it, and their events", async () => {
    const onCollapsed = vi.fn();
    await render(<Timeline onCollapsedResourcesChange={onCollapsed} />);
    const fold = page.getByRole("button", { name: "Resources in North depot" });
    await expect.element(fold).toHaveAttribute("aria-expanded", "true");
    await fold.click();
    await expect.element(fold).toHaveAttribute("aria-expanded", "false");
    expect(onCollapsed).toHaveBeenLastCalledWith(["north"]);
    await expect.element(row("Van 1")).not.toBeInTheDocument();
    await expect.element(event(/^Trip/)).not.toBeInTheDocument();
    // Still in Van 3's.
    await expect.element(event(/^Inspection/)).toBeInTheDocument();
  });

  test("renderResource draws a row with the app's own resource, and the title still names it", async () => {
    await render(
      <EventTimeline
        aria-label="Fleet"
        timeZone="UTC"
        today={today}
        resources={[{ key: "v1", name: "Van 1", plate: "KP 4410" }]}
        resourceKeys={{ id: "key", title: "name" }}
        renderResource={(resource) => resource.plate}
      />,
    );
    await expect.element(row("Van 1")).toHaveTextContent("KP 4410");
  });
});

describe("scales", () => {
  test("days by default, with the month in the heading and over the days", async () => {
    await render(<Timeline />);
    await expect.element(heading()).toHaveTextContent("October 2026");
    await expect
      .element(page.getByRole("columnheader", { name: "October 2026" }))
      .toBeInTheDocument();
    await expect
      .element(
        page.getByRole("columnheader", { name: "Wednesday, October 14" }),
      )
      .toHaveAttribute("aria-current", "date");
  });

  test("the header switches between them, each with its own period", async () => {
    const onScaleChange = vi.fn();
    await render(<Timeline onScaleChange={onScaleChange} />);
    const scale = (name: string) => page.getByRole("radio", { name });
    await scale("Hours").click();
    expect(onScaleChange).toHaveBeenLastCalledWith("hours");
    await expect.element(heading()).toHaveTextContent("October 14 – 16, 2026");
    await scale("Weeks").click();
    await expect
      .element(heading())
      .toHaveTextContent("October – December 2026");
    await scale("Months").click();
    await expect.element(heading()).toHaveTextContent("2026");
    await scale("Years").click();
    await expect.element(heading()).toHaveTextContent("2020 – 2029");
  });

  test("scales limits the choice, and with one there's no switch", async () => {
    const { rerender } = await render(<Timeline scales={["days", "weeks"]} />);
    await expect
      .element(page.getByRole("radio", { name: "Hours" }))
      .not.toBeInTheDocument();
    await rerender(<Timeline scales={["days"]} />);
    await expect
      .element(page.getByRole("radiogroup", { name: "Scale" }))
      .not.toBeInTheDocument();
  });

  test("spans says how much each shows", async () => {
    await render(<Timeline defaultScale="days" spans={{ days: 3 }} />);
    await expect
      .element(heading())
      .toHaveTextContent("October – December 2026");
    expect(page.getByRole("grid").element()).toHaveAttribute(
      "aria-colcount",
      String(1 + 31 + 30 + 31),
    );
  });

  test("previous, next and today move by the period", async () => {
    await render(<Timeline />);
    await page.getByRole("button", { name: "Next" }).click();
    await expect.element(heading()).toHaveTextContent("November 2026");
    await page.getByRole("button", { name: "Previous" }).click();
    await page.getByRole("button", { name: "Previous" }).click();
    await expect.element(heading()).toHaveTextContent("September 2026");
    await page.getByRole("button", { name: "Today" }).click();
    await expect.element(heading()).toHaveTextContent("October 2026");
  });
});

describe("hours", () => {
  test("shows only the hours asked for, cuts an event at their edge, and leaves out one wholly outside", async () => {
    await render(
      <Timeline
        defaultScale="hours"
        hours={[8, 18]}
        defaultEvents={[
          {
            id: "late",
            title: "Late run",
            start: "2026-10-14T17:00",
            end: "2026-10-14T19:00",
            resourceIds: ["van-1"],
          },
          {
            id: "night",
            title: "Night run",
            start: "2026-10-14T20:00",
            end: "2026-10-14T22:00",
            resourceIds: ["van-1"],
          },
        ]}
      />,
    );
    // Three days of ten hours.
    expect(page.getByRole("grid").element()).toHaveAttribute(
      "aria-colcount",
      "31",
    );
    await expect
      .element(event(/^Late run/))
      .toHaveAttribute("data-ends-after", "");
    await expect.element(event(/^Night run/)).not.toBeInTheDocument();
  });

  test("marks the time now", async () => {
    await render(<Timeline defaultScale="hours" />);
    const now = page
      .getByRole("grid")
      .element()
      .querySelector(".nuv-event-timeline__now") as HTMLElement;
    expect(now.style.getPropertyValue("--nuv-event-at")).toBe("10.5");
  });
});

describe("many resources", () => {
  const machines = Array.from({ length: 1000 }, (_, index) => ({
    id: `m${index + 1}`,
    title: `Machine ${index + 1}`,
  }));

  test("only the rows in view are drawn, and the rest as it scrolls", async () => {
    await render(<Timeline resources={machines} defaultEvents={[]} />);
    const grid = page.getByRole("grid").element() as HTMLElement;
    expect(grid).toHaveAttribute("aria-rowcount", String(2 + 1000));
    const drawn = () =>
      grid.querySelectorAll(
        '[role="rowgroup"] + [role="rowgroup"] [role="row"]',
      ).length;
    expect(drawn()).toBeLessThan(100);
    grid.scrollTop = grid.scrollHeight;
    await expect.element(row("Machine 1000")).toBeInTheDocument();
    expect(drawn()).toBeLessThan(100);
  });

  test("only the columns in view are drawn", async () => {
    await render(<Timeline spans={{ days: 24 }} defaultEvents={[]} />);
    const grid = page.getByRole("grid").element();
    expect(Number(grid.getAttribute("aria-colcount"))).toBeGreaterThan(700);
    expect(
      grid.querySelectorAll('[role="columnheader"][aria-colindex]').length,
    ).toBeLessThan(80);
  });
});

describe("keyboard", () => {
  test("the arrows move through the grid, a cell at a time in the tab order", async () => {
    await render(<Timeline />);
    intoGrid();
    expect(focusedName()).toBe("North depot, Wednesday, October 14");
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(focusedName).toBe("Van 1, Wednesday, October 14");
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(focusedName).toBe("Van 1, Thursday, October 15");
    expect(
      page
        .getByRole("grid")
        .element()
        .querySelectorAll('[role="gridcell"][tabindex="0"]').length,
    ).toBe(1);
  });

  test("Home and End go to the ends of the row, and on from the first to its resource", async () => {
    await render(<Timeline />);
    intoGrid();
    await userEvent.keyboard("{ArrowDown}{End}");
    await expect.poll(focusedName).toBe("Van 1, Saturday, October 31");
    await userEvent.keyboard("{Home}");
    await expect.poll(focusedName).toBe("Van 1, Thursday, October 1");
    await userEvent.keyboard("{ArrowLeft}");
    await expect.poll(focusedName).toBe("Van 1");
    await userEvent.keyboard("{ArrowUp}");
    await expect
      .poll(() => focused()?.getAttribute("aria-label"))
      .toBe("Resources in North depot");
  });

  test("Tab goes on from a cell to the events that start in it", async () => {
    await render(<Timeline />);
    intoGrid();
    await userEvent.keyboard("{ArrowDown}{Tab}");
    await expect.poll(focusedName).toMatch(/^Trip, /);
  });

  test("the arrows follow the page where it reads right to left", async () => {
    await render(
      <DirectionProvider dir="rtl">
        <div dir="rtl">
          <Timeline />
        </div>
      </DirectionProvider>,
    );
    intoGrid();
    await userEvent.keyboard("{ArrowLeft}");
    await expect.poll(focusedName).toBe("North depot, Thursday, October 15");
  });

  test("the cell with keyboard focus has a ring that stands out", async () => {
    await render(<Timeline />);
    intoGrid();
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(focusedName).toBe("Van 1, Wednesday, October 14");
    expect(getComputedStyle(focused() as Element).boxShadow).not.toBe("none");
  });

  test("an event picked up moves along its row a day at a time, and up and down to the next resource", async () => {
    const onEventsChange = vi.fn();
    await render(<Timeline onEventsChange={onEventsChange} events={[trip]} />);
    (event(/^Trip/).element() as HTMLElement).focus();
    await userEvent.keyboard(" ");
    await expect
      .element(event(/^Trip/))
      .toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(said).toBe("Van 2");
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .poll(focusedName)
      .toMatch(/^Trip, .*Thursday, October 15.*, Van 2$/);
    await userEvent.keyboard("{Enter}");
    expect(changes(onEventsChange)).toEqual([
      {
        type: "update",
        event: {
          ...trip,
          start: "2026-10-15T09:00",
          end: "2026-10-16T17:00",
          resourceIds: ["van-2"],
        },
        previous: trip,
      },
    ]);
  });

  test("on the hours scale, an event moves by the step", async () => {
    const onEventsChange = vi.fn();
    await render(
      <Timeline
        defaultScale="hours"
        step={30}
        onEventsChange={onEventsChange}
        events={[trip]}
      />,
    );
    (event(/^Trip/).element() as HTMLElement).focus();
    await userEvent.keyboard(" {ArrowRight}{Enter}");
    expect(changes(onEventsChange)[0]?.event).toMatchObject({
      start: "2026-10-14T09:30",
      end: "2026-10-15T17:30",
    });
  });

  test("Escape puts an event back in the row it was picked up from", async () => {
    const onEventsChange = vi.fn();
    await render(<Timeline onEventsChange={onEventsChange} events={[trip]} />);
    (event(/^Trip/).element() as HTMLElement).focus();
    await userEvent.keyboard(" {ArrowDown}{Escape}");
    await expect.poll(said).toBe("Trip put back.");
    expect(onEventsChange).not.toHaveBeenCalled();
    await expect
      .poll(() => (focused() as HTMLElement | null)?.dataset.resource)
      .toBe("van-1");
  });
});

describe("editing", () => {
  test("dragged to another row, an event is given that row's resource", async () => {
    const onEventsChange = vi.fn();
    await render(<Timeline onEventsChange={onEventsChange} events={[trip]} />);
    // The grid opens scrolled to now, and draws other columns as it does.
    // The last of them is there once it has, and the places are read then:
    // a drag handed elements finds them again by where they were.
    await expect.element(cell("Van 2, Friday, October 30")).toBeInTheDocument();
    const source = event(/^Trip/).element();
    const start = source.getBoundingClientRect();
    const pointer = (type: string, x: number, y: number) =>
      (type === "pointerdown" ? source : window).dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          pointerId: 2,
          pointerType: "mouse",
          button: 0,
          clientX: x,
          clientY: y,
        }),
      );
    const target = () =>
      cell("Van 2, Wednesday, October 14").element().getBoundingClientRect();
    pointer("pointerdown", start.x + 12, start.y + 8);
    pointer("pointermove", target().x + 24, target().y + 8);
    await expect
      .poll(() => document.querySelector("[data-preview]"))
      .not.toBeNull();
    pointer("pointerup", target().x + 24, target().y + 8);
    expect(changes(onEventsChange)[0]?.event).toMatchObject({
      start: "2026-10-14T09:00",
      end: "2026-10-15T17:00",
      resourceIds: ["van-2"],
    });
  });

  test("a click on empty time makes an event in that row", async () => {
    const onEventsChange = vi.fn();
    await render(<Timeline onEventsChange={onEventsChange} events={[]} />);
    await cell("Van 3, Tuesday, October 20").click();
    const popover = page.getByRole("dialog");
    await expect.element(popover).toBeVisible();
    await popover.getByLabelText("Title").fill("Loan");
    await popover.getByRole("button", { name: "Save" }).click();
    expect(changes(onEventsChange)).toEqual([
      {
        type: "create",
        event: {
          id: expect.any(String),
          title: "Loan",
          start: "2026-10-20",
          end: "2026-10-20",
          allDay: true,
          resourceIds: ["van-3"],
        },
      },
    ]);
  });

  test("Enter on a cell makes an event there", async () => {
    await render(<Timeline events={[]} onEventsChange={() => {}} />);
    intoGrid();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect
      .element(page.getByRole("dialog", { name: "New event" }))
      .toBeVisible();
  });
});

describe("on the server", () => {
  test("with a time zone the server draws the rows and events", () => {
    const html = renderToString(
      <EventTimeline
        aria-label="Fleet"
        resources={resources}
        events={[trip]}
        today={today}
        timeZone="UTC"
      />,
    );
    expect(html).not.toContain("data-pending");
    expect(html).toContain("Van 1");
    expect(html).toContain(
      "Trip, Wednesday, October 14 9:00 AM to Thursday, October 15 5:00 PM, Van 1",
    );
  });

  test("without a time zone the rows wait for the browser, and the page is taken over cleanly", async () => {
    const node = (
      <EventTimeline
        aria-label="Fleet"
        resources={resources}
        events={[trip]}
        today={today}
      />
    );
    const html = renderToString(node);
    expect(html).toContain("data-pending");
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    hydrateRoot(host, node);
    await expect.poll(() => host.querySelector("[data-pending]")).toBeNull();
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
    host.remove();
  });
});

describe("sizes", () => {
  test("with a mouse, a bar is 26px, a row of one lane 32px, and the header's buttons a small control", async () => {
    await render(<Timeline />);
    expect(box(event(/^Spare run/).element()).height).toBe(26);
    expect(box(row("Van 3").element()).height).toBe(32);
    for (const name of ["Today", "Previous", "Next"]) {
      expect(box(page.getByRole("button", { name }).element()).height).toBe(32);
    }
  });

  test("a short event is still a 24 pixel target", async () => {
    await render(
      <Timeline
        defaultScale="months"
        events={[{ ...trip, end: "2026-10-14T10:00" }]}
      />,
    );
    expect(box(event(/^Trip/).element()).width).toBeGreaterThanOrEqual(24);
  });

  test("the resources' column changes with its variable", async () => {
    await render(
      <div
        style={
          { "--nuv-event-timeline-resource-width": "300px" } as CSSProperties
        }
      >
        <Timeline />
      </div>,
    );
    expect(box(row("Van 1").element()).width).toBe(300);
  });
});

describe("motion", () => {
  test("nothing moves on its own: switching scales draws the next at once", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Timeline />);
    await page.getByRole("radio", { name: "Weeks" }).click();
    const timeline = page.getByRole("region", { name: "Fleet" }).element();
    expect(timeline.getAnimations({ subtree: true })).toEqual([]);
    await emulateMedia({ reducedMotion: null });
  });
});

describe("accessibility", () => {
  for (const scale of ["days", "hours", "weeks"] as const) {
    test.for(themes)(`the ${scale} scale, in %s`, async (theme) => {
      const { container } = await renderThemed(
        theme,
        <Timeline defaultScale={scale} />,
      );
      expect(await axe(container, outsideLandmarks)).toHaveNoViolations();
    });
  }

  test("an event with keyboard focus has a ring that stands out", async () => {
    await render(<Timeline />);
    // An event is in the tab order from the cell it starts in.
    intoGrid();
    await userEvent.keyboard("{ArrowDown}{Tab}");
    await expect.poll(focusedName).toMatch(/^Trip, /);
    const style = getComputedStyle(focused() as Element);
    expect(style.outlineStyle).toBe("solid");
    expect(
      contrast(
        style.outlineColor,
        getComputedStyle(document.body).backgroundColor,
      ),
    ).toBeGreaterThanOrEqual(3);
  });
});
