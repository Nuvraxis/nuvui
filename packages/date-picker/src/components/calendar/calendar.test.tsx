import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { TZDate } from "@date-fns/tz";
import { DirectionProvider } from "@nuvui/react/direction";
import { axe } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { format } from "date-fns";
import { createRef, type ReactNode, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { es } from "../../locale";
import { Calendar, type CalendarProps, type DateRange } from "./calendar";

// Every test shows October 2026, with the 7th as today. The first of the
// month is a Thursday.
const today = new Date(2026, 9, 7);
const october = (day: number) => new Date(2026, 9, day);
const base = { today, defaultMonth: today } as const;

function Single(props: Partial<CalendarProps> & { initial?: Date }) {
  const { initial, ...rest } = props;
  const [selected, setSelected] = useState<Date | undefined>(initial);
  return (
    <Calendar
      {...base}
      {...(rest as object)}
      mode="single"
      selected={selected}
      onSelect={setSelected}
    />
  );
}

function Range({ initial }: { initial?: DateRange }) {
  const [selected, setSelected] = useState<DateRange | undefined>(initial);
  return (
    <Calendar
      {...base}
      mode="range"
      selected={selected}
      onSelect={setSelected}
    />
  );
}

const grid = (name = "October 2026") => page.getByRole("grid", { name });
const day = (name: string | RegExp) => page.getByRole("button", { name });
const cell = (date: number) =>
  document.querySelector(
    `[data-day="2026-10-${String(date).padStart(2, "0")}"]`,
  ) as HTMLElement;
const previous = () => page.getByRole("button", { name: /previous month/i });
const next = () => page.getByRole("button", { name: /next month/i });
// The names of the days are hidden from screen readers, because every day
// already says which day of the week it is. So they're found by class.
const weekdays = () => [
  ...document.querySelectorAll<HTMLElement>(".nuv-calendar__weekday"),
];
const focused = () => document.activeElement?.getAttribute("aria-label");

describe("rendering", () => {
  test("shows a month as a grid with the days of the week over it", async () => {
    await render(<Calendar {...base} />);
    await expect.element(grid()).toBeVisible();
    const headers = weekdays();
    expect(headers.map((header) => header.textContent)).toEqual([
      "Su",
      "Mo",
      "Tu",
      "We",
      "Th",
      "Fr",
      "Sa",
    ]);
    expect(headers[0]).toHaveAttribute("aria-label", "Sunday");
    expect(page.getByRole("gridcell").elements()).toHaveLength(31);
  });

  test("with no mode, the days are text and nothing can be picked", async () => {
    await render(<Calendar {...base} />);
    expect(cell(15).querySelector("button")).toBeNull();
    expect(cell(15)).toHaveTextContent("15");
  });

  test("the month's name is announced when it changes", async () => {
    await render(<Calendar {...base} />);
    const name = page.getByRole("status");
    await expect.element(name).toHaveTextContent("October 2026");
    await next().click();
    await expect.element(name).toHaveTextContent("November 2026");
    await expect.element(grid("November 2026")).toBeVisible();
  });

  test("forwards its ref and keeps class names", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <Calendar
        {...base}
        ref={ref}
        className="mine"
        classNames={{ weekday: "day-name" }}
        data-testid="calendar"
      />,
    );
    expect(ref.current).toBe(page.getByTestId("calendar").element());
    expect(ref.current).toHaveClass("nuv-calendar", "mine");
    expect(weekdays()[0]).toHaveClass("nuv-calendar__weekday", "day-name");
  });

  test("several months sit side by side, with one button at each end", async () => {
    await render(<Calendar {...base} numberOfMonths={2} />);
    await expect.element(grid("October 2026")).toBeVisible();
    await expect.element(grid("November 2026")).toBeVisible();
    expect(page.getByRole("button").elements()).toHaveLength(2);
  });

  test("the month and the year can be lists to choose from", async () => {
    await render(
      <Calendar
        {...base}
        captionLayout="dropdown"
        startMonth={new Date(2020, 0)}
        endMonth={new Date(2030, 11)}
      />,
    );
    const year = page.getByRole("combobox", { name: /year/i });
    await expect
      .element(page.getByRole("combobox", { name: /month/i }))
      .toHaveTextContent("October");
    await year.click();
    await page.getByRole("option", { name: "2028" }).click();
    await expect.element(grid("October 2028")).toBeVisible();
    await expect.element(year).toHaveTextContent("2028");
  });

  test("a list works from the keyboard, and gives focus back", async () => {
    await render(<Calendar {...base} captionLayout="dropdown" />);
    const month = page.getByRole("combobox", { name: /month/i });
    (month.element() as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");
    await expect
      .element(page.getByRole("option", { name: "October" }))
      .toHaveFocus();
    // Radix moves to the next option a moment after the key, so Enter waits
    // for it.
    await userEvent.keyboard("{ArrowDown}");
    await expect
      .element(page.getByRole("option", { name: "November" }))
      .toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect.element(grid("November 2026")).toBeVisible();
    await expect.element(month).toHaveFocus();
  });

  test("a month outside the earliest and latest can't be chosen", async () => {
    await render(
      <Calendar
        {...base}
        captionLayout="dropdown"
        startMonth={new Date(2026, 2)}
        endMonth={new Date(2027, 5)}
      />,
    );
    await page.getByRole("combobox", { name: /month/i }).click();
    await expect
      .element(page.getByRole("option", { name: "January" }))
      .toHaveAttribute("aria-disabled", "true");
    await expect
      .element(page.getByRole("option", { name: "March" }))
      .not.toHaveAttribute("aria-disabled");
  });

  test("the list of years is kept short enough to scroll", async () => {
    await render(
      <Calendar
        {...base}
        captionLayout="dropdown"
        startMonth={new Date(1930, 0)}
        endMonth={new Date(2030, 11)}
      />,
    );
    await page.getByRole("combobox", { name: /year/i }).click();
    const list = page.getByRole("listbox");
    await expect.element(list).toBeVisible();
    expect(list.element().getBoundingClientRect().height).toBeLessThanOrEqual(
      18 * 16,
    );
    await expect
      .element(page.getByRole("option", { name: "2026" }))
      .toBeInViewport();
  });
});

