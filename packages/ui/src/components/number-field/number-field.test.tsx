import "../../styles/index.scss";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "../field";
import { NumberField, type NumberFieldProps } from "./number-field";

const field = () => page.getByRole("spinbutton");
const input = () => field().element() as HTMLInputElement;
const up = () => page.getByRole("button", { name: "Increase" });
const down = () => page.getByRole("button", { name: "Decrease" });
const style = (element: Element) => getComputedStyle(element);
const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

// A region's space can be a narrow or a non-breaking one.
const plain = (text: string) => text.replace(/\s/g, " ");

// Typing replaces what's there, as selecting it all and typing does.
async function type(text: string) {
  await userEvent.fill(field(), text);
}

function Seats(props: NumberFieldProps) {
  return <NumberField aria-label="Seats" {...props} />;
}

describe("rendering", () => {
  test("is a spinbutton with its number, its limits and a button at each end", async () => {
    await render(<Seats defaultValue={5} min={1} max={50} />);

    expect(input().value).toBe("5");
    expect(input().type).toBe("text");
    expect(input().getAttribute("aria-valuenow")).toBe("5");
    expect(input().getAttribute("aria-valuemin")).toBe("1");
    expect(input().getAttribute("aria-valuemax")).toBe("50");
    expect(input().getAttribute("aria-valuetext")).toBe("5");
    await expect.element(up()).toBeVisible();
    await expect.element(down()).toBeVisible();
  });

  test("starts empty, with no number to report", async () => {
    await render(<Seats />);

    expect(input().value).toBe("");
    expect(input().hasAttribute("aria-valuenow")).toBe(false);
    expect(input().hasAttribute("aria-valuetext")).toBe(false);
  });

  test("the class name goes on the box, and everything else on the input", async () => {
    const ref = createRef<HTMLInputElement>();
    await render(
      <NumberField
        ref={ref}
        aria-label="Seats"
        className="mine"
        id="seats"
        placeholder="How many"
        data-thing="yes"
      />,
    );

    expect(ref.current).toBe(input());
    expect(input().id).toBe("seats");
    expect(input().placeholder).toBe("How many");
    expect(input().dataset.thing).toBe("yes");
    expect(input().className).toBe("nuv-number-field__control");
    expect(input().parentElement?.className).toBe("nuv-number-field mine");
  });

  test("the buttons are named by the labels, which can be translated", async () => {
    await render(
      <Seats incrementLabel="Erhöhen" decrementLabel="Verringern" />,
    );

    await expect
      .element(page.getByRole("button", { name: "Erhöhen" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Verringern" }))
      .toBeVisible();
  });

  test("asks a phone for digits only where nothing else can be typed", async () => {
    const screen = await render(<Seats min={0} />);
    expect(input().inputMode).toBe("numeric");

    await screen.rerender(<Seats min={0} step={0.5} />);
    expect(input().inputMode).toBe("decimal");

    // A minus sign is only on the full keyboard.
    await screen.rerender(<Seats />);
    expect(input().inputMode).toBe("text");
    await screen.rerender(<Seats min={-10} />);
    expect(input().inputMode).toBe("text");
  });
});

describe("typing", () => {
  test("reports the number when typing is finished, not on every key", async () => {
    const onValueChange = vi.fn();
    await render(<Seats defaultValue={1} onValueChange={onValueChange} />);

    await type("125");
    expect(input().value).toBe("125");
    expect(onValueChange).not.toHaveBeenCalled();
    // The number a screen reader is told is still the one that was taken.
    expect(input().getAttribute("aria-valuenow")).toBe("1");

    await userEvent.tab();
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(125);
    expect(input().getAttribute("aria-valuenow")).toBe("125");
  });

  test("Enter takes what's typed", async () => {
    const onValueChange = vi.fn();
    await render(<Seats onValueChange={onValueChange} />);

    await type("42");
    await userEvent.keyboard("{Enter}");

    expect(onValueChange).toHaveBeenCalledWith(42);
    expect(document.activeElement).toBe(input());
  });

  test("a number past a limit is moved to it", async () => {
    const onValueChange = vi.fn();
    await render(<Seats min={1} max={50} onValueChange={onValueChange} />);

    await type("900");
    await userEvent.tab();
    expect(input().value).toBe("50");
    expect(onValueChange).toHaveBeenLastCalledWith(50);

    await type("-3");
    await userEvent.tab();
    expect(input().value).toBe("1");
    expect(onValueChange).toHaveBeenLastCalledWith(1);
  });

  test("text that isn't a number is dropped, and the last number comes back", async () => {
    const onValueChange = vi.fn();
    await render(<Seats defaultValue={7} onValueChange={onValueChange} />);

    await type("lots");
    await userEvent.tab();

    expect(input().value).toBe("7");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("an emptied field is null", async () => {
    const onValueChange = vi.fn();
    await render(<Seats defaultValue={7} onValueChange={onValueChange} />);

    await type("");
    await userEvent.tab();

    expect(input().value).toBe("");
    expect(onValueChange).toHaveBeenCalledWith(null);
    expect(input().hasAttribute("aria-valuenow")).toBe(false);
  });

  test("leaving without a change reports nothing", async () => {
    const onValueChange = vi.fn();
    await render(<Seats defaultValue={7} onValueChange={onValueChange} />);

    await type("7");
    await userEvent.tab();

    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("more decimals than the format shows are rounded off", async () => {
    const onValueChange = vi.fn();
    await render(
      <Seats
        format={{ maximumFractionDigits: 2 }}
        onValueChange={onValueChange}
      />,
    );

    await type("1.23789");
    await userEvent.tab();

    expect(onValueChange).toHaveBeenCalledWith(1.24);
    expect(input().value).toBe("1.24");
  });
});

describe("the keyboard", () => {
  test("the arrows step, and the page keys take a large step", async () => {
    const onValueChange = vi.fn();
    await render(<Seats defaultValue={20} onValueChange={onValueChange} />);
    input().focus();

    await userEvent.keyboard("{ArrowUp}");
    expect(input().value).toBe("21");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(input().value).toBe("19");
    await userEvent.keyboard("{PageUp}");
    expect(input().value).toBe("29");
    await userEvent.keyboard("{PageDown}{PageDown}");
    expect(input().value).toBe("9");
    expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([
      21, 20, 19, 29, 19, 9,
    ]);
  });

  test("step and largeStep say how far", async () => {
    await render(<Seats defaultValue={0} step={0.25} largeStep={5} />);
    input().focus();

    await userEvent.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}");
    expect(input().value).toBe("0.75");
    await userEvent.keyboard("{PageUp}");
    expect(input().value).toBe("5.75");
  });

  test("adding decimals doesn't leave stray digits", async () => {
    const onValueChange = vi.fn();
    await render(
      <Seats defaultValue={0.1} step={0.1} onValueChange={onValueChange} />,
    );
    input().focus();

    await userEvent.keyboard("{ArrowUp}{ArrowUp}");

    // 0.1 + 0.1 + 0.1 is 0.30000000000000004 to a computer.
    expect(onValueChange).toHaveBeenLastCalledWith(0.3);
    expect(input().value).toBe("0.3");
  });

  test("Home and End go to the limits, and do nothing without one", async () => {
    const screen = await render(<Seats defaultValue={20} min={1} max={50} />);
    input().focus();

    await userEvent.keyboard("{End}");
    expect(input().value).toBe("50");
    await userEvent.keyboard("{Home}");
    expect(input().value).toBe("1");

    await screen.rerender(<Seats key="free" defaultValue={20} />);
    input().focus();
    await userEvent.keyboard("{End}{Home}");
    expect(input().value).toBe("20");
  });

  test("a step stops at a limit", async () => {
    await render(<Seats defaultValue={49} min={1} max={50} />);
    input().focus();

    await userEvent.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}");
    expect(input().value).toBe("50");
    await userEvent.keyboard("{PageUp}");
    expect(input().value).toBe("50");
  });

  test("a step counts from what's typed and not yet taken", async () => {
    await render(<Seats defaultValue={1} />);

    await type("30");
    await userEvent.keyboard("{ArrowUp}");

    expect(input().value).toBe("31");
  });

  test("from an empty field the first step gives the nearest limit, or zero", async () => {
    const screen = await render(<Seats min={3} max={9} />);
    input().focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(input().value).toBe("3");

    await screen.rerender(<Seats key="down" min={3} max={9} />);
    input().focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(input().value).toBe("9");

    await screen.rerender(<Seats key="free" />);
    input().focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(input().value).toBe("0");
  });

  test("Tab goes to the field and past it, not to the buttons", async () => {
    await render(
      <>
        <Seats defaultValue={5} />
        <button type="button">After</button>
      </>,
    );

    await userEvent.tab();
    expect(document.activeElement).toBe(input());
    await userEvent.tab();
    await expect
      .element(page.getByRole("button", { name: "After" }))
      .toHaveFocus();
  });

  test("a key handler of your own runs first, and can stop the step", async () => {
    await render(
      <Seats
        defaultValue={5}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") event.preventDefault();
        }}
      />,
    );
    input().focus();

    await userEvent.keyboard("{ArrowUp}");
    expect(input().value).toBe("5");
    await userEvent.keyboard("{ArrowDown}");
    expect(input().value).toBe("4");
  });
});

describe("the buttons", () => {
  test("each press is one step", async () => {
    const onValueChange = vi.fn();
    await render(<Seats defaultValue={5} onValueChange={onValueChange} />);

    await up().click();
    expect(input().value).toBe("6");
    await down().click();
    await down().click();
    expect(input().value).toBe("4");
    expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([6, 5, 4]);
  });

  test("a button is disabled at its limit", async () => {
    await render(<Seats defaultValue={1} min={1} max={2} />);

    await expect.element(down()).toBeDisabled();
    await expect.element(up()).toBeEnabled();

    await up().click();
    await expect.element(up()).toBeDisabled();
    await expect.element(down()).toBeEnabled();
  });

  test("holding a button repeats the step, and letting go stops it", async () => {
    await render(<Seats defaultValue={0} />);
    const button = up().element();

    button.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, button: 0 }),
    );
    expect(input().value).toBe("1");
    // Nothing more until it's been held a while.
    await wait(200);
    expect(input().value).toBe("1");
    await wait(600);
    const held = Number(input().value);
    expect(held).toBeGreaterThan(2);

    button.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    await wait(200);
    expect(Number(input().value)).toBe(held);
  });

  test("holding a button stops at the limit", async () => {
    await render(<Seats defaultValue={0} max={3} />);

    up()
      .element()
      .dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, button: 0 }),
      );
    await wait(900);

    expect(input().value).toBe("3");
    await expect.element(up()).toBeDisabled();
  });

  test("a press that isn't the main button does nothing", async () => {
    await render(<Seats defaultValue={5} />);

    up()
      .element()
      .dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, button: 2 }),
      );

    expect(input().value).toBe("5");
  });

  test("a press with no pointer, as a screen reader's, is one step", async () => {
    await render(<Seats defaultValue={5} />);

    // A click the browser makes for an activation has no count of presses.
    (up().element() as HTMLButtonElement).click();

    expect(input().value).toBe("6");
  });

  test("a field that's disabled or read-only has no working buttons or keys", async () => {
    const screen = await render(<Seats defaultValue={5} disabled />);
    await expect.element(up()).toBeDisabled();
    await expect.element(down()).toBeDisabled();
    expect(input().disabled).toBe(true);

    await screen.rerender(<Seats defaultValue={5} readOnly />);
    await expect.element(up()).toBeDisabled();
    input().focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(input().value).toBe("5");
  });
});

