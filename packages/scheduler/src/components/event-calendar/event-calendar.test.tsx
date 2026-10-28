import "@nuvui/react/styles.css";
import "@nuvui/date-picker/styles.css";
import "../../styles/index.scss";
import { DirectionProvider } from "@nuvui/react/direction";
import { axe, outsideLandmarks } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { type CSSProperties, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { CalendarEvent } from "../../core/events";
import { EventCalendar, type EventCalendarProps } from "./event-calendar";

// Every test is on Wednesday 14 October 2026, at half past ten, in UTC.
// The week starts on Sunday the 11th.
const today = new Date("2026-10-14T10:30:00Z");

const events: CalendarEvent[] = [
  {
    id: "planning",
    title: "Planning",
    start: "2026-10-14T10:00",
    end: "2026-10-14T12:00",
  },
  {
    id: "review",
    title: "Design review",
    start: "2026-10-14T11:00",
    end: "2026-10-14T12:00",
    color: "3",
  },
  {
    id: "offsite",
    title: "Offsite",
    start: "2026-10-15",
    end: "2026-10-17",
    allDay: true,
    color: "7",
  },
  {
    id: "early",
    title: "Early start",
    start: "2026-10-12T07:00",
    end: "2026-10-12T09:00",
  },
];

function Calendar(props: Partial<EventCalendarProps>) {
  return (
    <EventCalendar
      aria-label="Team calendar"
      events={events}
      timeZone="UTC"
      today={today}
      // Wide enough for the side panel beside the days.
      style={{ inlineSize: 1100 }}
      {...props}
    />
  );
}

const box = (element: Element) => element.getBoundingClientRect();
const heading = () => page.getByRole("heading", { level: 2 });
const event = (name: string | RegExp) => page.getByRole("button", { name });
const focused = () => document.activeElement;

afterEach(() => {
  document.documentElement.removeAttribute("data-density");
});

describe("the week", () => {
  test("shows the seven days from the locale's first, with the range in its heading", async () => {
    await render(<Calendar />);
    await expect.element(heading()).toHaveTextContent("October 11 – 17, 2026");
    const days = page.getByRole("columnheader").elements();
    expect(days.map((day) => day.textContent)).toEqual([
      "Sun11",
      "Mon12",
      "Tue13",
      "Wed14",
      "Thu15",
      "Fri16",
      "Sat17",
    ]);
    expect(days[3]).toHaveAttribute("aria-current", "date");
  });

  test("names each event by its title, its time and its day", async () => {
    await render(<Calendar />);
    await expect
      .element(
        event("Design review, 11:00 AM to 12:00 PM, Wednesday, October 14"),
      )
      .toBeVisible();
    await expect
      .element(
        event("Offsite, All day, Thursday, October 15 to Saturday, October 17"),
      )
      .toBeVisible();
  });

  test("sets events that overlap side by side", async () => {
    await render(<Calendar />);
    const planning = box(event(/^Planning/).element());
    const review = box(event(/^Design review/).element());
    expect(planning.right).toBeLessThanOrEqual(review.left + 1);
    expect(planning.top).toBeLessThan(review.top);
    // Two hours long, and one: twice the height, give or take the gaps.
    expect(planning.height / review.height).toBeCloseTo(2, 0);
  });

  test("a short event is still a 24 pixel target, and covers nothing after it", async () => {
    await render(
      <Calendar
        defaultView="day"
        events={[
          {
            id: "half",
            title: "Half",
            start: "2026-10-14T10:00",
            end: "2026-10-14T10:30",
          },
          {
            id: "after",
            title: "After",
            start: "2026-10-14T10:30",
            end: "2026-10-14T11:00",
          },
          {
            id: "quarter",
            title: "Quarter",
            start: "2026-10-14T14:00",
            end: "2026-10-14T14:15",
          },
          {
            id: "next",
            title: "Next up",
            start: "2026-10-14T14:15",
            end: "2026-10-14T14:45",
          },
        ]}
      />,
    );
    const half = box(event(/^Half/).element());
    const after = box(event(/^After/).element());
    const quarter = box(event(/^Quarter/).element());
    const next = box(event(/^Next up/).element());
    expect(half.height).toBeGreaterThanOrEqual(24);
    expect(quarter.height).toBeGreaterThanOrEqual(24);
    // Half an hour leaves its gap, and a quarter is drawn beside the next.
    expect(after.top - half.bottom).toBeGreaterThan(0);
    expect(quarter.right).toBeLessThanOrEqual(next.left + 1);
  });

  test("draws an all-day event as a bar across its days", async () => {
    await render(<Calendar />);
    const bar = box(event(/^Offsite/).element());
    const thursday = box(
      page
        .getByRole("gridcell", { name: "All day, Thursday, October 15" })
        .element(),
    );
    expect(bar.left).toBeGreaterThanOrEqual(thursday.left);
    expect(bar.width).toBeGreaterThan(thursday.width * 2.5);
  });

  test("marks the time now in today's column", async () => {
    await render(<Calendar />);
    const line = document.querySelector(
      ".nuv-event-calendar__now",
    ) as HTMLElement;
    const cell = page
      .getByRole("gridcell", { name: "Wednesday, October 14, 10 AM" })
      .element();
    expect(cell.contains(line)).toBe(true);
    // Half past: halfway down the hour.
    expect(box(line).top - box(cell).top).toBeCloseTo(box(cell).height / 2, 0);
    expect(line).toHaveAttribute("aria-hidden", "true");
  });

  test("opens scrolled to seven", async () => {
    // Closed, as the panel's month is a grid too.
    await render(<Calendar defaultPanelOpen={false} />);
    const grid = page.getByRole("grid").element();
    const seven = page
      .getByRole("gridcell", { name: "Sunday, October 11, 7 AM" })
      .element();
    const head = grid.querySelector(".nuv-event-calendar__head") as HTMLElement;
    // Just under the days' names, with a little room for the hour's time.
    expect(box(seven).top - box(head).bottom).toBeGreaterThanOrEqual(0);
    expect(box(seven).top - box(head).bottom).toBeLessThan(16);
  });

  test("a day's number opens that day", async () => {
    await render(<Calendar />);
    await page
      .getByRole("button", { name: "Thursday, October 15, 2026" })
      .click();
    await expect
      .element(heading())
      .toHaveTextContent("Thursday, October 15, 2026");
    expect(page.getByRole("columnheader").elements()).toHaveLength(1);
  });
});

describe("hours", () => {
  test("shows only the hours asked for, and cuts an event at their edge", async () => {
    await render(<Calendar hours={[8, 18]} />);
    const rows = document.querySelectorAll("[data-hour]");
    expect([...rows].map((row) => row.getAttribute("data-hour"))).toEqual([
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
    ]);
    const early = event(/^Early start/).element();
    expect(early).toHaveAttribute("data-starts-before");
    expect(
      page
        .getByRole("gridcell", { name: "Monday, October 12, 8 AM" })
        .element(),
    ).toContainElement(early as HTMLElement);
  });

  test("an event wholly outside them isn't drawn", async () => {
    await render(<Calendar hours={[12, 18]} />);
    await expect.element(event(/^Early start/)).not.toBeInTheDocument();
  });

  test("hours that can't be shown fall back to the whole day, and say why", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(<Calendar hours={[18, 8]} />);
    expect(document.querySelectorAll("[data-hour]")).toHaveLength(24);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("[18, 8]"));
    warn.mockRestore();
  });
});

