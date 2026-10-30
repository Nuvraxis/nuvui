import "@nuvui/react/styles.css";
import "@nuvui/date-picker/styles.css";
import "../src/styles/index.scss";
import { emulateMedia } from "@nuvui/tooling/test/media";
import { beforeEach, describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { type CalendarEvent, EventCalendar, EventTimeline } from "../src";

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

describe("editing", () => {
  test("an event picked up from the keyboard has a dashed outline", async () => {
    await render(
      <EventCalendar
        {...calendar}
        events={undefined}
        defaultEvents={events}
        defaultPanelOpen={false}
      />,
    );
    const review = page.getByRole("button", { name: /^Design review/ });
    (review.element() as HTMLElement).focus();
    await userEvent.keyboard(" ");
    await expect.element(review).toHaveAttribute("data-picked");
    const style = getComputedStyle(review.element());
    expect(style.outlineStyle).toBe("dashed");
  });

  test("a color in the popover shows which is chosen without its fill", async () => {
    await render(
      <EventCalendar
        {...calendar}
        events={undefined}
        defaultEvents={events}
        defaultPanelOpen={false}
      />,
    );
    await page.getByRole("button", { name: /^Design review/ }).click();
    const chosen = page.getByRole("radio", { name: "Color 1" }).element()
      .nextElementSibling as Element;
    const other = page.getByRole("radio", { name: "Color 2" }).element()
      .nextElementSibling as Element;
    expect(getComputedStyle(chosen).borderTopColor).not.toBe(
      getComputedStyle(other).borderTopColor,
    );
  });
});

describe("event timeline", () => {
  const timeline = {
    ...calendar,
    "aria-label": "Fleet",
    resources: [{ id: "van-1", title: "Van 1" }],
    events: events.map((event) => ({ ...event, resourceIds: ["van-1"] })),
  };

  test("every bar has an edge all the way round", async () => {
    await render(<EventTimeline {...timeline} />);
    for (const name of [/^Design review/, /^Offsite/]) {
      const style = getComputedStyle(
        page.getByRole("button", { name }).element(),
      );
      for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
        expect(style[`border${side}Style`], `${name} ${side}`).toBe("solid");
      }
    }
  });

  test("today's date is outlined, since its fill is gone", async () => {
    await render(<EventTimeline {...timeline} />);
    const date = page
      .getByRole("columnheader", { name: "Wednesday, October 14" })
      .element()
      .querySelector(".nuv-event-timeline__date") as Element;
    expect(getComputedStyle(date).outlineStyle).toBe("solid");
  });

  test("a resource's swatch keeps a color of its own", async () => {
    await render(<EventTimeline {...timeline} />);
    const swatch = page
      .getByRole("rowheader", { name: "Van 1" })
      .element()
      .querySelector(".nuv-event-timeline__swatch") as Element;
    expect(getComputedStyle(swatch).backgroundColor).not.toBe(
      "rgba(0, 0, 0, 0)",
    );
  });
});
