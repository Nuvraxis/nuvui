import "@nuvui/react/styles.css";
import "@nuvui/date-picker/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { CalendarEvent, EventChange } from "../../core/events";
import { EventCalendar, type EventCalendarProps } from "./event-calendar";

// Every test is on Wednesday 14 October 2026, at half past ten, in UTC.
const today = new Date("2026-10-14T10:30:00Z");

// Monday, Wednesday and Friday at half past nine, from Monday 12 October.
const standUp: CalendarEvent = {
  id: "stand-up",
  title: "Stand-up",
  start: "2026-10-12T09:30",
  end: "2026-10-12T09:45",
  recurrence: "FREQ=WEEKLY;BYDAY=MO,WE,FR",
};
const planning: CalendarEvent = {
  id: "planning",
  title: "Planning",
  start: "2026-10-14T13:00",
  end: "2026-10-14T14:00",
};

function Calendar(props: Partial<EventCalendarProps>) {
  return (
    <EventCalendar
      aria-label="Team calendar"
      defaultEvents={[standUp, planning]}
      timeZone="UTC"
      today={today}
      scrollToHour={8}
      defaultPanelOpen={false}
      createId={() => "new"}
      style={{ inlineSize: 1100 }}
      {...props}
    />
  );
}

const event = (name: string | RegExp) => page.getByRole("button", { name });
const wednesday = () => event(/^Stand-up, 9:30 AM to 9:45 AM, Wednesday/);
const popover = () => page.getByRole("dialog");
const question = () => page.getByRole("alertdialog");
const said = () =>
  document.querySelector(".nuv-event-calendar__announcer")?.textContent ?? "";
const changes = (spy: ReturnType<typeof vi.fn>) =>
  spy.mock.calls.map((call) => call[1] as EventChange);
const names = () =>
  [...document.querySelectorAll("button[data-event-id]")].map(
    (button) => button.getAttribute("aria-label") ?? "",
  );

beforeEach(async () => {
  await setViewport("desktop");
});

describe("an event that repeats", () => {
  test("is drawn on each of its days, and says it repeats", async () => {
    await render(<Calendar />);
    await expect.element(wednesday()).toBeInTheDocument();
    const repeating = names().filter((name) => name.startsWith("Stand-up"));
    expect(repeating).toHaveLength(3);
    for (const name of repeating) expect(name).toMatch(/, repeats$/);
    expect(names().find((name) => name.startsWith("Planning"))).not.toMatch(
      /repeats/,
    );
  });

  test("is left out on the days it skips", async () => {
    await render(
      <Calendar defaultEvents={[{ ...standUp, exceptions: ["2026-10-14"] }]} />,
    );
    await expect.element(event(/^Stand-up, .*Monday/)).toBeInTheDocument();
    expect(names().filter((name) => name.startsWith("Stand-up"))).toHaveLength(
      2,
    );
  });

  test("opened to be read, says how it repeats", async () => {
    await render(<Calendar readOnly />);
    await wednesday().click();
    await expect
      .element(
        popover().getByText("Every week on Monday, Wednesday and Friday"),
      )
      .toBeVisible();
  });

  test("is handed to the app as its series, at the occurrence's times", async () => {
    const onEventClick = vi.fn();
    await render(<Calendar onEventClick={onEventClick} />);
    await wednesday().click();
    expect(onEventClick.mock.calls[0]?.[0]).toEqual({
      ...standUp,
      start: "2026-10-14T09:30",
      end: "2026-10-14T09:45",
    });
  });
});

describe("moving an occurrence", () => {
  test("asks which, and one becomes an event of its own", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    (wednesday().element() as HTMLElement).focus();
    await userEvent.keyboard(" {ArrowDown}{ArrowDown}{Enter}");
    await expect
      .element(page.getByRole("alertdialog", { name: "Change Stand-up?" }))
      .toBeVisible();
    expect(onEventsChange).not.toHaveBeenCalled();
    await question().getByRole("button", { name: "This event" }).click();
    expect(changes(onEventsChange)).toEqual([
      {
        type: "update",
        event: { ...standUp, exceptions: ["2026-10-14"] },
        previous: standUp,
      },
      {
        type: "create",
        event: {
          id: "new",
          title: "Stand-up",
          start: "2026-10-14T10:00",
          end: "2026-10-14T10:15",
        },
      },
    ]);
    await expect
      .element(event(/^Stand-up, 10:00 AM to 10:15 AM, Wednesday/))
      .toHaveFocus();
    await expect.poll(said).toMatch(/^Dropped Stand-up/);
  });

  test("all of them moves the series to the new time", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    (wednesday().element() as HTMLElement).focus();
    await userEvent.keyboard(" {ArrowDown}{ArrowDown}{Enter}");
    await question().getByRole("button", { name: "All events" }).click();
    expect(changes(onEventsChange)).toEqual([
      {
        type: "update",
        event: {
          ...standUp,
          start: "2026-10-12T10:00",
          end: "2026-10-12T10:15",
        },
        previous: standUp,
      },
    ]);
    expect(
      names().filter((name) => name.startsWith("Stand-up, 10:00 AM")),
    ).toHaveLength(3);
  });

  test("cancelled, it stays where it was, with the focus", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    (wednesday().element() as HTMLElement).focus();
    await userEvent.keyboard(" {ArrowDown}{Enter}");
    await expect
      .element(question().getByRole("button", { name: "Cancel" }))
      .toHaveFocus();
    await question().getByRole("button", { name: "Cancel" }).click();
    expect(onEventsChange).not.toHaveBeenCalled();
    await expect.element(wednesday()).toHaveFocus();
  });
});