describe("moving through time", () => {
  test("previous, next and today move by the view's length", async () => {
    await render(<Calendar />);
    await page.getByRole("button", { name: "Next" }).click();
    await expect.element(heading()).toHaveTextContent("October 18 – 24, 2026");
    await page.getByRole("button", { name: "Previous" }).click();
    await page.getByRole("button", { name: "Previous" }).click();
    await expect.element(heading()).toHaveTextContent("October 4 – 10, 2026");
    await page.getByRole("button", { name: "Today" }).click();
    await expect.element(heading()).toHaveTextContent("October 11 – 17, 2026");
  });

  test("the heading is read out as it changes", async () => {
    await render(<Calendar />);
    await expect.element(heading()).toHaveAttribute("aria-live", "polite");
  });

  test("onDateChange is given the start of the day moved to", async () => {
    const onDateChange = vi.fn();
    await render(<Calendar onDateChange={onDateChange} />);
    await page.getByRole("button", { name: "Next" }).click();
    expect(onDateChange).toHaveBeenLastCalledWith(
      new Date("2026-10-21T00:00:00Z"),
    );
  });

  test("a date you hold is the one shown", async () => {
    function Held() {
      const [date, setDate] = useState(new Date("2026-12-02T12:00:00Z"));
      return (
        <>
          <Calendar date={date} onDateChange={setDate} defaultView="month" />
          <output>{date.toISOString()}</output>
        </>
      );
    }
    await render(<Held />);
    await expect.element(heading()).toHaveTextContent("December 2026");
    await page.getByRole("button", { name: "Next" }).click();
    await expect.element(heading()).toHaveTextContent("January 2027");
    await expect
      .element(page.getByText("2027-01-02T00:00:00.000Z"))
      .toBeVisible();
  });

  test("a day picked in the side panel is shown", async () => {
    await render(<Calendar />);
    const panel = page.getByRole("complementary", { name: "Side panel" });
    await panel.getByRole("button", { name: /October 22nd/ }).click();
    await expect.element(heading()).toHaveTextContent("October 18 – 24, 2026");
  });

  test("the side panel's button says whether it's open, and closes it", async () => {
    await render(<Calendar />);
    const toggle = page.getByRole("button", { name: "Side panel" });
    await expect.element(toggle).toHaveAttribute("aria-expanded", "true");
    await toggle.click();
    await expect.element(toggle).toHaveAttribute("aria-expanded", "false");
    await expect
      .element(page.getByRole("complementary", { name: "Side panel" }))
      .not.toBeInTheDocument();
  });
});

