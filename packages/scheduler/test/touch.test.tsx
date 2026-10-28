import "@nuvui/react/styles.css";
import "@nuvui/date-picker/styles.css";
import "../src/styles/index.scss";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { type CalendarEvent, EventCalendar } from "../src";

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