describe("formats", () => {
  test("writes the number the format's way when it isn't being typed", async () => {
    await render(
      <Seats
        defaultValue={2500}
        format={{ currency: "USD", maximumFractionDigits: 0 }}
      />,
    );

    expect(input().value).toBe("$2,500");
    expect(input().getAttribute("aria-valuenow")).toBe("2500");
    expect(input().getAttribute("aria-valuetext")).toBe("$2,500");
  });

  test("reads what's typed by the locale's rules", async () => {
    const onValueChange = vi.fn();
    await render(
      <Seats format={{ locale: "de-DE" }} onValueChange={onValueChange} />,
    );

    await type("1.234,5");
    await userEvent.tab();

    expect(onValueChange).toHaveBeenCalledWith(1234.5);
    expect(input().value).toBe("1.234,5");
  });

  test("ignores a currency sign, a unit and spaces typed with the digits", async () => {
    const onValueChange = vi.fn();
    await render(
      <Seats
        format={{ locale: "fr-FR", currency: "EUR" }}
        onValueChange={onValueChange}
      />,
    );

    await type("1 234,50 €");
    await userEvent.tab();

    expect(onValueChange).toHaveBeenCalledWith(1234.5);
    expect(plain(input().value)).toBe("1 234,50 €");
  });

  test("a percentage is typed as it's said, and kept as a ratio", async () => {
    const onValueChange = vi.fn();
    await render(
      <Seats
        defaultValue={0.15}
        step={0.05}
        format={{ format: "percent" }}
        onValueChange={onValueChange}
      />,
    );
    expect(input().value).toBe("15%");

    await type("33");
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(0.33);
    expect(input().value).toBe("33%");

    input().focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(onValueChange).toHaveBeenLastCalledWith(0.38);
    expect(input().value).toBe("38%");
  });

  test("reads a locale's own digits and minus sign", async () => {
    const onValueChange = vi.fn();
    await render(
      <Seats
        format={{ locale: "ar-EG", options: { numberingSystem: "arab" } }}
        onValueChange={onValueChange}
      />,
    );

    await type("١٢٣");
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(123);

    await type("−7");
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(-7);
  });
});