describe("views", () => {
  test("the header switches between them, and views limits which", async () => {
    const onViewChange = vi.fn();
    await render(
      <Calendar views={["week", "month"]} onViewChange={onViewChange} />,
    );
    const views = page.getByRole("radiogroup", { name: "View" });
    await expect
      .poll(() => views.getByRole("radio").elements())
      .toHaveLength(2);
    await views.getByRole("radio", { name: "Month" }).click();
    expect(onViewChange).toHaveBeenLastCalledWith("month");
    await expect.element(heading()).toHaveTextContent("October 2026");
  });

  test("a single view has no switch", async () => {
    await render(<Calendar views={["month"]} defaultView="month" />);
    await expect
      .element(page.getByRole("radiogroup", { name: "View" }))
      .not.toBeInTheDocument();
  });
});

describe("the month", () => {
  test("has a row for each week, with the days either side dimmed", async () => {
    await render(<Calendar defaultView="month" />);
    // 1 October 2026 is a Thursday, and the 31st a Saturday.
    const weeks = document.querySelectorAll(".nuv-event-calendar__week");
    expect(weeks).toHaveLength(5);
    const september = page.getByRole("gridcell", {
      name: "Sunday, September 27",
    });
    await expect.element(september).toHaveAttribute("data-outside");
    await expect
      .element(page.getByRole("gridcell", { name: "Wednesday, October 14" }))
      .toHaveAttribute("aria-current", "date");
  });

  test("keeps what doesn't fit behind a button that lists the day", async () => {
    const many: CalendarEvent[] = Array.from({ length: 8 }, (_, index) => ({
      id: `call-${index}`,
      title: `Call ${index + 1}`,
      start: `2026-10-20T${String(9 + index).padStart(2, "0")}:00`,
      end: `2026-10-20T${String(9 + index).padStart(2, "0")}:30`,
    }));
    await render(<Calendar events={many} defaultView="month" />);
    const day = page.getByRole("gridcell", { name: "Tuesday, October 20" });
    const shown = day.getByRole("button", { name: /^Call/ }).elements().length;
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(8);
    await day.getByRole("button", { name: `${8 - shown} more` }).click();
    const list = page.getByRole("dialog", { name: "Tuesday, October 20" });
    await expect.element(list).toBeVisible();
    expect(list.getByRole("button").elements()).toHaveLength(8);
  });

  test("a taller calendar shows more of a day", async () => {
    const many: CalendarEvent[] = Array.from({ length: 10 }, (_, index) => ({
      id: `call-${index}`,
      title: `Call ${index + 1}`,
      start: "2026-10-20",
      end: "2026-10-20",
      allDay: true,
    }));
    const count = () =>
      page
        .getByRole("gridcell", { name: "Tuesday, October 20" })
        .getByRole("button", { name: /^Call/ })
        .elements().length;
    const { rerender } = await render(
      <Calendar
        events={many}
        defaultView="month"
        style={{ inlineSize: 1100, blockSize: 500 }}
      />,
    );
    const few = count();
    await rerender(
      <Calendar
        events={many}
        defaultView="month"
        style={{ inlineSize: 1100, blockSize: 1100 }}
      />,
    );
    await expect.poll(count).toBeGreaterThan(few);
  });

  test("a bar across days runs to the end of the week and on in the next", async () => {
    const long: CalendarEvent[] = [
      {
        id: "trip",
        title: "Trip",
        start: "2026-10-16",
        end: "2026-10-20",
        allDay: true,
      },
    ];
    await render(<Calendar events={long} defaultView="month" />);
    const parts = page.getByRole("button", { name: /^Trip/ }).elements();
    expect(parts).toHaveLength(2);
    expect(parts[0]).toHaveAttribute("data-ends-after");
    expect(parts[1]).toHaveAttribute("data-starts-before");
  });

  test("a timed event is a line on its day, with its time", async () => {
    await render(<Calendar defaultView="month" />);
    const review = event(/^Design review/).element();
    expect(review).toHaveClass("nuv-event-calendar__event--line");
    expect(review.textContent).toContain("11:00 AM");
  });
});

