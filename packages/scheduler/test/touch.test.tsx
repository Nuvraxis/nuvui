import "@nuvui/react/styles.css";
import "@nuvui/date-picker/styles.css";
import "../src/styles/index.scss";
import { describe, expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { type CalendarEvent, EventCalendar, EventTimeline } from "../src";

// This file runs in a browser context of its own, one that reports a touch
// screen. What the parts measure with a mouse is checked next to the
// component.

const box = (element: Element) => element.getBoundingClientRect();
const today = new Date("2026-10-14T10:30:00Z");
const events: CalendarEvent[] = [
  {
    id: "review",
    title: "Design review",
    start: "2026-10-14T11:00",
    end: "2026-10-14T12:00",
  },
];

const calendar = { events, today, timeZone: "UTC", "aria-label": "Team" };

test("the browser reports a touch screen", () => {
  expect(matchMedia("(pointer: coarse)").matches).toBe(true);
});

describe("event calendar", () => {
  test("every button in the header is at least 44px each way", async () => {
    await render(<EventCalendar {...calendar} />);
    for (const name of [
      "Today",
      "Previous",
      "Next",
      "Side panel",
      "Preferences",
    ]) {
      const button = box(page.getByRole("button", { name }).element());
      expect(button.height, name).toBeGreaterThanOrEqual(44);
      expect(button.width, name).toBeGreaterThanOrEqual(44);
    }
  });

  test("a day's number in the week and in a month is 44px tall", async () => {
    const { rerender } = await render(<EventCalendar {...calendar} />);
    const week = page.getByRole("button", {
      name: "Wednesday, October 14, 2026",
    });
    expect(box(week.element()).height).toBeGreaterThanOrEqual(44);
    await rerender(<EventCalendar {...calendar} defaultView="month" />);
    const month = page.getByRole("button", {
      name: "Wednesday, October 14, 2026",
    });
    expect(box(month.element()).height).toBeGreaterThanOrEqual(44);
  });

  test("a resource's row and its fold button are 44px", async () => {
    await render(
      <EventCalendar
        {...calendar}
        resources={[
          {
            id: "rooms",
            title: "Rooms",
            children: [{ id: "4b", title: "Room 4B" }],
          },
        ]}
      />,
    );
    const panel = page.getByRole("button", { name: "Side panel" });
    if (panel.element().getAttribute("aria-expanded") === "false") {
      await panel.click();
    }
    const fold = box(
      page.getByRole("button", { name: "Resources in Rooms" }).element(),
    );
    expect(fold.height).toBeGreaterThanOrEqual(44);
    expect(fold.width).toBeGreaterThanOrEqual(44);
    const row = page
      .getByRole("checkbox", { name: "Room 4B" })
      .element()
      .closest(".nuv-event-calendar__resource-row") as Element;
    expect(box(row).height).toBeGreaterThanOrEqual(44);
  });

  test("an event in the agenda is 44px tall", async () => {
    await render(<EventCalendar {...calendar} defaultView="agenda" />);
    const item = page.getByRole("button", { name: /^Design review/ }).element();
    expect(box(item).height).toBeGreaterThanOrEqual(44);
  });

  test("a lane of bars is taller than with a mouse", async () => {
    await render(<EventCalendar {...calendar} defaultView="month" />);
    const probe = document.querySelector(
      ".nuv-event-calendar__probe",
    ) as Element;
    expect(box(probe).height).toBe(28);
  });

  test("on a phone, the week shows three days and nothing scrolls sideways", async () => {
    await render(
      <div style={{ padding: 16, inlineSize: 390, boxSizing: "border-box" }}>
        <EventCalendar {...calendar} />
      </div>,
    );
    expect(page.getByRole("columnheader").elements()).toHaveLength(3);
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });
});

describe("editing by touch", () => {
  const editable = {
    ...calendar,
    events: undefined,
    defaultEvents: events,
    defaultPanelOpen: false,
    scrollToHour: 10,
  };
  const touch = (type: string, x: number, y: number, target: EventTarget) =>
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 9,
        pointerType: "touch",
        isPrimary: true,
        clientX: x,
        clientY: y,
      }),
    );

  test("a tap on an event shows a toolbar with Edit and Delete", async () => {
    await render(<EventCalendar {...editable} />);
    const review = page.getByRole("button", { name: /^Design review/ });
    const box = review.element().getBoundingClientRect();
    touch("pointerdown", box.x + 8, box.y + 8, review.element());
    touch("pointerup", box.x + 8, box.y + 8, review.element());
    review
      .element()
      .dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    const toolbar = page.getByRole("dialog", {
      name: "Design review, actions",
    });
    await expect.element(toolbar).toBeVisible();
    await toolbar.getByRole("button", { name: "Edit" }).click();
    await expect
      .element(page.getByRole("textbox", { name: "Title" }))
      .toHaveValue("Design review");
  });

  test("an event held still is picked up, and dragged without scrolling", async () => {
    const onEventsChange = vi.fn();
    await render(
      <EventCalendar {...editable} onEventsChange={onEventsChange} />,
    );
    const review = page.getByRole("button", { name: /^Design review/ });
    const from = review.element().getBoundingClientRect();
    const to = page
      .getByRole("gridcell", { name: "Thursday, October 15, 11 AM" })
      .element()
      .getBoundingClientRect();
    // Below the handle at its start, and as far into the hour it's let go
    // in.
    touch("pointerdown", from.x + 6, from.y + 12, review.element());
    // Held for longer than half a second.
    await new Promise((resolve) => setTimeout(resolve, 600));
    touch("pointermove", to.x + 6, to.y + 11, window);
    touch("pointerup", to.x + 6, to.y + 11, window);
    await expect.poll(() => onEventsChange.mock.calls.length).toBe(1);
    expect(onEventsChange.mock.calls[0]?.[1].event).toMatchObject({
      start: "2026-10-15T11:00",
      end: "2026-10-15T12:00",
    });
  });

  test("a finger that moves before it's held scrolls, and moves nothing", async () => {
    const onEventsChange = vi.fn();
    await render(
      <EventCalendar {...editable} onEventsChange={onEventsChange} />,
    );
    const review = page.getByRole("button", { name: /^Design review/ });
    const from = review.element().getBoundingClientRect();
    touch("pointerdown", from.x + 6, from.y + 4, review.element());
    touch("pointermove", from.x + 6, from.y + 60, window);
    await new Promise((resolve) => setTimeout(resolve, 600));
    touch("pointerup", from.x + 6, from.y + 60, window);
    expect(onEventsChange).not.toHaveBeenCalled();
  });
});

