import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { TZDate } from "@date-fns/tz";
import { Button } from "@nuvui/react/button";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@nuvui/react/field";
import { axe, outsideLandmarks } from "@nuvui/tooling/test/axe";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { setPageTheme, themes } from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef, type FormEvent } from "react";
import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { de } from "../../locale";
import type { DateRange } from "../calendar/calendar";
import {
  DatePicker,
  type DatePickerProps,
  DateRangePicker,
  type DateRangePickerProps,
} from "./date-picker";

// Every calendar opens on October 2026, with the 7th as today.
const today = new Date(2026, 9, 7);
const october = (day: number) => new Date(2026, 9, day);
const calendar = { today, defaultMonth: today };

// ComponentProps and not DatePickerProps, so a test can pass a ref.
function Example(props: ComponentProps<typeof DatePicker>) {
  return (
    <div style={{ padding: 16 }}>
      <DatePicker aria-label="Due date" calendar={calendar} {...props} />
      <Button intent="ghost">After</Button>
    </div>
  );
}

function RangeExample(props: DateRangePickerProps) {
  return (
    <div style={{ padding: 16 }}>
      <DateRangePicker aria-label="Stay" calendar={calendar} {...props} />
      <Button intent="ghost">After</Button>
    </div>
  );
}

const field = () => page.getByRole("textbox", { name: "Due date" });
const button = () => page.getByRole("button", { name: /^Choose date/ });
const popup = () => page.getByRole("dialog", { name: "Choose date" });
// Looked for inside the calendar, because the button that opens it reads
// out the picked date too.
const day = (name: string | RegExp) =>
  page.getByRole("dialog").getByRole("button", { name });
const startField = () => page.getByRole("textbox", { name: "Start date" });
const endField = () => page.getByRole("textbox", { name: "End date" });
const rangeButton = () => page.getByRole("button", { name: /^Choose dates/ });
const rangePopup = () => page.getByRole("dialog", { name: "Choose dates" });
const input = (locator = field()) => locator.element() as HTMLInputElement;
// What a mock was last called with.
const last = <T,>(mock: Mock) => mock.mock.lastCall?.[0] as T;
const focused = () => document.activeElement?.getAttribute("aria-label");

// Wide enough that the calendar opens next to the field. The tests for the
// sheet set the phone's size themselves.
beforeEach(async () => {
  await setViewport("desktop");
});

describe("rendering", () => {
  test("is a text field with a button, and no calendar until it's asked for", async () => {
    await render(<Example />);
    await expect.element(field()).toBeVisible();
    await expect.element(field()).toHaveAttribute("placeholder", "mm/dd/yyyy");
    await expect.element(button()).toHaveAttribute("aria-haspopup", "dialog");
    await expect.element(button()).toHaveAttribute("aria-expanded", "false");
    expect(page.getByRole("dialog").elements()).toHaveLength(0);
  });

  test("shows the date it starts with, written the locale's way", async () => {
    await render(<Example defaultValue={october(15)} />);
    await expect.element(field()).toHaveValue("10/15/2026");
    await expect
      .element(button())
      .toHaveAccessibleName("Choose date, Thursday, October 15th, 2026");
  });

  test("the ref is the text field, and the class goes on the box", async () => {
    const ref = createRef<HTMLInputElement>();
    await render(<Example ref={ref} className="mine" />);
    expect(ref.current).toBe(input());
    expect(ref.current?.parentElement).toHaveClass(
      "nuv-input-group",
      "nuv-date-picker",
      "mine",
    );
  });

  test("the date can be controlled", async () => {
    const onValueChange = vi.fn();
    const { rerender } = await render(
      <Example value={october(15)} onValueChange={onValueChange} />,
    );
    await button().click();
    await day(/October 20th/).click();
    expect(last<Date>(onValueChange).getDate()).toBe(20);
    // Nothing changes until the parent says so.
    await expect.element(field()).toHaveValue("10/15/2026");
    await rerender(
      <Example value={october(20)} onValueChange={onValueChange} />,
    );
    await expect.element(field()).toHaveValue("10/20/2026");
    await rerender(<Example value={null} onValueChange={onValueChange} />);
    await expect.element(field()).toHaveValue("");
  });

  test("the calendar can be controlled", async () => {
    const onOpenChange = vi.fn();
    const { rerender } = await render(
      <Example open={false} onOpenChange={onOpenChange} />,
    );
    await button().click();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(page.getByRole("dialog").elements()).toHaveLength(0);
    await rerender(<Example open onOpenChange={onOpenChange} />);
    await expect.element(popup()).toBeVisible();
  });

  test("renders the calendar into a container when given one", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    await render(<Example defaultOpen container={container} />);
    await expect.element(popup()).toBeVisible();
    expect(container.contains(popup().element())).toBe(true);
    container.remove();
  });

  test("a disabled field can't be typed in or opened", async () => {
    await render(<Example disabled />);
    await expect.element(field()).toBeDisabled();
    await expect.element(button()).toBeDisabled();
  });

  test("a read-only field shows its date and can't be changed", async () => {
    await render(<Example readOnly defaultValue={october(15)} />);
    await expect.element(field()).toHaveAttribute("readonly");
    await expect.element(button()).toBeDisabled();
  });
});