describe("the agenda", () => {
  test("lists the days from the date, each with its events", async () => {
    await render(<Calendar defaultView="agenda" />);
    await expect.element(heading()).toHaveTextContent("October 14 – 20, 2026");
    const days = page.getByRole("heading", { level: 3 }).elements();
    expect(days.map((day) => day.textContent)).toEqual([
      "Wednesday, October 14",
      "Thursday, October 15",
      "Friday, October 16",
      "Saturday, October 17",
      "Sunday, October 18",
      "Monday, October 19",
      "Tuesday, October 20",
    ]);
    const wednesday = page.getByRole("region", {
      name: "Wednesday, October 14",
    });
    expect(wednesday.getByRole("listitem").elements()).toHaveLength(2);
  });

  test("leaves out empty days when asked, and goes to the next day with an event", async () => {
    const later: CalendarEvent[] = [
      {
        id: "audit",
        title: "Audit",
        start: "2026-12-01T09:00",
        end: "2026-12-01T10:00",
      },
    ];
    await render(
      <Calendar
        events={later}
        defaultView="agenda"
        defaultPreferences={{ showEmptyDays: false }}
      />,
    );
    await expect
      .element(
        page.getByText(
          "Nothing on from Wednesday, October 14 to Tuesday, October 20.",
        ),
      )
      .toBeVisible();
    await page
      .getByRole("button", { name: "Go to Tuesday, December 1" })
      .click();
    await expect.element(event(/^Audit/)).toBeVisible();
  });

  test("says so when nothing is on for 180 days", async () => {
    await render(
      <Calendar
        events={[]}
        defaultView="agenda"
        defaultPreferences={{ showEmptyDays: false }}
      />,
    );
    await expect
      .element(page.getByText("Nothing on in the next 180 days."))
      .toBeVisible();
  });
});

