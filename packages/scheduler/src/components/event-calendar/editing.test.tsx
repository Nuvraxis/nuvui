import "@nuvui/react/styles.css";
import "@nuvui/date-picker/styles.css";
import "../../styles/index.scss";
import { DirectionProvider } from "@nuvui/react/direction";
import { axe, outsideLandmarks } from "@nuvui/tooling/test/axe";
import { setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { CalendarEvent, EventChange } from "../../core/events";
import { EventCalendar, type EventCalendarProps } from "./event-calendar";
import { eventDragProps } from "./external";

// Every test is on Wednesday 14 October 2026, at half past ten, in UTC.
const today = new Date("2026-10-14T10:30:00Z");

const planning: CalendarEvent = {
  id: "planning",
  title: "Planning",
  start: "2026-10-14T10:00",
  end: "2026-10-14T12:00",
};
const offsite: CalendarEvent = {
  id: "offsite",
  title: "Offsite",
  start: "2026-10-15",
  end: "2026-10-16",
  allDay: true,
};

let made = 0;

function Calendar(props: Partial<EventCalendarProps>) {
  return (
    <EventCalendar
      aria-label="Team calendar"
      defaultEvents={[planning, offsite]}
      timeZone="UTC"
      today={today}
      scrollToHour={8}
      defaultPanelOpen={false}
      createId={() => {
        made += 1;
        return `new-${made}`;
      }}
      style={{ inlineSize: 1100 }}
      {...props}
    />
  );
}

const event = (name: string | RegExp) => page.getByRole("button", { name });
const cell = (name: string) => page.getByRole("gridcell", { name });
const popover = () => page.getByRole("dialog");
const said = () =>
  document.querySelector(".nuv-event-calendar__announcer")?.textContent ?? "";
const changes = (spy: ReturnType<typeof vi.fn>) =>
  spy.mock.calls.map((call) => call[1] as EventChange);

// In steps, as a hand moves, so the drag starts before it ends. Taken
// and let go at the same place near the top of each, past the handles at
// an event's ends, so the times don't hang on where a pixel's middle falls.
const drag = (from: Element, to: Element) =>
  userEvent.dragAndDrop(from, to, {
    steps: 10,
    sourcePosition: { x: 12, y: 12 },
    targetPosition: { x: 12, y: 12 },
  });

// Wide enough for the week, which drags reach across.
beforeEach(async () => {
  await setViewport("desktop");
});

describe("where changes go", () => {
  test("events alone open to be read, and nothing can change them", async () => {
    await render(<Calendar defaultEvents={undefined} events={[planning]} />);
    await event(/^Planning/).click();
    await expect.element(popover()).toBeVisible();
    await expect
      .element(
        popover().getByText("10:00 AM to 12:00 PM, Wednesday, October 14"),
      )
      .toBeVisible();
    await expect
      .element(popover().getByRole("textbox"))
      .not.toBeInTheDocument();
    await popover().getByRole("button", { name: "Close" }).click();
    await expect.element(popover()).not.toBeInTheDocument();
    await expect.element(event(/^Planning/)).toHaveFocus();
  });

  test("with onEventsChange, each change is passed on with the events after it", async () => {
    const onEventsChange = vi.fn();
    function Held() {
      const [events, setEvents] = useState([planning]);
      return (
        <Calendar
          defaultEvents={undefined}
          events={events}
          onEventsChange={(next, change) => {
            setEvents(next);
            onEventsChange(next, change);
          }}
        />
      );
    }
    await render(<Held />);
    await event(/^Planning/).click();
    await popover().getByRole("textbox", { name: "Title" }).fill("Roadmap");
    await popover().getByRole("button", { name: "Save" }).click();
    expect(onEventsChange).toHaveBeenCalledTimes(1);
    const [next, change] = onEventsChange.mock.calls[0] ?? [];
    expect(change).toEqual({
      type: "update",
      event: { ...planning, title: "Roadmap" },
      previous: planning,
    });
    expect(next).toEqual([{ ...planning, title: "Roadmap" }]);
    await expect.element(event(/^Roadmap/)).toHaveFocus();
  });
});

describe("making an event", () => {
  test("a click on empty time opens a new one there, added when it's saved", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    // Near the top of the hour, so it starts on the hour.
    await cell("Thursday, October 15, 2 PM").click({
      position: { x: 5, y: 5 },
    });
    await expect
      .element(popover().getByRole("heading", { name: "New event" }))
      .toBeVisible();
    await expect
      .element(popover().getByRole("textbox", { name: "Title" }))
      .toHaveFocus();
    await userEvent.keyboard("Budget review");
    await popover().getByRole("button", { name: "Save" }).click();
    const [change] = changes(onEventsChange);
    expect(change?.type).toBe("create");
    expect(change?.event).toMatchObject({
      title: "Budget review",
      start: "2026-10-15T14:00",
      end: "2026-10-15T15:00",
    });
    await expect
      .element(event("Budget review, 2:00 PM to 3:00 PM, Thursday, October 15"))
      .toBeVisible();
  });

  test("Enter on an empty cell makes one at its hour, and Cancel keeps nothing", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    const nine = cell("Thursday, October 15, 9 AM");
    (nine.element() as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");
    await expect.element(popover()).toBeVisible();
    await expect
      .element(popover().getByLabelText("Time").first())
      .toHaveValue("09:00");
    await popover().getByRole("button", { name: "Cancel" }).click();
    await expect.element(popover()).not.toBeInTheDocument();
    expect(onEventsChange).not.toHaveBeenCalled();
    await expect.element(nine).toHaveFocus();
  });

  test("an empty title is saved as Untitled, and a day in the all-day row is all day", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    await cell("All day, Friday, October 16").click();
    await popover().getByRole("button", { name: "Save" }).click();
    expect(changes(onEventsChange)[0]?.event).toMatchObject({
      title: "Untitled",
      allDay: true,
      start: "2026-10-16",
      end: "2026-10-16",
    });
  });

  test("a double click makes one with createOn, and a click doesn't", async () => {
    await render(<Calendar createOn="doubleClick" />);
    await cell("Thursday, October 15, 2 PM").click();
    await expect.element(popover()).not.toBeInTheDocument();
    await cell("Thursday, October 15, 2 PM").dblClick();
    await expect.element(popover()).toBeVisible();
  });

  test("creatable={false} makes none, and the events can still be changed", async () => {
    await render(<Calendar creatable={false} />);
    await cell("Thursday, October 15, 2 PM").click();
    await expect.element(popover()).not.toBeInTheDocument();
    await event(/^Planning/).click();
    await expect
      .element(popover().getByRole("textbox", { name: "Title" }))
      .toBeVisible();
  });
});