describe("the calendar", () => {
  test("opens by the field, with the keyboard on today", async () => {
    await render(<Example />);
    await button().click();
    await expect.element(popup()).toBeVisible();
    await expect.element(button()).toHaveAttribute("aria-expanded", "true");
    await vi.waitFor(() =>
      expect(focused()).toBe("Today, Wednesday, October 7th, 2026"),
    );
  });

  test("opens on the picked date, with the keyboard on it", async () => {
    await render(<Example defaultValue={new Date(2027, 2, 9)} />);
    await button().click();
    await expect
      .element(page.getByRole("grid", { name: "March 2027" }))
      .toBeVisible();
    await vi.waitFor(() => expect(focused()).toMatch(/March 9th, 2027/));
  });

  test("picking a day fills the field, closes the calendar and goes back to the button", async () => {
    const onValueChange = vi.fn();
    await render(<Example onValueChange={onValueChange} />);
    await button().click();
    await day(/October 15th/).click();
    await expect.element(field()).toHaveValue("10/15/2026");
    await expect.element(popup()).not.toBeInTheDocument();
    await expect.element(button()).toHaveFocus();
    expect(onValueChange).toHaveBeenCalledOnce();
  });

  test("works from the keyboard alone", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}{Tab}");
    await expect.element(button()).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await vi.waitFor(() => expect(focused()).toMatch(/October 7th/));
    await userEvent.keyboard("{ArrowDown}");
    await vi.waitFor(() => expect(focused()).toMatch(/October 14th/));
    await userEvent.keyboard("{Enter}");
    await expect.element(field()).toHaveValue("10/14/2026");
    await expect.element(button()).toHaveFocus();
  });

  test("Escape closes it, keeps the date and goes back to the button", async () => {
    await render(<Example defaultValue={october(15)} />);
    await button().click();
    await vi.waitFor(() => expect(focused()).toMatch(/October 15th/));
    await userEvent.keyboard("{ArrowRight}{Escape}");
    await expect.element(popup()).not.toBeInTheDocument();
    await expect.element(field()).toHaveValue("10/15/2026");
    await expect.element(button()).toHaveFocus();
  });

  test("pressing the picked day again keeps it", async () => {
    await render(<Example defaultValue={october(15)} />);
    await button().click();
    await day(/October 15th/).click();
    await expect.element(field()).toHaveValue("10/15/2026");
  });

  test("a click outside closes it", async () => {
    await render(<Example />);
    await button().click();
    await expect.element(popup()).toBeVisible();
    // Far from the field, where the calendar isn't in the way.
    await userEvent.click(document.body, { position: { x: 1000, y: 700 } });
    await expect.element(popup()).not.toBeInTheDocument();
  });

  test("Alt and the down arrow open it from the field", async () => {
    await render(<Example />);
    await field().click();
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await expect.element(popup()).toBeVisible();
  });

  test("days outside the earliest and latest can't be picked, and the months stop there", async () => {
    await render(<Example min={october(5)} max={october(20)} />);
    await button().click();
    await expect.element(day(/October 4th/)).toBeDisabled();
    await expect.element(day(/October 5th/)).toBeEnabled();
    await expect.element(day(/October 21st/)).toBeDisabled();
    await expect
      .element(page.getByRole("button", { name: /previous month/i }))
      .toHaveAttribute("aria-disabled", "true");
    await expect
      .element(page.getByRole("button", { name: /next month/i }))
      .toHaveAttribute("aria-disabled", "true");
  });

  test("takes more of the calendar's own options", async () => {
    await render(
      <Example
        calendar={{ ...calendar, showWeekNumber: true }}
        weekStartsOn={1}
      />,
    );
    await button().click();
    await expect
      .element(page.getByRole("rowheader", { name: "Week 41" }))
      .toBeVisible();
    expect(document.querySelector(".nuv-calendar__weekday")).toHaveAttribute(
      "aria-label",
      "Monday",
    );
  });
});