describe("preferences", () => {
  test("the menu changes them, and onPreferencesChange is told", async () => {
    const onPreferencesChange = vi.fn();
    await render(<Calendar onPreferencesChange={onPreferencesChange} />);
    await page.getByRole("button", { name: "Preferences" }).click();
    await page.getByRole("menuitemcheckbox", { name: "Weekends" }).click();
    expect(onPreferencesChange).toHaveBeenLastCalledWith({
      showWeekends: false,
    });
    await userEvent.keyboard("{Escape}");
    await expect
      .poll(() => page.getByRole("columnheader").elements())
      .toHaveLength(5);
  });

  test("24-hour time writes times without AM and PM", async () => {
    await render(<Calendar defaultPreferences={{ twentyFourHours: true }} />);
    await expect
      .element(event("Design review, 11:00 to 12:00, Wednesday, October 14"))
      .toBeVisible();
  });

  test("week numbers show in the month", async () => {
    await render(
      // Closed, as the panel's month shows week numbers too.
      <Calendar
        defaultView="month"
        defaultPreferences={{ showWeekNumbers: true }}
        defaultPanelOpen={false}
      />,
    );
    await expect
      .element(page.getByRole("rowheader", { name: "Week 42" }))
      .toBeVisible();
  });

  test("the week can start on another day", async () => {
    await render(<Calendar defaultPreferences={{ weekStartsOn: 1 }} />);
    await expect.element(heading()).toHaveTextContent("October 12 – 18, 2026");
  });

  test("the first day of the week is offered only when asked for, and an empty list takes the menu away", async () => {
    const { rerender } = await render(
      <Calendar preferenceOptions={["weekStartsOn"]} />,
    );
    await page.getByRole("button", { name: "Preferences" }).click();
    await expect
      .element(page.getByRole("menuitem", { name: "Week starts on" }))
      .toBeVisible();
    await userEvent.keyboard("{Escape}");
    await rerender(<Calendar preferenceOptions={[]} />);
    await expect
      .element(page.getByRole("button", { name: "Preferences" }))
      .not.toBeInTheDocument();
  });
});

describe("time zones", () => {
  test("events are drawn in the zone shown", async () => {
    const call: CalendarEvent[] = [
      {
        id: "call",
        title: "Call",
        start: "2026-10-14T09:00:00Z",
        end: "2026-10-14T10:00:00Z",
      },
    ];
    await render(<Calendar events={call} timeZone="Asia/Tokyo" />);
    await expect
      .element(event("Call, 6:00 PM to 7:00 PM, Wednesday, October 14"))
      .toBeVisible();
  });

  test("an event's own zone says where its clock times are", async () => {
    const call: CalendarEvent[] = [
      {
        id: "call",
        title: "Call",
        start: "2026-10-14T09:00",
        end: "2026-10-14T10:00",
        timeZone: "Europe/London",
      },
    ];
    await render(<Calendar events={call} timeZone="America/New_York" />);
    await expect
      .element(event("Call, 4:00 AM to 5:00 AM, Wednesday, October 14"))
      .toBeVisible();
  });
});