describe("deleting an occurrence", () => {
  test("asks which, and that's the only question", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    (wednesday().element() as HTMLElement).focus();
    await userEvent.keyboard("{Delete}");
    await expect
      .element(page.getByRole("alertdialog", { name: "Delete Stand-up?" }))
      .toBeVisible();
    await question().getByRole("button", { name: "This event" }).click();
    await expect.element(question()).not.toBeInTheDocument();
    expect(changes(onEventsChange)).toEqual([
      {
        type: "update",
        event: { ...standUp, exceptions: ["2026-10-14"] },
        previous: standUp,
      },
    ]);
    await expect.poll(said).toBe("Deleted Stand-up.");
  });

  test("from one on ends the series the day before", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    (wednesday().element() as HTMLElement).focus();
    await userEvent.keyboard("{Delete}");
    await question()
      .getByRole("button", { name: "This and the following events" })
      .click();
    expect(changes(onEventsChange)[0]?.event.recurrence).toBe(
      "FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20261013T235959Z",
    );
  });
});

describe("the repeat fields in the popover", () => {
  const save = () => popover().getByRole("button", { name: "Save" }).click();
  const choose = async (field: string, option: string) => {
    await popover().getByRole("combobox", { name: field }).click();
    await page.getByRole("option", { name: option }).click();
  };

  test("make an event repeat, on the day it starts", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    await event(/^Planning/).click();
    await expect
      .element(popover().getByRole("combobox", { name: "Repeat" }))
      .toHaveTextContent("Doesn't repeat");
    await choose("Repeat", "Weekly");
    await expect
      .element(popover().getByRole("button", { name: "Wednesday" }))
      .toHaveAttribute("aria-pressed", "true");
    await save();
    expect(changes(onEventsChange)[0]?.event.recurrence).toBe("FREQ=WEEKLY");
  });

  test("weekly, take more days of the week", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    await event(/^Planning/).click();
    await choose("Repeat", "Weekly");
    await popover().getByRole("button", { name: "Friday" }).click();
    await save();
    expect(changes(onEventsChange)[0]?.event.recurrence).toBe(
      "FREQ=WEEKLY;BYDAY=WE,FR",
    );
  });

  test("monthly, offer the date or the weekday in its week", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    await event(/^Planning/).click();
    await choose("Repeat", "Monthly");
    await expect
      .element(popover().getByRole("combobox", { name: "On" }))
      .toHaveTextContent("On day 14");
    await choose("On", "On the second Wednesday");
    await save();
    expect(changes(onEventsChange)[0]?.event.recurrence).toBe(
      "FREQ=MONTHLY;BYDAY=2WE",
    );
  });

  test("stop after a number of times, every so many weeks", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    await event(/^Planning/).click();
    await choose("Repeat", "Weekly");
    await popover().getByRole("spinbutton", { name: "Every" }).fill("2");
    await choose("Stops repeating", "After a number of times");
    await popover()
      .getByRole("spinbutton", { name: "Number of times" })
      .fill("4");
    await save();
    expect(changes(onEventsChange)[0]?.event.recurrence).toBe(
      "FREQ=WEEKLY;INTERVAL=2;COUNT=4",
    );
  });

  test("are written as an object for an app that writes its rules so", async () => {
    const onEventsChange = vi.fn();
    await render(
      <Calendar
        defaultEvents={[
          { ...standUp, recurrence: { frequency: "weekly" } },
          planning,
        ]}
        onEventsChange={onEventsChange}
      />,
    );
    await event(/^Planning/).click();
    await choose("Repeat", "Daily");
    await save();
    expect(changes(onEventsChange)[0]?.event.recurrence).toEqual({
      frequency: "daily",
    });
  });

  test("say so for an event in a time zone of its own", async () => {
    await render(
      <Calendar
        defaultEvents={[
          {
            ...planning,
            start: "2026-10-14T15:00",
            end: "2026-10-14T16:00",
            timeZone: "Europe/Berlin",
          },
        ]}
      />,
    );
    await event(/^Planning/).click();
    await choose("Repeat", "Daily");
    await expect
      .element(popover().getByText("It repeats on the clock in Europe/Berlin."))
      .toBeVisible();
  });

  test("changed for an occurrence, aren't offered for that one alone", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    await wednesday().click();
    await expect
      .element(popover().getByRole("combobox", { name: "Repeat" }))
      .toHaveTextContent("Weekly");
    await popover().getByRole("spinbutton", { name: "Every" }).fill("2");
    await save();
    await expect
      .element(question().getByRole("button", { name: "All events" }))
      .toBeVisible();
    await expect
      .element(question().getByRole("button", { name: "This event" }))
      .not.toBeInTheDocument();
    await question()
      .getByRole("button", { name: "This and the following events" })
      .click();
    const [before, after] = changes(onEventsChange);
    expect(before?.event.recurrence).toBe(
      "FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20261013T235959Z",
    );
    expect(after?.event).toMatchObject({
      id: "new",
      start: "2026-10-14T09:30",
      recurrence: "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR",
    });
  });

  test.for(themes)("open, have no axe violations in %s", async (theme) => {
    await renderThemed(theme, <Calendar />);
    await wednesday().click();
    await expect.element(popover()).toBeVisible();
    await Promise.all(document.getAnimations().map((run) => run.finished));
    expect(await axe(popover().element() as HTMLElement)).toHaveNoViolations();
  });

  test.for(themes)(
    "the question has no axe violations in %s",
    async (theme) => {
      await renderThemed(theme, <Calendar />);
      (wednesday().element() as HTMLElement).focus();
      await userEvent.keyboard("{Delete}");
      await expect.element(question()).toBeVisible();
      await Promise.all(document.getAnimations().map((run) => run.finished));
      expect(
        await axe(question().element() as HTMLElement),
      ).toHaveNoViolations();
    },
  );
});