describe("the popover", () => {
  test("an end before the start can't be saved, and says why", async () => {
    await render(<Calendar />);
    await event(/^Planning/).click();
    const end = popover().getByLabelText("Time").nth(1);
    await end.fill("09:00");
    await expect
      .element(popover().getByText("It ends before it starts."))
      .toBeVisible();
    await expect
      .element(popover().getByRole("button", { name: "Save" }))
      .toBeDisabled();
  });

  test("all day takes the times away, and saves whole days", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    await event(/^Planning/).click();
    await popover().getByRole("checkbox", { name: "All day" }).click();
    await expect
      .element(popover().getByLabelText("Time"))
      .not.toBeInTheDocument();
    await popover().getByRole("button", { name: "Save" }).click();
    expect(changes(onEventsChange)[0]?.event).toMatchObject({
      allDay: true,
      start: "2026-10-14",
      end: "2026-10-14",
    });
  });

  test("a color is chosen from eight radios", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    await event(/^Planning/).click();
    expect(popover().getByRole("radio").elements()).toHaveLength(8);
    await popover().getByRole("radio", { name: "Color 5" }).click();
    await popover().getByRole("button", { name: "Save" }).click();
    expect(changes(onEventsChange)[0]?.event.color).toBe("5");
  });

  test("eventFields leaves parts out, and renderEventFields adds the app's own", async () => {
    const onEventsChange = vi.fn();
    await render(
      <Calendar
        onEventsChange={onEventsChange}
        eventFields={["title", "time"]}
        renderEventFields={({ onChange }) => (
          <label>
            Room
            <input
              onChange={(input) => onChange({ room: input.target.value })}
            />
          </label>
        )}
      />,
    );
    await event(/^Planning/).click();
    await expect
      .element(popover().getByRole("radio").first())
      .not.toBeInTheDocument();
    await expect
      .element(popover().getByRole("textbox", { name: "Description" }))
      .not.toBeInTheDocument();
    await popover().getByRole("textbox", { name: "Room" }).fill("4B");
    await popover().getByRole("button", { name: "Save" }).click();
    expect(changes(onEventsChange)[0]?.event).toMatchObject({ room: "4B" });
  });

  test("onEditStart can keep it closed, and is told whether the event is new", async () => {
    const onEditStart = vi.fn((_, details) => details.preventDefault());
    await render(<Calendar onEditStart={onEditStart} />);
    await event(/^Planning/).click();
    await cell("Thursday, October 15, 2 PM").click();
    await expect.element(popover()).not.toBeInTheDocument();
    expect(onEditStart.mock.calls.map((call) => call[1].isNew)).toEqual([
      false,
      true,
    ]);
  });

  test("a click outside only closes it, and after Close a click makes an event", async () => {
    await render(<Calendar />);
    // Sunday, to the side of the popover, which opens beside Wednesday.
    await event(/^Planning/).click();
    await expect.element(popover()).toBeVisible();
    await cell("Sunday, October 11, 2 PM").click({
      position: { x: 5, y: 5 },
    });
    await expect.element(popover()).not.toBeInTheDocument();
    await event(/^Planning/).click();
    await popover().getByRole("button", { name: "Cancel" }).click();
    await cell("Sunday, October 11, 2 PM").click({
      position: { x: 5, y: 5 },
    });
    await expect
      .element(popover().getByRole("heading", { name: "New event" }))
      .toBeVisible();
  });

  test("onEventClick is called before it opens", async () => {
    const onEventClick = vi.fn();
    await render(<Calendar onEventClick={onEventClick} />);
    await event(/^Planning/).click();
    expect(onEventClick).toHaveBeenCalledWith(
      planning,
      expect.any(HTMLElement),
    );
    await expect.element(popover()).toBeVisible();
  });

  test.for(themes)("open, it has no axe violations in %s", async (theme) => {
    const { container } = await renderThemed(theme, <Calendar />);
    await event(/^Planning/).click();
    await expect.element(popover()).toBeVisible();
    // Measured once it has faded in, not halfway.
    await Promise.all(document.getAnimations().map((run) => run.finished));
    expect(await axe(container, outsideLandmarks)).toHaveNoViolations();
    expect(await axe(popover().element() as HTMLElement)).toHaveNoViolations();
  });
});