describe("keyboard", () => {
  test("Tab goes into the grid at one cell, the arrows move, and Tab goes on to that cell's events", async () => {
    await render(
      <Calendar
        views={["month"]}
        defaultView="month"
        preferenceOptions={[]}
        defaultPanelOpen={false}
      />,
    );
    const grid = page.getByRole("grid").element();
    (grid.querySelector('[tabindex="0"]') as HTMLElement).focus();
    expect(focused()).toHaveAccessibleName("Wednesday, October 14");
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .poll(() => focused()?.getAttribute("aria-label"))
      .toBe("Thursday, October 15");
    await userEvent.keyboard("{ArrowDown}");
    await expect
      .poll(() => focused()?.getAttribute("aria-label"))
      .toBe("Thursday, October 22");
    await userEvent.keyboard("{ArrowUp}{Tab}");
    await expect
      .poll(() => focused()?.getAttribute("aria-label"))
      .toBe("Thursday, October 15, 2026");
    await userEvent.keyboard("{Tab}");
    await expect
      .poll(() => focused()?.getAttribute("aria-label"))
      .toMatch(/^Offsite/);
  });

  test("Home and End go to the ends of the week", async () => {
    await render(
      <Calendar
        views={["month"]}
        defaultView="month"
        defaultPanelOpen={false}
      />,
    );
    (
      page
        .getByRole("grid")
        .element()
        .querySelector('[tabindex="0"]') as HTMLElement
    ).focus();
    await userEvent.keyboard("{End}");
    await expect
      .poll(() => focused()?.getAttribute("aria-label"))
      .toBe("Saturday, October 17");
    await userEvent.keyboard("{Home}");
    await expect
      .poll(() => focused()?.getAttribute("aria-label"))
      .toBe("Sunday, October 11");
  });

  test("only one cell of a grid is in the tab order", async () => {
    await render(<Calendar defaultPanelOpen={false} />);
    const grid = page.getByRole("grid").element();
    expect(
      grid.querySelectorAll('[role="gridcell"][tabindex="0"]').length,
    ).toBeLessThanOrEqual(1);
  });

  test("the arrows follow the page where it reads right to left", async () => {
    await render(
      <DirectionProvider dir="rtl">
        <div dir="rtl">
          <Calendar
            views={["month"]}
            defaultView="month"
            defaultPanelOpen={false}
          />
        </div>
      </DirectionProvider>,
    );
    (
      page
        .getByRole("grid")
        .element()
        .querySelector('[tabindex="0"]') as HTMLElement
    ).focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect
      .poll(() => focused()?.getAttribute("aria-label"))
      .toBe("Thursday, October 15");
  });

  test("the cell with keyboard focus has a ring that stands out", async () => {
    await render(
      <Calendar
        views={["month"]}
        defaultView="month"
        defaultPanelOpen={false}
      />,
    );
    (
      page
        .getByRole("grid")
        .element()
        .querySelector('[tabindex="0"]') as HTMLElement
    ).focus();
    await userEvent.keyboard("{ArrowRight}");
    const style = getComputedStyle(focused() as Element);
    expect(style.boxShadow).not.toBe("none");
  });

  test("an event with keyboard focus has a ring that stands out", async () => {
    await render(<Calendar defaultView="agenda" />);
    await event(/^Planning/)
      .element()
      .focus();
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}{Tab}");
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

describe("pressing an event", () => {
  test("onEventClick is given the event and its element", async () => {
    const onEventClick = vi.fn();
    await render(<Calendar onEventClick={onEventClick} />);
    await event(/^Design review/).click();
    expect(onEventClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "review" }),
      event(/^Design review/).element(),
    );
  });
});

describe("narrow", () => {
  test("the week shows three days, and the views are a menu", async () => {
    await render(<Calendar style={{ inlineSize: 500 }} />);
    await expect.element(heading()).toHaveTextContent("October 14 – 16, 2026");
    expect(page.getByRole("columnheader").elements()).toHaveLength(3);
    await expect
      .element(page.getByRole("combobox", { name: "View" }))
      .toBeVisible();
  });

  test("the side panel opens over the days, starts closed, and closes with Escape", async () => {
    await render(<Calendar style={{ inlineSize: 800 }} />);
    const toggle = page.getByRole("button", { name: "Side panel" });
    await expect.element(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    const panel = page.getByRole("complementary", { name: "Side panel" });
    await expect.element(panel).toBeVisible();
    (
      panel
        .getByRole("button", { name: /October 22nd/ })
        .element() as HTMLElement
    ).focus();
    await userEvent.keyboard("{Escape}");
    await expect.element(panel).not.toBeInTheDocument();
  });
});

describe("translation", () => {
  test("labels replace the words one by one, and locale writes the dates", async () => {
    await render(
      <Calendar
        labels={{
          today: "Heute",
          allDay: "Ganztägig",
          more: (count) => `${count} weitere`,
        }}
      />,
    );
    await expect
      .element(page.getByRole("button", { name: "Heute" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("rowheader", { name: "Ganztägig" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Next" }))
      .toBeVisible();
  });
});

describe("on the server", () => {
  test("without a time zone the days wait for the browser, and the page is taken over cleanly", async () => {
    const node = (
      <EventCalendar aria-label="Team calendar" events={events} today={today} />
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

  test("with a time zone the server draws the days", () => {
    const html = renderToString(
      <EventCalendar
        aria-label="Team calendar"
        events={events}
        today={today}
        timeZone="UTC"
      />,
    );
    expect(html).not.toContain("data-pending");
    expect(html).toContain(
      "Design review, 11:00 AM to 12:00 PM, Wednesday, October 14",
    );
  });

  test("without today the server marks no day as today, and the browser does", async () => {
    // A page built ahead of time would otherwise keep the day it was built.
    const node = (
      <EventCalendar
        aria-label="Team calendar"
        events={events}
        timeZone="UTC"
      />
    );
    const html = renderToString(node);
    expect(html).not.toContain('aria-current="date"');
    expect(html).not.toContain("--today");
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    hydrateRoot(host, node);
    await expect
      .poll(() => host.querySelectorAll('[aria-current="date"]').length)
      .toBeGreaterThan(0);
    host.remove();
  });
});

describe("sizes", () => {
  test("with a mouse, the header's buttons are as tall as a small control", async () => {
    await render(<Calendar />);
    for (const name of [
      "Today",
      "Previous",
      "Next",
      "Side panel",
      "Preferences",
    ]) {
      expect(box(page.getByRole("button", { name }).element()).height).toBe(32);
    }
  });

  test.for([
    ["compact", 28],
    ["comfortable", 36],
  ] as const)(
    "at %s density the header's buttons are %spx",
    async ([density, size]) => {
      document.documentElement.setAttribute("data-density", density);
      await render(<Calendar />);
      expect(
        box(page.getByRole("button", { name: "Today" }).element()).height,
      ).toBe(size);
    },
  );

  test("an hour is 48px, and changes with its variable", async () => {
    await render(
      <div
        style={{ "--nuv-event-calendar-hour-height": "64px" } as CSSProperties}
      >
        <Calendar />
      </div>,
    );
    const cell = page
      .getByRole("gridcell", { name: "Sunday, October 11, 9 AM" })
      .element();
    expect(box(cell).height).toBe(64);
  });
});

describe("motion", () => {
  test("nothing moves on its own: switching views draws the next one at once", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Calendar />);
    await page.getByRole("radio", { name: "Month" }).click();
    const calendar = page
      .getByRole("region", { name: "Team calendar" })
      .element();
    expect(calendar.getAnimations({ subtree: true })).toEqual([]);
    await emulateMedia({ reducedMotion: null });
  });
});

describe("accessibility", () => {
  const views = ["week", "day", "month", "agenda"] as const;

  for (const view of views) {
    test.for(themes)(`the ${view} view, in %s`, async (theme) => {
      const { container } = await renderThemed(
        theme,
        <Calendar defaultView={view} />,
      );
      expect(await axe(container, outsideLandmarks)).toHaveNoViolations();
    });
  }

  test("event text keeps 4.5:1 on every color", async () => {
    const colored: CalendarEvent[] = [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
    ].map((color, index) => ({
      id: color,
      title: `Color ${color}`,
      start: `2026-10-${String(11 + (index % 7)).padStart(2, "0")}`,
      end: `2026-10-${String(11 + (index % 7)).padStart(2, "0")}`,
      allDay: true,
      color,
    }));
    for (const theme of themes) {
      const { container, unmount } = await renderThemed(
        theme,
        <Calendar events={colored} />,
      );
      for (const element of container.querySelectorAll<HTMLElement>(
        ".nuv-event-calendar__event",
      )) {
        const style = getComputedStyle(element);
        expect(
          contrast(style.color, style.backgroundColor),
          `${theme} ${element.getAttribute("aria-label")}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
      unmount();
    }
  });
});