describe("picking", () => {
  test("a click picks one day, and it says it's picked", async () => {
    await render(<Single />);
    await day("Thursday, October 15th, 2026").click();
    await expect
      .element(day("Thursday, October 15th, 2026, selected"))
      .toBeVisible();
    expect(cell(15)).toHaveAttribute("aria-selected", "true");
    expect(cell(14)).not.toHaveAttribute("aria-selected");
  });

  test("today is named as today", async () => {
    await render(<Single />);
    await expect
      .element(day("Today, Wednesday, October 7th, 2026"))
      .toBeVisible();
  });

  test("picks several days", async () => {
    function Several() {
      const [selected, setSelected] = useState<Date[] | undefined>();
      return (
        <Calendar
          {...base}
          mode="multiple"
          selected={selected}
          onSelect={setSelected}
        />
      );
    }
    await render(<Several />);
    await day(/October 15th/).click();
    await day(/October 20th/).click();
    expect(cell(15)).toHaveAttribute("aria-selected", "true");
    expect(cell(20)).toHaveAttribute("aria-selected", "true");
    await expect
      .element(grid())
      .toHaveAttribute("aria-multiselectable", "true");
  });

  test("picks a range, and marks its two ends and what's between", async () => {
    await render(<Range />);
    await day(/October 12th/).click();
    await day(/October 15th/).click();
    expect(cell(12)).toHaveClass("nuv-calendar__day--range-start");
    expect(cell(13)).toHaveClass("nuv-calendar__day--range-middle");
    expect(cell(15)).toHaveClass("nuv-calendar__day--range-end");
    for (const date of [12, 13, 14, 15]) {
      expect(cell(date)).toHaveAttribute("aria-selected", "true");
    }
    expect(cell(16)).not.toHaveAttribute("aria-selected");
  });

  test("a disabled day can't be picked", async () => {
    const onSelect = vi.fn();
    await render(
      <Calendar
        {...base}
        mode="single"
        onSelect={onSelect}
        disabled={[{ dayOfWeek: [0, 6] }, october(15)]}
      />,
    );
    await expect.element(day(/Saturday, October 10th/)).toBeDisabled();
    await expect.element(day(/October 15th/)).toBeDisabled();
    await day(/October 15th/).click({ force: true });
    expect(onSelect).not.toHaveBeenCalled();
    await day(/October 14th/).click();
    expect(onSelect).toHaveBeenCalledOnce();
  });

  test("the months stop where they're told to", async () => {
    await render(
      <Single startMonth={october(1)} endMonth={new Date(2026, 10, 30)} />,
    );
    await expect.element(previous()).toHaveAttribute("aria-disabled", "true");
    await previous().click({ force: true });
    await expect.element(grid("October 2026")).toBeVisible();
    await next().click();
    await expect.element(grid("November 2026")).toBeVisible();
    await expect.element(next()).toHaveAttribute("aria-disabled", "true");
  });
});