describe("deleting", () => {
  test("it asks first, and Cancel keeps the event", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    await event(/^Planning/).click();
    await popover().getByRole("button", { name: "Delete" }).click();
    const question = page.getByRole("alertdialog", {
      name: "Delete Planning?",
    });
    await expect.element(question).toBeVisible();
    await expect
      .element(question.getByRole("button", { name: "Cancel" }))
      .toHaveFocus();
    await question.getByRole("button", { name: "Cancel" }).click();
    expect(onEventsChange).not.toHaveBeenCalled();
    await expect.element(event(/^Planning/)).toHaveFocus();
  });

  test("Delete on an event deletes it, and the focus goes to its cell", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    (event(/^Planning/).element() as HTMLElement).focus();
    await userEvent.keyboard("{Delete}");
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Delete" })
      .click();
    expect(changes(onEventsChange)).toEqual([
      { type: "delete", event: planning },
    ]);
    await expect.element(cell("Wednesday, October 14, 10 AM")).toHaveFocus();
    await expect.poll(said).toBe("Deleted Planning.");
  });

  test("confirmDelete={false} deletes without asking", async () => {
    const onEventsChange = vi.fn();
    await render(
      <Calendar confirmDelete={false} onEventsChange={onEventsChange} />,
    );
    (event(/^Planning/).element() as HTMLElement).focus();
    await userEvent.keyboard("{Backspace}");
    await expect.element(page.getByRole("alertdialog")).not.toBeInTheDocument();
    expect(changes(onEventsChange)[0]?.type).toBe("delete");
  });

  test("in the agenda, the focus goes to the next event", async () => {
    await render(
      <Calendar
        defaultView="agenda"
        confirmDelete={false}
        defaultEvents={[
          planning,
          {
            id: "lunch",
            title: "Lunch",
            start: "2026-10-14T12:30",
            end: "2026-10-14T13:30",
          },
        ]}
      />,
    );
    (event(/^Planning/).element() as HTMLElement).focus();
    await userEvent.keyboard("{Delete}");
    await expect.element(event(/^Lunch/)).toHaveFocus();
  });
});