describe("controlled", () => {
  test("shows the value it's given, and asks for a change", async () => {
    function Controlled() {
      const [value, setValue] = useState<number | null>(10);
      return (
        <>
          <Seats value={value} onValueChange={setValue} />
          <button type="button" onClick={() => setValue(99)}>
            Set to 99
          </button>
          <output>{String(value)}</output>
        </>
      );
    }
    await render(<Controlled />);

    await up().click();
    await expect.element(page.getByRole("status")).toHaveTextContent("11");

    await page.getByRole("button", { name: "Set to 99" }).click();
    expect(input().value).toBe("99");
  });

  test("stays where it's held when the change is refused", async () => {
    const onValueChange = vi.fn();
    await render(<Seats value={10} onValueChange={onValueChange} />);

    await up().click();
    expect(onValueChange).toHaveBeenCalledWith(11);
    expect(input().value).toBe("10");

    await type("77");
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(77);
    expect(input().value).toBe("10");
  });

  test("null is an empty field", async () => {
    await render(<Seats value={null} />);

    expect(input().value).toBe("");
  });
});

describe("in a form", () => {
  test("submits the plain number under its name, however it's written", async () => {
    let submitted: FormData | undefined;
    await render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = new FormData(event.currentTarget);
        }}
      >
        <Seats
          name="amount"
          defaultValue={1250.5}
          format={{ locale: "de-DE", currency: "EUR" }}
        />
        <button type="submit">Send</button>
      </form>,
    );
    expect(plain(input().value)).toBe("1.250,50 €");

    await page.getByRole("button", { name: "Send" }).click();
    expect([...(submitted?.entries() ?? [])]).toEqual([["amount", "1250.5"]]);
  });

  test("Enter submits the number that was just typed", async () => {
    let submitted: FormData | undefined;
    await render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = new FormData(event.currentTarget);
        }}
      >
        <Seats name="seats" defaultValue={1} />
        <button type="submit">Send</button>
      </form>,
    );

    await type("12");
    await userEvent.keyboard("{Enter}");

    expect(submitted?.get("seats")).toBe("12");
  });

  test("an empty field submits an empty string, and a disabled one nothing", async () => {
    let submitted: FormData | undefined;
    const screen = await render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = new FormData(event.currentTarget);
        }}
      >
        <Seats name="seats" />
        <button type="submit">Send</button>
      </form>,
    );
    await page.getByRole("button", { name: "Send" }).click();
    expect(submitted?.get("seats")).toBe("");

    await screen.rerender(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = new FormData(event.currentTarget);
        }}
      >
        <Seats name="seats" defaultValue={3} disabled />
        <button type="submit">Send</button>
      </form>,
    );
    await page.getByRole("button", { name: "Send" }).click();
    expect(submitted?.has("seats")).toBe(false);
  });

  test("required stops the form while the field is empty", async () => {
    const onSubmit = vi.fn((event: { preventDefault(): void }) =>
      event.preventDefault(),
    );
    await render(
      <form onSubmit={onSubmit}>
        <Seats name="seats" required />
        <button type="submit">Send</button>
      </form>,
    );

    await page.getByRole("button", { name: "Send" }).click();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input().validity.valueMissing).toBe(true);

    await type("2");
    await page.getByRole("button", { name: "Send" }).click();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("a field connects its label, its description and its error", async () => {
    await render(
      <Field required>
        <FieldLabel>Seats</FieldLabel>
        <FieldControl>
          <NumberField min={1} />
        </FieldControl>
        <FieldDescription>At least one.</FieldDescription>
        <FieldError>Say how many seats.</FieldError>
      </Field>,
    );
    const seats = page.getByRole("spinbutton", { name: /Seats/ });

    await expect.element(seats).toBeVisible();
    await expect.element(seats).toHaveAccessibleDescription(/At least one\./);
    await expect.element(seats).toHaveAttribute("aria-invalid", "true");
    await expect.element(seats).toBeRequired();
  });
});