describe("keyboard", () => {
  test("Tab reaches the buttons and one day, in the order they're drawn", async () => {
    await render(<Single />);
    await userEvent.keyboard("{Tab}");
    await expect.element(previous()).toHaveFocus();
    await userEvent.keyboard("{Tab}");
    await expect.element(next()).toHaveFocus();
    await userEvent.keyboard("{Tab}");
    expect(focused()).toBe("Today, Wednesday, October 7th, 2026");
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(document.body);
  });

  test("Tab goes to the picked day when there is one", async () => {
    await render(<Single initial={october(20)} />);
    await userEvent.keyboard("{Tab}{Tab}{Tab}");
    expect(focused()).toBe("Tuesday, October 20th, 2026, selected");
  });

  test("the arrow keys move by a day and by a week", async () => {
    await render(<Single />);
    await userEvent.keyboard("{Tab}{Tab}{Tab}");
    await userEvent.keyboard("{ArrowRight}");
    await vi.waitFor(() => expect(focused()).toMatch(/October 8th/));
    await userEvent.keyboard("{ArrowDown}");
    await vi.waitFor(() => expect(focused()).toMatch(/October 15th/));
    await userEvent.keyboard("{ArrowLeft}");
    await vi.waitFor(() => expect(focused()).toMatch(/October 14th/));
    await userEvent.keyboard("{ArrowUp}");
    await vi.waitFor(() => expect(focused()).toMatch(/October 7th/));
  });

  test("Home and End go to the ends of the week, Page Up and Down to the next month", async () => {
    await render(<Single />);
    await userEvent.keyboard("{Tab}{Tab}{Tab}");
    await userEvent.keyboard("{Home}");
    await vi.waitFor(() => expect(focused()).toMatch(/Sunday, October 4th/));
    await userEvent.keyboard("{End}");
    await vi.waitFor(() => expect(focused()).toMatch(/Saturday, October 10th/));
    await userEvent.keyboard("{PageDown}");
    await vi.waitFor(() => expect(focused()).toMatch(/November 10th/));
    await expect.element(grid("November 2026")).toBeVisible();
    await userEvent.keyboard("{PageUp}");
    await vi.waitFor(() => expect(focused()).toMatch(/October 10th/));
  });

  test("an arrow key past the end of the month shows the next one", async () => {
    await render(<Single initial={october(31)} />);
    await userEvent.keyboard("{Tab}{Tab}{Tab}{ArrowRight}");
    await vi.waitFor(() => expect(focused()).toMatch(/November 1st/));
    await expect.element(grid("November 2026")).toBeVisible();
  });

  test("Enter and Space pick the day the keyboard is on", async () => {
    await render(<Single />);
    await userEvent.keyboard("{Tab}{Tab}{Tab}{ArrowRight}");
    await vi.waitFor(() => expect(focused()).toMatch(/October 8th/));
    await userEvent.keyboard("{Enter}");
    expect(cell(8)).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowRight}");
    await vi.waitFor(() => expect(focused()).toMatch(/October 9th/));
    await userEvent.keyboard(" ");
    expect(cell(9)).toHaveAttribute("aria-selected", "true");
  });

  test("the day with keyboard focus has a ring that stands out", async () => {
    await render(<Single />);
    await userEvent.keyboard("{Tab}{Tab}{Tab}");
    const style = getComputedStyle(document.activeElement as Element);
    expect(style.outlineStyle).toBe("solid");
    expect(
      contrast(
        style.outlineColor,
        getComputedStyle(document.body).backgroundColor,
      ),
    ).toBeGreaterThanOrEqual(3);
  });
});