describe("read-only", () => {
  test("on the calendar, events open to be read", async () => {
    await render(<Calendar readOnly />);
    await event(/^Planning/).click();
    await expect
      .element(popover().getByRole("button", { name: "Close" }))
      .toBeVisible();
    await userEvent.keyboard("{Escape}");
    await cell("Thursday, October 15, 2 PM").click();
    await expect.element(popover()).not.toBeInTheDocument();
  });

  test("on an event, it wins over the calendar's, and it can't be picked up or deleted", async () => {
    const onEventsChange = vi.fn();
    await render(
      <Calendar
        onEventsChange={onEventsChange}
        defaultEvents={[{ ...planning, readOnly: true }]}
      />,
    );
    const fixed = event(/^Planning/);
    (fixed.element() as HTMLElement).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{Delete}");
    expect(fixed.element()).not.toHaveAttribute("aria-pressed");
    expect(onEventsChange).not.toHaveBeenCalled();
    expect(fixed.element().querySelector("[data-handle]")).toBeNull();
  });

  test("resizable chooses which ends have handles", async () => {
    await render(
      <Calendar defaultEvents={[{ ...planning, resizable: "end" }]} />,
    );
    const handles = event(/^Planning/)
      .element()
      .querySelectorAll("[data-handle]");
    expect(
      [...handles].map((handle) => handle.getAttribute("data-handle")),
    ).toEqual(["end"]);
  });
});

describe("from the keyboard", () => {
  test("Space picks an event up, the arrows move it, and Enter drops it", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    (event(/^Planning/).element() as HTMLElement).focus();
    await userEvent.keyboard(" ");
    await expect.poll(said).toMatch(/^Picked up Planning/);
    await expect.element(popover()).not.toBeInTheDocument();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowRight}");
    await expect.poll(said).toBe("10:30 AM to 12:30 PM, Thursday, October 15");
    // The event moves, and keeps the focus.
    await expect
      .element(event("Planning, 10:30 AM to 12:30 PM, Thursday, October 15"))
      .toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(changes(onEventsChange)[0]?.event).toMatchObject({
      start: "2026-10-15T10:30",
      end: "2026-10-15T12:30",
    });
    await expect.poll(said).toMatch(/^Dropped Planning/);
    await expect.element(popover()).not.toBeInTheDocument();
  });

  test("Shift and an arrow move only the end", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    (event(/^Planning/).element() as HTMLElement).focus();
    await userEvent.keyboard(" {Shift>}{ArrowUp}{/Shift} ");
    expect(changes(onEventsChange)[0]?.event).toMatchObject({
      start: "2026-10-14T10:00",
      end: "2026-10-14T11:45",
    });
  });

  test("Escape puts it back, and changes nothing", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    (event(/^Planning/).element() as HTMLElement).focus();
    await userEvent.keyboard(" {ArrowDown}{Escape}");
    await expect.poll(said).toBe("Planning put back.");
    expect(onEventsChange).not.toHaveBeenCalled();
    await expect
      .element(event("Planning, 10:00 AM to 12:00 PM, Wednesday, October 14"))
      .toHaveFocus();
  });

  test("a bar moves a week at a time up and down", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    (event(/^Offsite/).element() as HTMLElement).focus();
    await userEvent.keyboard(" {ArrowDown} ");
    expect(changes(onEventsChange)[0]?.event).toMatchObject({
      start: "2026-10-22",
      end: "2026-10-23",
    });
    // Off the week shown, the calendar went with it.
    await expect
      .element(page.getByRole("heading", { level: 2 }))
      .toHaveTextContent("October 18 – 24, 2026");
  });
});