describe("event timeline", () => {
  const timeline = {
    ...calendar,
    "aria-label": "Fleet",
    resources: [
      {
        id: "north",
        title: "North depot",
        children: [{ id: "van-1", title: "Van 1" }],
      },
    ],
    events: [{ ...events[0], resourceIds: ["van-1"] }] as CalendarEvent[],
  };

  test("every button in the header is at least 44px each way", async () => {
    await render(<EventTimeline {...timeline} />);
    for (const name of ["Today", "Previous", "Next"]) {
      const button = box(page.getByRole("button", { name }).element());
      expect(button.height, name).toBeGreaterThanOrEqual(44);
      expect(button.width, name).toBeGreaterThanOrEqual(44);
    }
  });

  test("a bar is 44px tall, and so is a resource's fold button", async () => {
    await render(<EventTimeline {...timeline} />);
    const bar = box(
      page.getByRole("button", { name: /^Design review/ }).element(),
    );
    expect(bar.height).toBeGreaterThanOrEqual(44);
    const fold = box(
      page.getByRole("button", { name: "Resources in North depot" }).element(),
    );
    expect(fold.height).toBeGreaterThanOrEqual(44);
    expect(fold.width).toBeGreaterThanOrEqual(44);
  });

  test("a day's column is 44px wide", async () => {
    await render(<EventTimeline {...timeline} style={{ inlineSize: 360 }} />);
    const cell = box(
      page
        .getByRole("gridcell", { name: "Van 1, Wednesday, October 14" })
        .element(),
    );
    expect(cell.width).toBeGreaterThanOrEqual(44);
  });
});