describe("languages, weeks and time zones", () => {
  test("a locale translates the month, the days and the buttons", async () => {
    await render(<Single locale={es} />);
    await expect.element(grid("octubre 2026")).toBeVisible();
    // Weeks start on Monday in Spain.
    expect(weekdays()[0]).toHaveAttribute("aria-label", "lunes");
    await expect
      .element(page.getByRole("button", { name: "Ir al mes siguiente" }))
      .toBeVisible();
    await expect
      .element(day("Hoy, miércoles, 7 de octubre de 2026"))
      .toBeVisible();
  });

  test("the week can start on any day", async () => {
    await render(<Single weekStartsOn={6} />);
    expect(weekdays()[0]).toHaveAttribute("aria-label", "Saturday");
  });

  test("labels can be replaced one by one", async () => {
    await render(
      <Single
        labels={{ labelNext: () => "Later", labelPrevious: () => "Earlier" }}
      />,
    );
    await expect
      .element(page.getByRole("button", { name: "Later" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Earlier" }))
      .toBeVisible();
  });

  test.for(["Pacific/Kiritimati", "Pacific/Pago_Pago"])(
    "in %s, the day picked is the day that was pressed",
    async (timeZone) => {
      const onSelect = vi.fn();
      await render(
        <Calendar
          mode="single"
          timeZone={timeZone}
          today={new TZDate(2026, 9, 7, timeZone)}
          defaultMonth={new TZDate(2026, 9, 7, timeZone)}
          onSelect={onSelect}
        />,
      );
      await day(/October 15th/).click();
      const picked = onSelect.mock.lastCall?.[0] as Date;
      expect(picked).toBeInstanceOf(TZDate);
      expect(format(picked, "yyyy-MM-dd")).toBe("2026-10-15");
    },
  );
});

describe("right to left", () => {
  test("takes its direction from the provider, and the arrow keys follow it", async () => {
    await render(
      <DirectionProvider dir="rtl">
        <div dir="rtl">
          <Single data-testid="calendar" />
        </div>
      </DirectionProvider>,
    );
    await expect
      .element(page.getByTestId("calendar"))
      .toHaveAttribute("dir", "rtl");
    await userEvent.keyboard("{Tab}{Tab}{Tab}{ArrowLeft}");
    await vi.waitFor(() => expect(focused()).toMatch(/October 8th/));
    // The button for the month before is on the right.
    const before = previous().element().getBoundingClientRect();
    const after = next().element().getBoundingClientRect();
    expect(before.left).toBeGreaterThan(after.left);
  });

  test("a range fills toward its other end", async () => {
    await render(
      <div dir="rtl">
        <Calendar
          {...base}
          dir="rtl"
          mode="range"
          selected={{ from: october(12), to: october(14) }}
        />
      </div>,
    );
    const start = getComputedStyle(cell(12)).backgroundImage;
    expect(start).toContain("to left");
    expect(cell(12).getBoundingClientRect().left).toBeGreaterThan(
      cell(14).getBoundingClientRect().left,
    );
  });
});

describe("sizes", () => {
  test("with a mouse, a day is as tall as a control", async () => {
    await render(<Single />);
    const button = day(/October 15th/)
      .element()
      .getBoundingClientRect();
    expect(button.width).toBe(40);
    expect(button.height).toBe(40);
  });

  test.for([
    ["compact", 36],
    ["comfortable", 44],
  ] as const)("at %s density a day is %spx", async ([density, size]) => {
    document.documentElement.setAttribute("data-density", density);
    await render(<Single />);
    const button = day(/October 15th/)
      .element()
      .getBoundingClientRect();
    expect(button.height).toBe(size);
  });

  test("one variable sets the size of a day", async () => {
    await render(
      <div
        style={{ "--nuv-calendar-cell-size": "3rem" } as React.CSSProperties}
      >
        <Single />
      </div>,
    );
    expect(
      day(/October 15th/)
        .element()
        .getBoundingClientRect().width,
    ).toBe(48);
  });

  test("fits a phone's screen", async () => {
    await render(
      <div style={{ padding: 16 }}>
        <Single />
      </div>,
    );
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });
});

describe("how it looks", () => {
  test("a picked day is filled, and today has a ring", async () => {
    await render(<Single initial={october(15)} />);
    const picked = getComputedStyle(
      cell(15).querySelector("button") as Element,
    );
    const now = getComputedStyle(cell(7).querySelector("button") as Element);
    const plain = getComputedStyle(cell(8).querySelector("button") as Element);
    const page = getComputedStyle(document.body).backgroundColor;

    expect(contrast(picked.backgroundColor, page)).toBeGreaterThanOrEqual(3);
    expect(contrast(now.borderTopColor, page)).toBeGreaterThanOrEqual(3);
    expect(plain.borderTopStyle).toBe("none");
  });
});

describe("rendered on a server", () => {
  let tidy = () => {};
  afterEach(() => {
    tidy();
    vi.useRealTimers();
  });

  // Renders to HTML at one moment and lets React take that HTML over at
  // another, as happens to a page that was built or cached before it was
  // opened. Anything React had to throw away and redo is in `errors`.
  function serve(node: ReactNode, serverTime: Date, browserTime: Date) {
    vi.useFakeTimers({ toFake: ["Date"], now: serverTime });
    const html = renderToString(node);
    vi.setSystemTime(browserTime);

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const errors: unknown[] = [];
    const root = hydrateRoot(container, node, {
      onRecoverableError: (error) => errors.push(error),
    });
    tidy = () => {
      root.unmount();
      container.remove();
    };
    return { html, errors };
  }

  const january = new Date(2026, 0, 31, 23, 59);
  const february = new Date(2026, 1, 1, 0, 1);

  test("the server marks no day as today, and the browser fills it in", async () => {
    const { html, errors } = serve(
      <Calendar mode="single" defaultMonth={new Date(2026, 1, 1)} />,
      january,
      february,
    );
    expect(html).toContain("February 2026");
    expect(html).not.toContain("Today");
    expect(html).not.toContain("data-pending");

    await expect
      .element(day("Today, Sunday, February 1st, 2026"))
      .toBeVisible();
    expect(errors).toEqual([]);
  });

  test("with nothing to say which month to show, it waits for the browser", async () => {
    const { html, errors } = serve(
      <Calendar mode="single" data-testid="calendar" />,
      january,
      february,
    );
    // Hidden, and holding its place.
    expect(html).toContain("data-pending");
    expect(html).not.toContain("January 2026");
    expect(html).not.toContain("Today");
    expect(html).not.toContain("nuv-calendar__day-button");

    await expect.element(grid("February 2026")).toBeVisible();
    await expect
      .element(day("Today, Sunday, February 1st, 2026"))
      .toBeVisible();
    await expect
      .element(page.getByTestId("calendar"))
      .not.toHaveAttribute("data-pending");
    expect(errors).toEqual([]);
  });

  test("dates worked out from the time don't reach the server's HTML", async () => {
    function Bookable() {
      const now = new Date();
      return (
        <Calendar mode="single" startMonth={now} disabled={{ before: now }} />
      );
    }
    const { html, errors } = serve(<Bookable />, january, february);
    expect(html).not.toContain("2026");

    await expect.element(grid("February 2026")).toBeVisible();
    await expect.element(day(/February 1st/)).toBeEnabled();
    expect(errors).toEqual([]);
  });

  test("a date given as today is used as it is", async () => {
    const { html, errors } = serve(
      <Calendar {...base} mode="single" />,
      january,
      february,
    );
    expect(html).toContain("Today, Wednesday, October 7th, 2026");
    await expect.element(grid("October 2026")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("rendered in the browser from the start, it shows today at once", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: february });
    await render(<Calendar mode="single" data-testid="calendar" />);
    expect(page.getByTestId("calendar").element()).not.toHaveAttribute(
      "data-pending",
    );
    await expect.element(grid("February 2026")).toBeVisible();
  });
});

describe("accessibility", () => {
  test.for(themes)("one day picked, in %s", async (theme) => {
    const { container } = await renderThemed(
      theme,
      <Calendar
        {...base}
        mode="single"
        selected={october(15)}
        disabled={{ dayOfWeek: [0, 6] }}
        showOutsideDays
        aria-label="Delivery date"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  test.for(themes)("a range picked, in %s", async (theme) => {
    const { container } = await renderThemed(
      theme,
      <Calendar
        {...base}
        mode="range"
        selected={{ from: october(5), to: october(9) }}
        captionLayout="dropdown"
        showWeekNumber
        footer="5 nights"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