describe("typing", () => {
  test("a date typed in full is taken as soon as it's whole", async () => {
    const onValueChange = vi.fn();
    await render(<Example onValueChange={onValueChange} />);
    await field().fill("10/1");
    expect(onValueChange).not.toHaveBeenCalled();
    await field().fill("10/15/2026");
    expect(last<Date>(onValueChange).getDate()).toBe(15);
    await expect.element(field()).not.toHaveAttribute("aria-invalid");
  });

  test("a looser form is taken on leaving the field, and rewritten", async () => {
    const onValueChange = vi.fn();
    await render(<Example onValueChange={onValueChange} />);
    await field().fill("1/5/26");
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.keyboard("{Tab}");
    await expect.element(field()).toHaveValue("01/05/2026");
    const picked = last<Date>(onValueChange);
    expect([picked.getFullYear(), picked.getMonth(), picked.getDate()]).toEqual(
      [2026, 0, 5],
    );
  });

  test("a year written out with zeros is taken as written", async () => {
    const onValueChange = vi.fn();
    await render(<Example onValueChange={onValueChange} />);
    await field().fill("1/5/0026");
    await userEvent.keyboard("{Tab}");
    expect(last<Date>(onValueChange).getFullYear()).toBe(26);
  });

  test("text that isn't a date stays, is marked invalid, and clears the date", async () => {
    const onValueChange = vi.fn();
    await render(
      <Example defaultValue={october(15)} onValueChange={onValueChange} />,
    );
    await field().fill("next week");
    await expect.element(field()).not.toHaveAttribute("aria-invalid");
    await userEvent.keyboard("{Tab}");
    await expect.element(field()).toHaveValue("next week");
    await expect.element(field()).toHaveAttribute("aria-invalid", "true");
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect(input().validity.customError).toBe(true);
    expect(input().validationMessage).toBe("Enter a valid date.");
  });

  test("a day that doesn't exist isn't a date", async () => {
    await render(<Example />);
    await field().fill("02/30/2026");
    await userEvent.keyboard("{Tab}");
    await expect.element(field()).toHaveAttribute("aria-invalid", "true");
  });

  test("correcting it takes the mark away", async () => {
    await render(<Example invalidMessage="Not a date" />);
    await field().fill("soon");
    await userEvent.keyboard("{Tab}");
    expect(input().validationMessage).toBe("Not a date");
    await field().fill("10/15/2026");
    await expect.element(field()).not.toHaveAttribute("aria-invalid");
    expect(input().validity.valid).toBe(true);
  });

  test("picking a day replaces text that wasn't a date", async () => {
    await render(<Example />);
    await field().fill("soon");
    await button().click();
    await day(/October 15th/).click();
    await expect.element(field()).toHaveValue("10/15/2026");
    await expect.element(field()).not.toHaveAttribute("aria-invalid");
    expect(input().validity.valid).toBe(true);
  });

  test("clearing the text clears the date", async () => {
    const onValueChange = vi.fn();
    await render(
      <Example defaultValue={october(15)} onValueChange={onValueChange} />,
    );
    await field().fill("");
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    await userEvent.keyboard("{Tab}");
    await expect.element(field()).not.toHaveAttribute("aria-invalid");
  });

  test("a date outside the earliest and latest, or ruled out, is invalid", async () => {
    await render(
      <Example
        min={october(5)}
        max={october(20)}
        disabledDates={{ dayOfWeek: [0, 6] }}
      />,
    );
    for (const typed of ["10/04/2026", "10/21/2026", "10/10/2026"]) {
      await field().fill(typed);
      await userEvent.keyboard("{Tab}");
      await expect.element(field()).toHaveAttribute("aria-invalid", "true");
    }
    await field().fill("10/05/2026");
    await expect.element(field()).not.toHaveAttribute("aria-invalid");
  });

  test("a locale changes the order a date is typed in", async () => {
    const onValueChange = vi.fn();
    await render(<Example locale={de} onValueChange={onValueChange} />);
    await expect.element(field()).toHaveAttribute("placeholder", "dd.mm.y");
    await field().fill("7.10.26");
    await userEvent.keyboard("{Tab}");
    await expect.element(field()).toHaveValue("07.10.2026");
    const picked = last<Date>(onValueChange);
    expect([picked.getMonth(), picked.getDate()]).toEqual([9, 7]);
  });

  test("the pattern can be set", async () => {
    await render(<Example format="yyyy-MM-dd" defaultValue={october(15)} />);
    await expect.element(field()).toHaveValue("2026-10-15");
    await expect.element(field()).toHaveAttribute("placeholder", "yyyy-mm-dd");
  });
});