describe("dragging", () => {
  test("an event dragged to another day keeps its length, and isn't opened", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    // Taken a little after ten, and let go as far after ten a day later.
    await drag(
      event(/^Planning/).element(),
      cell("Thursday, October 15, 10 AM").element(),
    );
    expect(changes(onEventsChange)[0]?.event).toMatchObject({
      start: "2026-10-15T10:00",
      end: "2026-10-15T12:00",
    });
    await expect.element(popover()).not.toBeInTheDocument();
    await expect.poll(said).toMatch(/^Dropped Planning/);
  });

  test("dragged onto the all-day row, it takes the day", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    // The row grows a lane for the event as it's dragged in, so the cell is
    // found again once it has, rather than left to a drag that waits for
    // it to keep still.
    const source = event(/^Planning/).element();
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
      cell("All day, Friday, October 16").element().getBoundingClientRect();
    pointer("pointerdown", start.x + 12, start.y + 12);
    pointer("pointermove", target().x + 12, target().y + 4);
    await expect
      .poll(() => document.querySelector("[data-preview]"))
      .not.toBeNull();
    pointer("pointermove", target().x + 12, target().y + 4);
    pointer("pointerup", target().x + 12, target().y + 4);
    expect(changes(onEventsChange)[0]?.event).toMatchObject({
      allDay: true,
      start: "2026-10-16",
      end: "2026-10-16",
    });
  });

  test("the preview is hidden from screen readers while it's dragged", async () => {
    await render(<Calendar />);
    const source = event(/^Planning/).element();
    const box = source.getBoundingClientRect();
    const target = cell("Thursday, October 15, 2 PM")
      .element()
      .getBoundingClientRect();
    source.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        pointerId: 1,
        pointerType: "mouse",
        button: 0,
        clientX: box.x + 10,
        clientY: box.y + 10,
      }),
    );
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        pointerId: 1,
        pointerType: "mouse",
        clientX: target.x + 10,
        clientY: target.y + 10,
      }),
    );
    await expect
      .poll(() => document.querySelector("[data-preview]"))
      .not.toBeNull();
    const preview = document.querySelector("[data-preview]");
    expect(preview).toHaveAttribute("aria-hidden", "true");
    expect(source).toHaveAttribute("data-dragging");
    await userEvent.keyboard("{Escape}");
    await expect
      .poll(() => document.querySelector("[data-preview]"))
      .toBeNull();
  });

  test("dragging across empty time opens a new event that long", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    await drag(
      cell("Thursday, October 15, 1 PM").element(),
      cell("Thursday, October 15, 3 PM").element(),
    );
    await expect.element(popover()).toBeVisible();
    await popover().getByRole("button", { name: "Save" }).click();
    // From a little after one to a little after three, to the quarter
    // hours either side.
    expect(changes(onEventsChange)[0]?.event).toMatchObject({
      start: "2026-10-15T13:00",
      end: "2026-10-15T15:15",
    });
  });

  test("in a month, an event moves by days", async () => {
    const onEventsChange = vi.fn();
    await render(
      <Calendar defaultView="month" onEventsChange={onEventsChange} />,
    );
    await drag(
      event(/^Offsite/).element(),
      cell("Tuesday, October 20").element(),
    );
    // Taken on its first day, the 15th, and let go on the 20th.
    expect(changes(onEventsChange)[0]?.event).toMatchObject({
      allDay: true,
      start: "2026-10-20",
      end: "2026-10-21",
    });
  });
});

describe("from elsewhere on the page", () => {
  test("an item dropped on a time is added there, for its length", async () => {
    const onEventsChange = vi.fn();
    await render(
      <>
        <div
          data-testid="task"
          {...eventDragProps({ title: "Write notes", duration: 90, ticket: 7 })}
        >
          Write notes
        </div>
        <Calendar onEventsChange={onEventsChange} />
      </>,
    );
    const task = page.getByTestId("task").element();
    const nine = cell("Thursday, October 15, 9 AM").element();
    const box = nine.getBoundingClientRect();
    const data = new DataTransfer();
    const at = { clientX: box.x + 5, clientY: box.y + 2 };
    task.dispatchEvent(
      new DragEvent("dragstart", { bubbles: true, dataTransfer: data }),
    );
    nine.dispatchEvent(
      new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        dataTransfer: data,
        ...at,
      }),
    );
    await expect
      .poll(() => document.querySelector("[data-preview]"))
      .not.toBeNull();
    nine.dispatchEvent(
      new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        dataTransfer: data,
        ...at,
      }),
    );
    task.dispatchEvent(new DragEvent("dragend", { bubbles: true }));
    const [change] = changes(onEventsChange);
    expect(change?.type).toBe("create");
    expect(change?.event).toMatchObject({
      title: "Write notes",
      ticket: 7,
      start: "2026-10-15T09:00",
      end: "2026-10-15T10:30",
    });
    expect(change?.event).not.toHaveProperty("duration");
    await expect.poll(said).toMatch(/^Added Write notes/);
  });

  test("an event dragged out asks onEventDropOutside, and goes if it says so", async () => {
    const onEventsChange = vi.fn();
    const onEventDropOutside = vi.fn(() => true);
    await render(
      <div style={{ display: "grid", gap: 16 }}>
        <div data-testid="list" style={{ blockSize: 80 }}>
          Unscheduled
        </div>
        <Calendar
          onEventsChange={onEventsChange}
          onEventDropOutside={onEventDropOutside}
        />
      </div>,
    );
    await drag(
      event(/^Planning/).element(),
      page.getByTestId("list").element(),
    );
    expect(onEventDropOutside).toHaveBeenCalledWith(
      planning,
      expect.objectContaining({ target: page.getByTestId("list").element() }),
    );
    expect(changes(onEventsChange)).toEqual([
      { type: "delete", event: planning },
    ]);
  });
});