describe("styles", () => {
  test("the number is in the middle, in digits of one width, between two buttons", async () => {
    await render(
      <div style={{ width: 240 }}>
        <Seats defaultValue={5} />
      </div>,
    );
    const box = input().parentElement as Element;
    const minus = down().element().getBoundingClientRect();
    const plus = up().element().getBoundingClientRect();
    const middle = input().getBoundingClientRect();

    expect(box.getBoundingClientRect().width).toBe(240);
    expect(minus.right).toBeLessThanOrEqual(middle.left);
    expect(middle.right).toBeLessThanOrEqual(plus.left);
    expect(style(input()).textAlign).toBe("center");
    expect(style(input()).fontVariantNumeric).toBe("tabular-nums");
  });

  test("with a mouse it's the density's height, and the input has no edge of its own", async () => {
    await render(<Seats defaultValue={5} />);
    const box = input().parentElement as Element;

    expect(box.getBoundingClientRect().height).toBe(40);
    expect(style(box).borderTopWidth).toBe("1px");
    expect(style(input()).borderTopWidth).toBe("0px");
  });

  test("the focus ring goes around the whole box", async () => {
    await render(<Seats defaultValue={5} />);
    const box = input().parentElement as Element;

    await userEvent.tab();

    expect(style(box).outlineStyle).toBe("solid");
    expect(style(box).outlineWidth).toBe("2px");
    expect(style(input()).outlineStyle).toBe("none");
  });

  test("an invalid field's box has the danger color, and a disabled one fades", async () => {
    const screen = await render(<Seats defaultValue={5} aria-invalid="true" />);
    const edge = () => style(input().parentElement as Element).borderTopColor;
    const invalid = edge();

    await screen.rerender(<Seats defaultValue={5} />);
    expect(edge()).not.toBe(invalid);

    await screen.rerender(<Seats defaultValue={5} disabled />);
    expect(
      Number(style(input().parentElement as Element).opacity),
    ).toBeLessThan(1);
  });

  test("component variables change the look", async () => {
    await render(
      <div
        style={
          {
            "--nuv-number-field-width": "150px",
            "--nuv-number-field-height": "60px",
            "--nuv-number-field-bg": "rgb(10, 20, 30)",
            "--nuv-number-field-fg": "rgb(200, 210, 220)",
            "--nuv-number-field-border": "rgb(40, 50, 60)",
            "--nuv-number-field-radius": "2px",
            "--nuv-number-field-font-size": "20px",
            "--nuv-number-field-align": "end",
            "--nuv-number-field-button-fg": "rgb(70, 80, 90)",
            "--nuv-number-field-button-radius": "9px",
          } as never
        }
      >
        <Seats defaultValue={5} />
      </div>,
    );
    const box = input().parentElement as Element;

    expect(box.getBoundingClientRect().width).toBe(150);
    expect(box.getBoundingClientRect().height).toBe(60);
    expect(style(box).backgroundColor).toBe("rgb(10, 20, 30)");
    expect(style(box).color).toBe("rgb(200, 210, 220)");
    expect(style(box).borderTopColor).toBe("rgb(40, 50, 60)");
    expect(style(box).borderTopLeftRadius).toBe("2px");
    expect(style(input()).fontSize).toBe("20px");
    expect(style(input()).textAlign).toBe("end");
    expect(style(up().element()).color).toBe("rgb(70, 80, 90)");
    expect(style(up().element()).borderTopLeftRadius).toBe("9px");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, filled, empty, invalid and disabled", async () => {
    const screen = await renderThemed(
      theme,
      <>
        <NumberField aria-label="Filled" defaultValue={5} min={0} max={10} />
        <NumberField aria-label="Empty" placeholder="How many" />
        <NumberField
          aria-label="Invalid"
          defaultValue={5}
          aria-invalid="true"
        />
        <NumberField aria-label="Disabled" defaultValue={5} disabled />
        <NumberField
          aria-label="Budget"
          defaultValue={2500}
          format={{ currency: "USD" }}
        />
      </>,
    );

    await expectNoViolations(screen.container);
  });
});