describe("in a form", () => {
  function submitted(form: HTMLFormElement) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function InForm(
    props: DatePickerProps & { onData?: (data: object) => void },
  ) {
    const { onData, ...rest } = props;
    return (
      <form
        aria-label="Task"
        // Keeps the browser from showing its bubble. The form still isn't
        // sent. Headless Firefox drops the mouse click that comes after a
        // bubble, which would be the next test's.
        onInvalidCapture={(event) => event.preventDefault()}
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          onData?.(submitted(event.currentTarget));
        }}
      >
        <DatePicker aria-label="Due date" calendar={calendar} {...rest} />
        <Button type="submit">Save</Button>
        <Button type="reset">Reset</Button>
      </form>
    );
  }
  const form = () => page.getByRole("form").element() as HTMLFormElement;

  test("sends the date under its name, as year, month and day", async () => {
    await render(<InForm name="due" defaultValue={october(15)} />);
    expect(submitted(form())).toEqual({ due: "2026-10-15" });
  });

  test("sends an empty value while there's no date, and nothing without a name", async () => {
    const { rerender } = await render(<InForm name="due" />);
    expect(submitted(form())).toEqual({ due: "" });
    await rerender(<InForm defaultValue={october(15)} />);
    expect(submitted(form())).toEqual({});
  });

  test("sends nothing while disabled", async () => {
    await render(<InForm name="due" defaultValue={october(15)} disabled />);
    expect(submitted(form())).toEqual({});
  });

  test("Enter in the field submits the form with what was just typed", async () => {
    const onData = vi.fn();
    await render(<InForm name="due" onData={onData} />);
    await field().fill("1/5/26");
    await userEvent.keyboard("{Enter}");
    expect(onData).toHaveBeenCalledWith({ due: "2026-01-05" });
  });

  test("text that isn't a date stops the form from being sent", async () => {
    const onData = vi.fn();
    await render(<InForm name="due" onData={onData} />);
    await field().fill("soon");
    await userEvent.keyboard("{Enter}");
    expect(onData).not.toHaveBeenCalled();
    expect(form().checkValidity()).toBe(false);
  });

  test("a required field stops the form while it's empty", async () => {
    await render(<InForm name="due" required />);
    expect(form().checkValidity()).toBe(false);
    await field().fill("10/15/2026");
    expect(form().checkValidity()).toBe(true);
  });

  test("the calendar's button doesn't submit the form", async () => {
    const onData = vi.fn();
    await render(<InForm name="due" onData={onData} />);
    await button().click();
    await expect.element(popup()).toBeVisible();
    await day(/October 15th/).click();
    expect(onData).not.toHaveBeenCalled();
  });

  test("the form's reset puts back the date it started with", async () => {
    await render(<InForm name="due" defaultValue={october(15)} />);
    await field().fill("10/20/2026");
    expect(submitted(form())).toEqual({ due: "2026-10-20" });
    await page.getByRole("button", { name: "Reset" }).click();
    await expect.element(field()).toHaveValue("10/15/2026");
    expect(submitted(form())).toEqual({ due: "2026-10-15" });
  });

  test.for(["Pacific/Kiritimati", "Pacific/Pago_Pago", "UTC"])(
    "in %s, the day sent is the day that was pressed",
    async (timeZone) => {
      await render(
        <InForm
          name="due"
          timeZone={timeZone}
          calendar={{
            today: new TZDate(2026, 9, 7, timeZone),
            defaultMonth: new TZDate(2026, 9, 7, timeZone),
          }}
        />,
      );
      await button().click();
      await day(/October 15th/).click();
      expect(submitted(form())).toEqual({ due: "2026-10-15" });
      await expect.element(field()).toHaveValue("10/15/2026");
    },
  );

  test.for(["Pacific/Kiritimati", "Pacific/Pago_Pago"])(
    "in %s, the day sent is the day that was typed",
    async (timeZone) => {
      const onValueChange = vi.fn();
      await render(
        <InForm name="due" timeZone={timeZone} onValueChange={onValueChange} />,
      );
      await field().fill("10/15/2026");
      expect(submitted(form())).toEqual({ due: "2026-10-15" });
      const picked = last<TZDate>(onValueChange);
      expect(picked).toBeInstanceOf(TZDate);
      expect(picked.timeZone).toBe(timeZone);
      // Midnight there, which is not midnight here.
      expect([picked.getHours(), picked.getMinutes()]).toEqual([0, 0]);
    },
  );

  test("one moment is a different day in two time zones, and each sends its own", async () => {
    // 03:00 UTC on the 15th: still the 14th in Samoa, the 15th in Kiribati.
    const moment = new Date(Date.UTC(2026, 9, 15, 3));
    const { rerender } = await render(
      <InForm name="due" timeZone="Pacific/Pago_Pago" value={moment} />,
    );
    expect(submitted(form())).toEqual({ due: "2026-10-14" });
    await expect.element(field()).toHaveValue("10/14/2026");
    await rerender(
      <InForm name="due" timeZone="Pacific/Kiritimati" value={moment} />,
    );
    expect(submitted(form())).toEqual({ due: "2026-10-15" });
    await expect.element(field()).toHaveValue("10/15/2026");
  });
});