describe("right to left", () => {
  test("the left arrow moves a picked-up event to the next day", async () => {
    const onEventsChange = vi.fn();
    await render(
      <DirectionProvider dir="rtl">
        <div dir="rtl">
          <Calendar onEventsChange={onEventsChange} />
        </div>
      </DirectionProvider>,
    );
    (event(/^Planning/).element() as HTMLElement).focus();
    await userEvent.keyboard(" {ArrowLeft} ");
    expect(changes(onEventsChange)[0]?.event).toMatchObject({
      start: "2026-10-15T10:00",
      end: "2026-10-15T12:00",
    });
  });
});

describe("in a time zone", () => {
  // Shown in New York, written on London's clock: London is five hours
  // ahead in October, before either changes to winter time.
  const call: CalendarEvent = {
    id: "call",
    title: "Call with London",
    start: "2026-10-14T15:00",
    end: "2026-10-14T16:00",
    timeZone: "Europe/London",
  };

  test("a moved event keeps being written on its own clock", async () => {
    const onEventsChange = vi.fn();
    await render(
      <Calendar
        timeZone="America/New_York"
        defaultEvents={[call]}
        onEventsChange={onEventsChange}
      />,
    );
    const shown = event(
      "Call with London, 10:00 AM to 11:00 AM, Wednesday, October 14",
    );
    (shown.element() as HTMLElement).focus();
    await userEvent.keyboard(" {ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown} ");
    expect(changes(onEventsChange)[0]?.event).toEqual({
      ...call,
      start: "2026-10-14T16:00",
      end: "2026-10-14T17:00",
    });
  });

  test("a new event is written on the clock of the zone shown", async () => {
    const onEventsChange = vi.fn();
    await render(
      <Calendar timeZone="America/New_York" onEventsChange={onEventsChange} />,
    );
    (cell("Thursday, October 15, 9 AM").element() as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");
    await popover().getByRole("button", { name: "Save" }).click();
    expect(changes(onEventsChange)[0]?.event).toMatchObject({
      start: "2026-10-15T09:00",
      end: "2026-10-15T10:00",
    });
  });
});

describe("on the server", () => {
  test("an editable calendar is drawn by a server, and edited once the browser has it", async () => {
    const node = (
      <EventCalendar
        aria-label="Server calendar"
        defaultEvents={[planning]}
        timeZone="UTC"
        today={today}
        defaultPanelOpen={false}
        style={{ inlineSize: 1100 }}
      />
    );
    const html = renderToString(node);
    // The ends that can be dragged, and the place for the words said as
    // events move, are in the server's HTML.
    expect(html).toContain("nuv-event-calendar__handle--end");
    expect(html).toContain('role="status"');
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    hydrateRoot(host, node);
    const button = await vi.waitFor(() => {
      const found = host.querySelector<HTMLElement>(
        '[data-event-id="planning"]',
      );
      if (!found) throw new Error("Not drawn yet");
      return found;
    });
    button.focus();
    await userEvent.keyboard(" {ArrowDown} ");
    await expect
      .poll(() =>
        host
          .querySelector('[data-event-id="planning"]')
          ?.getAttribute("aria-label"),
      )
      .toBe("Planning, 10:15 AM to 12:15 PM, Wednesday, October 14");
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
    host.remove();
  });
});
