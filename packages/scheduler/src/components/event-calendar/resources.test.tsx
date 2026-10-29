import "@nuvui/react/styles.css";
import "@nuvui/date-picker/styles.css";
import "../../styles/index.scss";
import { axe, outsideLandmarks } from "@nuvui/tooling/test/axe";
import { setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { useState } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { CalendarEvent, EventChange } from "../../core/events";
import type { CalendarResource } from "../../core/resources";
import { EventCalendar, type EventCalendarProps } from "./event-calendar";

// Every test is on Wednesday 14 October 2026, at half past ten, in UTC.
const today = new Date("2026-10-14T10:30:00Z");

const resources: CalendarResource[] = [
  {
    id: "rooms",
    title: "Rooms",
    color: "2",
    children: [
      { id: "4b", title: "Room 4B" },
      { id: "library", title: "The library", color: "5", readOnly: true },
    ],
  },
  { id: "ines", title: "Ines Porter", color: "6" },
];

const planning: CalendarEvent = {
  id: "planning",
  title: "Planning",
  start: "2026-10-14T10:00",
  end: "2026-10-14T11:00",
  resourceIds: ["4b"],
};
const reading: CalendarEvent = {
  id: "reading",
  title: "Reading group",
  start: "2026-10-14T13:00",
  end: "2026-10-14T14:00",
  resourceIds: ["library"],
};
const review: CalendarEvent = {
  id: "review",
  title: "Review",
  start: "2026-10-15T09:00",
  end: "2026-10-15T10:00",
  resourceIds: ["4b", "ines"],
};
const release: CalendarEvent = {
  id: "release",
  title: "Release",
  start: "2026-10-16",
  end: "2026-10-16",
  allDay: true,
};

let made = 0;

function Calendar(props: Partial<EventCalendarProps>) {
  return (
    <EventCalendar
      aria-label="Office calendar"
      defaultEvents={[planning, reading, review, release]}
      resources={resources}
      timeZone="UTC"
      today={today}
      scrollToHour={8}
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
const shown = (name: RegExp) =>
  [...document.querySelectorAll("button[data-event-id]")].some((button) =>
    name.test(button.getAttribute("aria-label") ?? ""),
  );
const box = (name: string) => page.getByRole("checkbox", { name, exact: true });
const popover = () => page.getByRole("dialog");
const changes = (spy: ReturnType<typeof vi.fn>) =>
  spy.mock.calls.map((call) => call[1] as EventChange);

beforeEach(async () => {
  await setViewport("desktop");
});

describe("the resources in the side panel", () => {
  test("are listed under a heading, each with a checkbox", async () => {
    await render(<Calendar />);
    await expect
      .element(page.getByRole("heading", { name: "Resources" }))
      .toBeVisible();
    for (const name of ["Rooms", "Room 4B", "The library", "Ines Porter"]) {
      await expect.element(box(name)).toBeChecked();
    }
  });

  test("hiding one hides its events, and keeps those with another shown", async () => {
    await render(<Calendar />);
    await box("Room 4B").click();
    await expect.element(box("Room 4B")).not.toBeChecked();
    expect(shown(/^Planning/)).toBe(false);
    expect(shown(/^Review/)).toBe(true);
    expect(shown(/^Release/)).toBe(true);
    await expect.element(box("Rooms")).toHaveAttribute("aria-checked", "mixed");
  });

  test("a group hides and shows everything in it", async () => {
    await render(<Calendar />);
    await box("Rooms").click();
    await expect.element(box("The library")).not.toBeChecked();
    expect(shown(/^Planning/)).toBe(false);
    expect(shown(/^Reading group/)).toBe(false);
    await box("Rooms").click();
    await expect.element(box("Room 4B")).toBeChecked();
    expect(shown(/^Planning/)).toBe(true);
  });

  test("a group folds away what's inside it", async () => {
    await render(<Calendar />);
    const fold = page.getByRole("button", { name: "Resources in Rooms" });
    await expect.element(fold).toHaveAttribute("aria-expanded", "true");
    await fold.click();
    await expect.element(fold).toHaveAttribute("aria-expanded", "false");
    await expect.element(box("Room 4B")).not.toBeInTheDocument();
    // Folded, and still shown.
    expect(shown(/^Planning/)).toBe(true);
  });

  test("which are hidden and folded can be held by the app", async () => {
    const onHidden = vi.fn();
    const onCollapsed = vi.fn();
    function Held() {
      const [hidden, setHidden] = useState<string[]>(["ines"]);
      return (
        <Calendar
          hiddenResources={hidden}
          onHiddenResourcesChange={(next) => {
            onHidden(next);
            setHidden(next);
          }}
          defaultCollapsedResources={["rooms"]}
          onCollapsedResourcesChange={onCollapsed}
        />
      );
    }
    await render(<Held />);
    await expect.element(box("Ines Porter")).not.toBeChecked();
    await expect.element(box("Room 4B")).not.toBeInTheDocument();
    await box("Ines Porter").click();
    expect(onHidden).toHaveBeenLastCalledWith([]);
    await page.getByRole("button", { name: "Resources in Rooms" }).click();
    expect(onCollapsed).toHaveBeenLastCalledWith([]);
  });

  test("aren't there without resources", async () => {
    await render(<Calendar resources={[]} />);
    await expect
      .element(page.getByRole("heading", { name: "Resources" }))
      .not.toBeInTheDocument();
  });

  test.for(themes)("open, it has no axe violations in %s", async (theme) => {
    const { container } = await renderThemed(theme, <Calendar />);
    await box("Room 4B").click();
    await page.getByRole("button", { name: "Resources in Rooms" }).click();
    expect(await axe(container, outsideLandmarks)).toHaveNoViolations();
  });
});

describe("events on resources", () => {
  test("take their color from their resource, or the one it's in", async () => {
    await render(<Calendar />);
    const color = (name: RegExp) =>
      (event(name).element() as HTMLElement).style.getPropertyValue(
        "--nuv-event-color",
      );
    expect(color(/^Planning/)).toBe("var(--color-chart-2)");
    expect(color(/^Reading group/)).toBe("var(--color-chart-5)");
    expect(color(/^Release/)).toBe("var(--color-chart-1)");
  });

  test("say their resources in their names", async () => {
    await render(<Calendar />);
    await expect
      .element(event(/^Review, .*, Room 4B, Ines Porter$/))
      .toBeInTheDocument();
  });

  test("list their resources in the agenda", async () => {
    await render(<Calendar defaultView="agenda" />);
    const item = event(/^Review/).element();
    expect(
      item.querySelector(".nuv-event-calendar__event-resource")?.textContent,
    ).toBe("Room 4B, Ines Porter");
  });

  test("of a read-only resource open to be read, and can't be moved", async () => {
    await render(<Calendar />);
    await expect
      .element(event(/^Reading group/))
      .not.toHaveAttribute("data-movable");
    await expect.element(event(/^Planning/)).toHaveAttribute("data-movable");
    await event(/^Reading group/).click();
    await expect.element(popover()).toBeVisible();
    await expect.element(popover().getByText("The library")).toBeVisible();
    await expect
      .element(popover().getByRole("button", { name: "Save" }))
      .not.toBeInTheDocument();
  });

  test("an event's own setting wins over its resource's", async () => {
    await render(
      <Calendar
        defaultEvents={[{ ...reading, readOnly: false, color: "8" }]}
      />,
    );
    await expect
      .element(event(/^Reading group/))
      .toHaveAttribute("data-movable");
  });
});

describe("the resource in the popover", () => {
  test("is chosen from a list, and saved", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    await event(/^Planning/).click();
    const trigger = popover().getByRole("combobox", { name: "Resource" });
    await expect.element(trigger).toHaveTextContent("Room 4B");
    await trigger.click();
    await page.getByRole("option", { name: "Ines Porter" }).click();
    await expect.element(trigger).toHaveTextContent("Ines Porter");
    // Choosing from the list leaves the popover open.
    await expect.element(popover()).toBeVisible();
    await popover().getByRole("button", { name: "Save" }).click();
    const [change] = changes(onEventsChange);
    expect(change?.type).toBe("update");
    expect(change?.event.resourceIds).toEqual(["ines"]);
  });

  test("can be none, which takes it off the event", async () => {
    const onEventsChange = vi.fn();
    await render(<Calendar onEventsChange={onEventsChange} />);
    await event(/^Planning/).click();
    await popover().getByRole("combobox", { name: "Resource" }).click();
    await page.getByRole("option", { name: "None" }).click();
    await popover().getByRole("button", { name: "Save" }).click();
    expect(changes(onEventsChange)[0]?.event).not.toHaveProperty("resourceIds");
  });

  test("isn't there without resources, or when left out", async () => {
    await render(
      <Calendar eventFields={["title", "time", "color", "description"]} />,
    );
    await event(/^Planning/).click();
    await expect.element(popover()).toBeVisible();
    await expect
      .element(popover().getByRole("combobox", { name: "Resource" }))
      .not.toBeInTheDocument();
  });

  test("with several, says how many and keeps the list open", async () => {
    await render(<Calendar multipleResources />);
    await event(/^Review/).click();
    const trigger = popover().getByRole("combobox", { name: "Resources" });
    await expect.element(trigger).toHaveTextContent("2 resources");
    await trigger.click();
    await page.getByRole("option", { name: "The library" }).click();
    await expect
      .element(page.getByRole("option", { name: "Room 4B" }))
      .toBeVisible();
    await expect.element(trigger).toHaveTextContent("3 resources");
  });

  test("required, a new event has the first shown, and none isn't offered", async () => {
    const onEventsChange = vi.fn();
    await render(
      <Calendar
        resourceRequired
        defaultHiddenResources={["4b"]}
        onEventsChange={onEventsChange}
      />,
    );
    await page.getByRole("gridcell", { name: /October 14, 3 PM$/ }).click();
    const trigger = popover().getByRole("combobox", { name: "Resource" });
    await expect.element(trigger).toHaveTextContent("The library");
    await trigger.click();
    await expect
      .element(page.getByRole("option", { name: "None" }))
      .not.toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await popover().getByRole("button", { name: "Save" }).click();
    expect(changes(onEventsChange)[0]?.event.resourceIds).toEqual(["library"]);
  });
});

describe("the app's own field names", () => {
  interface Booking {
    bookingId: string;
    subject: string;
    from: string;
    to: string;
    roomCode: string;
    bookedBy?: string;
  }
  const bookings: Booking[] = [
    {
      bookingId: "b-1",
      subject: "Interviews",
      from: "2026-10-14T10:00",
      to: "2026-10-14T11:00",
      roomCode: "2A",
      bookedBy: "Wren Halloway",
    },
  ];
  const rooms = [
    { code: "2A", name: "Room 2A", tint: "3" },
    { code: "4B", name: "Room 4B", tint: "4" },
  ];

  test("are read, and changes come back under them", async () => {
    const onEventsChange = vi.fn();
    const onEventClick = vi.fn();
    await render(
      <EventCalendar
        aria-label="Bookings"
        events={bookings}
        onEventsChange={onEventsChange}
        onEventClick={onEventClick}
        eventKeys={{
          id: "bookingId",
          title: "subject",
          start: "from",
          end: "to",
          resourceIds: "roomCode",
        }}
        resources={rooms}
        resourceKeys={{ id: "code", title: "name", color: "tint" }}
        timeZone="UTC"
        today={today}
        scrollToHour={8}
        style={{ inlineSize: 1100 }}
      />,
    );
    const interviews = event(/^Interviews, .*, Room 2A$/);
    await expect.element(interviews).toBeInTheDocument();
    expect(
      (interviews.element() as HTMLElement).style.getPropertyValue(
        "--nuv-event-color",
      ),
    ).toBe("var(--color-chart-3)");
    await interviews.click();
    expect(onEventClick.mock.calls[0]?.[0]).toBe(bookings[0]);
    await popover().getByRole("combobox", { name: "Resource" }).click();
    await page.getByRole("option", { name: "Room 4B" }).click();
    await popover().getByRole("button", { name: "Save" }).click();
    const [next, change] = onEventsChange.mock.calls[0] as [
      Booking[],
      EventChange<Booking>,
    ];
    expect(next[0]).toEqual({ ...bookings[0], roomCode: "4B" });
    expect(change.type === "update" && change.previous).toBe(bookings[0]);
  });
});