describe("in a field", () => {
  function InField({ error }: { error?: string }) {
    return (
      <Field required>
        <FieldLabel>Due date</FieldLabel>
        <FieldControl>
          <DatePicker calendar={calendar} />
        </FieldControl>
        <FieldDescription>The last day to hand it in.</FieldDescription>
        <FieldError>{error}</FieldError>
      </Field>
    );
  }

  test("the label names the text field, and the text under it describes it", async () => {
    await render(<InField />);
    await expect.element(field()).toHaveAccessibleName("Due date");
    await expect
      .element(field())
      .toHaveAccessibleDescription("The last day to hand it in.");
    await expect.element(field()).toBeRequired();
  });

  test("a click on the label goes to the text field", async () => {
    await render(<InField />);
    await page.getByText(/Due date/).click();
    await expect.element(field()).toHaveFocus();
  });

  test("the field's error marks the text field invalid and is read with it", async () => {
    await render(<InField error="Pick a date." />);
    await expect.element(field()).toHaveAttribute("aria-invalid", "true");
    await expect
      .element(field())
      .toHaveAccessibleDescription("The last day to hand it in. Pick a date.");
  });
});

describe("on a phone", () => {
  // The sheet slides up. With motion reduced it's in place at once, and its
  // edges can be measured.
  beforeEach(async () => {
    await setViewport("phone");
    await emulateMedia({ reducedMotion: "reduce" });
  });

  test("the calendar opens as a sheet with a heading and a close button", async () => {
    await render(<Example />);
    await button().click();
    await expect.element(popup()).toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "Choose date" }))
      .toBeVisible();
    const sheet = popup().element().getBoundingClientRect();
    expect(sheet.left).toBe(0);
    expect(sheet.width).toBe(window.innerWidth);
    expect(Math.round(sheet.bottom)).toBe(window.innerHeight);
    await vi.waitFor(() => expect(focused()).toMatch(/October 7th/));
  });

  test("picking a day closes the sheet and goes back to the button", async () => {
    await render(<Example />);
    await button().click();
    await day(/October 15th/).click();
    await expect.element(field()).toHaveValue("10/15/2026");
    await expect.element(popup()).not.toBeInTheDocument();
    await expect.element(button()).toHaveFocus();
  });

  test("the close button closes it, and can be named", async () => {
    await render(<Example closeLabel="Done" title="Due date" />);
    await button().click();
    await expect
      .element(page.getByRole("dialog", { name: "Due date" }))
      .toBeVisible();
    await page.getByRole("button", { name: "Done" }).click();
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(button()).toHaveFocus();
  });

  test("the field and its calendar fit the screen", async () => {
    await render(<RangeExample defaultOpen />);
    await expect.element(rangePopup()).toBeVisible();
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
    expect(page.getByRole("grid").elements()).toHaveLength(1);
  });
});

