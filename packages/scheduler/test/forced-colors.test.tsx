import "@nuvui/react/styles.css";
import "@nuvui/date-picker/styles.css";
import "../src/styles/index.scss";
import { emulateMedia } from "@nuvui/tooling/test/media";
import { beforeEach, describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { type CalendarEvent, EventCalendar } from "../src";

// Forced-colors mode is what Windows high contrast turns on. The browser
// replaces every color with one from a short system palette and stops
// drawing backgrounds, so an event drawn by its fill alone would vanish.

beforeEach(async ({ skip }) => {
  await emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });

  // WebKit answers the media query when asked to, but has no forced-colors
  // mode: it goes on painting the colors the page set.
  const probe = document.createElement("span");
  probe.style.color = "rgb(1, 2, 3)";
  document.body.append(probe);
  const forced = getComputedStyle(probe).color !== "rgb(1, 2, 3)";
  probe.remove();
  if (!forced) skip("this browser doesn't force colors");
});

const today = new Date("2026-10-14T10:30:00Z");
const events: CalendarEvent[] = [
  {
    id: "review",
    title: "Design review",
    start: "2026-10-14T11:00",
    end: "2026-10-14T12:00",
  },
  {
    id: "offsite",
    title: "Offsite",
    start: "2026-10-15",
    end: "2026-10-16",
    allDay: true,
  },
];
const calendar = { events, today, timeZone: "UTC", "aria-label": "Team" };

describe("event calendar", () => {
  test("every event has an edge all the way round", async () => {
    await render(<EventCalendar {...calendar} />);
    for (const name of [/^Design review/, /^Offsite/]) {
      const style = getComputedStyle(
        page.getByRole("button", { name }).element(),
      );
      for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
        expect(style[`border${side}Style`], `${name} ${side}`).toBe("solid");
        expect(
          Number.parseFloat(style[`border${side}Width`]),
          `${name} ${side}`,
        ).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test("today in a month is outlined, since its fill is gone", async () => {
    await render(<EventCalendar {...calendar} defaultView="month" />);
    const today = page
      .getByRole("button", { name: "Wednesday, October 14, 2026" })
      .element();
    expect(getComputedStyle(today).outlineStyle).toBe("solid");
  });
});