describe("a range", () => {
  test("is two text fields in a group, with one button", async () => {
    await render(<RangeExample />);
    await expect
      .element(page.getByRole("group", { name: "Stay" }))
      .toBeVisible();
    await expect
      .element(startField())
      .toHaveAttribute("placeholder", "mm/dd/yyyy");
    await expect.element(endField()).toBeVisible();
    await expect.element(rangeButton()).toBeVisible();
  });

  test("shows the range it starts with", async () => {
    await render(
      <RangeExample defaultValue={{ from: october(12), to: october(15) }} />,
    );
    await expect.element(startField()).toHaveValue("10/12/2026");
    await expect.element(endField()).toHaveValue("10/15/2026");
    await expect
      .element(rangeButton())
      .toHaveAccessibleName(
        "Choose dates, Monday, October 12th, 2026, Thursday, October 15th, 2026",
      );
  });

  test("the calendar shows two months, and stays open until both days are picked", async () => {
    const onValueChange = vi.fn();
    await render(<RangeExample onValueChange={onValueChange} />);
    await rangeButton().click();
    await expect.element(rangePopup()).toBeVisible();
    expect(page.getByRole("grid").elements()).toHaveLength(2);

    await day(/October 12th/).click();
    await expect.element(startField()).toHaveValue("10/12/2026");
    await expect.element(endField()).toHaveValue("");
    await expect.element(rangePopup()).toBeVisible();
    expect(last<DateRange>(onValueChange).to).toBeUndefined();

    await day(/November 3rd/).click();
    await expect.element(endField()).toHaveValue("11/03/2026");
    await expect.element(rangePopup()).not.toBeInTheDocument();
    await expect.element(rangeButton()).toHaveFocus();
  });

  test("picking the earlier day second still gives a range in order", async () => {
    await render(<RangeExample />);
    await rangeButton().click();
    await day(/October 15th/).click();
    await day(/October 12th/).click();
    await expect.element(startField()).toHaveValue("10/12/2026");
    await expect.element(endField()).toHaveValue("10/15/2026");
  });

  test("with a range picked, the next press starts a new one", async () => {
    await render(
      <RangeExample defaultValue={{ from: october(12), to: october(15) }} />,
    );
    await rangeButton().click();
    await day(/October 20th/).click();
    await expect.element(startField()).toHaveValue("10/20/2026");
    await expect.element(endField()).toHaveValue("");
    await expect.element(rangePopup()).toBeVisible();
  });

  test("a range shorter than the fewest days allowed starts again", async () => {
    await render(<RangeExample calendar={{ ...calendar, min: 2 }} />);
    await rangeButton().click();
    await day(/October 12th/).click();
    await day(/October 13th/).click();
    // One night, where two are needed. The 13th is the new first day.
    await expect.element(rangePopup()).toBeVisible();
    await expect.element(startField()).toHaveValue("10/13/2026");
    await expect.element(endField()).toHaveValue("");
    await day(/October 15th/).click();
    await expect.element(endField()).toHaveValue("10/15/2026");
    await expect.element(rangePopup()).not.toBeInTheDocument();
  });

  test("the number of months can be set", async () => {
    await render(<RangeExample numberOfMonths={1} defaultOpen />);
    await expect.element(rangePopup()).toBeVisible();
    expect(page.getByRole("grid").elements()).toHaveLength(1);
  });

  test("both days can be typed", async () => {
    const onValueChange = vi.fn();
    await render(<RangeExample onValueChange={onValueChange} />);
    await startField().fill("10/12/2026");
    await endField().fill("10/15/2026");
    const range = last<DateRange>(onValueChange);
    expect([range.from?.getDate(), range.to?.getDate()]).toEqual([12, 15]);
  });

  test("a last day before the first is invalid, and says why", async () => {
    await render(<RangeExample />);
    await startField().fill("10/12/2026");
    await endField().fill("10/10/2026");
    await userEvent.keyboard("{Tab}");
    await expect.element(endField()).toHaveAttribute("aria-invalid", "true");
    await expect.element(startField()).not.toHaveAttribute("aria-invalid");
    expect(input(endField()).validationMessage).toBe(
      "The end date is before the start date.",
    );
  });

  test("clearing both fields clears the range", async () => {
    const onValueChange = vi.fn();
    await render(
      <RangeExample
        defaultValue={{ from: october(12), to: october(15) }}
        onValueChange={onValueChange}
      />,
    );
    await startField().fill("");
    await endField().fill("");
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  test("sends each day under its own name", async () => {
    await render(
      <form aria-label="Booking">
        <DateRangePicker
          aria-label="Stay"
          startName="arrive"
          endName="leave"
          defaultValue={{ from: october(12), to: october(15) }}
        />
      </form>,
    );
    const form = page.getByRole("form").element() as HTMLFormElement;
    expect(Object.fromEntries(new FormData(form).entries())).toEqual({
      arrive: "2026-10-12",
      leave: "2026-10-15",
    });
  });

  test("in a field, the label names the group and goes to the first day", async () => {
    await render(
      <Field>
        <FieldLabel>Stay</FieldLabel>
        <FieldControl>
          <DateRangePicker calendar={calendar} />
        </FieldControl>
        <FieldDescription>At least two nights.</FieldDescription>
      </Field>,
    );
    await expect
      .element(page.getByRole("group", { name: "Stay" }))
      .toBeVisible();
    await expect
      .element(startField())
      .toHaveAccessibleDescription("At least two nights.");
    await page.getByText("Stay").click();
    await expect.element(startField()).toHaveFocus();
  });

  test("the labels can be replaced", async () => {
    await render(
      <RangeExample startLabel="From" endLabel="Until" calendarLabel="Open" />,
    );
    await expect
      .element(page.getByRole("textbox", { name: "From" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("textbox", { name: "Until" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Open" }))
      .toBeVisible();
  });
});

describe("layout", () => {
  test("the field is 44px tall on a phone, and the density's height with a mouse", async () => {
    await render(<Example />);
    const box = () =>
      (input().parentElement as HTMLElement).getBoundingClientRect().height;
    expect(box()).toBe(40);
    document.documentElement.setAttribute("data-density", "compact");
    expect(box()).toBe(36);
  });

  test("the calendar's panel is as wide as the calendar in it", async () => {
    // It grows a little as it opens, which would be measured otherwise.
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example defaultOpen />);
    await expect.element(popup()).toBeVisible();
    const panel = popup().element().getBoundingClientRect();
    const inner = (
      document.querySelector(".nuv-calendar") as HTMLElement
    ).getBoundingClientRect();
    // Twelve pixels of padding and one of border on each side.
    expect(Math.round(panel.width - inner.width)).toBe(26);
  });

  test("the keyboard's focus shows as a ring around the whole box", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await expect.element(field()).toHaveFocus();
    const box = getComputedStyle(input().parentElement as HTMLElement);
    expect(box.outlineStyle).toBe("solid");
  });
});

describe("accessibility", () => {
  // Measured once the calendar has finished fading in. A color read halfway
  // through is paler than the one people get.
  beforeEach(async () => {
    await emulateMedia({ reducedMotion: "reduce" });
  });

  test.for(themes)("closed and invalid, in %s", async (theme) => {
    setPageTheme(theme);
    await render(
      <main>
        <Field>
          <FieldLabel>Due date</FieldLabel>
          <FieldControl>
            <DatePicker calendar={calendar} />
          </FieldControl>
          <FieldError>Pick a date.</FieldError>
        </Field>
        <DateRangePicker
          aria-label="Stay"
          defaultValue={{ from: october(12), to: october(15) }}
        />
      </main>,
    );
    expect(await axe(document.body)).toHaveNoViolations();
  });

  test.for(themes)("with the calendar open, in %s", async (theme) => {
    setPageTheme(theme);
    await render(
      <Example
        defaultOpen
        defaultValue={october(15)}
        min={october(3)}
        calendar={{ ...calendar, showOutsideDays: true }}
      />,
    );
    await expect.element(popup()).toBeVisible();
    expect(await axe(document.body, outsideLandmarks)).toHaveNoViolations();
  });

  test.for(themes)("a range open, in %s", async (theme) => {
    setPageTheme(theme);
    await render(
      <RangeExample
        defaultOpen
        defaultValue={{ from: october(12), to: october(15) }}
      />,
    );
    await expect.element(rangePopup()).toBeVisible();
    expect(await axe(document.body, outsideLandmarks)).toHaveNoViolations();
  });

  test.for(themes)("the sheet open on a phone, in %s", async (theme) => {
    await setViewport("phone");
    setPageTheme(theme);
    await render(<Example defaultOpen defaultValue={october(15)} />);
    await expect.element(popup()).toBeVisible();
    expect(await axe(document.body, outsideLandmarks)).toHaveNoViolations();
  });
});
