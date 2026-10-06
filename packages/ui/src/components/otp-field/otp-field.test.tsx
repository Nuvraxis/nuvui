import "../../styles/index.scss";
import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { contrast } from "../../../test/contrast";
import { expectNoViolations, renderThemed, themes } from "../../../test/themed";
import { OtpField } from "./otp-field";

const boxes = () => page.getByRole("textbox").elements() as HTMLInputElement[];
const box = (position: number) => boxes()[position - 1] as HTMLInputElement;
const typed = () =>
  boxes()
    .map(({ value }) => value)
    .join("");
const group = () => page.getByRole("group", { name: "Code" });

// Radix moves focus a moment after an arrow key goes down. See the same
// helper in the radio group's tests.
async function arrow(key: "ArrowRight" | "ArrowLeft") {
  await userEvent.keyboard(`{${key}>}`);
  await new Promise((resolve) => setTimeout(resolve, 30));
  await userEvent.keyboard(`{/${key}}`);
}

describe("rendering", () => {
  test("draws six boxes by default, each with a name", async () => {
    await render(<OtpField aria-label="Code" />);

    await expect.element(group()).toBeVisible();
    expect(boxes()).toHaveLength(6);
    expect(boxes().map((input) => input.getAttribute("aria-label"))).toEqual([
      "Character 1 of 6",
      "Character 2 of 6",
      "Character 3 of 6",
      "Character 4 of 6",
      "Character 5 of 6",
      "Character 6 of 6",
    ]);
  });

  test("length sets how many boxes there are", async () => {
    await render(<OtpField aria-label="Code" length={4} />);

    expect(boxes()).toHaveLength(4);
    expect(box(4).getAttribute("aria-label")).toBe("Character 4 of 4");
  });

  test("the names can be replaced", async () => {
    await render(
      <OtpField
        aria-label="Code"
        length={4}
        inputLabel={(position, length) => `Ziffer ${position} von ${length}`}
      />,
    );

    expect(box(2).getAttribute("aria-label")).toBe("Ziffer 2 von 4");
  });

  test("groupSize draws a dash between groups that isn't read out", async () => {
    const screen = await render(<OtpField aria-label="Code" groupSize={3} />);
    const dashes = screen.container.querySelectorAll(
      ".nuv-otp-field__separator",
    );

    expect(dashes).toHaveLength(1);
    expect(dashes[0]?.getAttribute("aria-hidden")).toBe("true");
    expect(dashes[0]?.previousElementSibling).toBe(box(3));
    expect(dashes[0]?.getBoundingClientRect().width).toBe(8);
  });

  test("forwards its ref and keeps a className", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(<OtpField ref={ref} aria-label="Code" className="mine" />);

    expect(ref.current).toBe(group().element());
    expect(ref.current?.className).toBe("nuv-otp-field mine");
  });
});

describe("typing", () => {
  test("each digit moves on to the next box", async () => {
    const onValueChange = vi.fn();
    await render(<OtpField aria-label="Code" onValueChange={onValueChange} />);

    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(box(1));
    await userEvent.keyboard("123");

    expect(typed()).toBe("123");
    expect(document.activeElement).toBe(box(4));
    expect(onValueChange).toHaveBeenLastCalledWith("123");
  });

  test("takes digits only, unless told otherwise", async () => {
    const screen = await render(<OtpField aria-label="Code" />);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("a1b2");
    expect(typed()).toBe("12");
    expect(box(1).inputMode).toBe("numeric");

    await screen.rerender(
      <OtpField aria-label="Code" validationType="alphanumeric" />,
    );
    await userEvent.keyboard("c");
    expect(typed()).toBe("12c");
  });

  test("Backspace clears a box and steps back", async () => {
    await render(<OtpField aria-label="Code" defaultValue="123" />);

    box(3).focus();
    await userEvent.keyboard("{Backspace}");

    expect(typed()).toBe("12");
    expect(document.activeElement).toBe(box(2));
  });

  test("the arrow keys move between the boxes that are filled", async () => {
    await render(<OtpField aria-label="Code" defaultValue="123" />);

    box(1).focus();
    await arrow("ArrowRight");
    await expect.poll(() => document.activeElement).toBe(box(2));
    await arrow("ArrowLeft");
    await expect.poll(() => document.activeElement).toBe(box(1));
  });

  test("a pasted code fills every box", async () => {
    await render(
      <>
        <input aria-label="Message" defaultValue="12 34 56" />
        <OtpField aria-label="Code" />
      </>,
    );
    // Copied and pasted for real. Firefox doesn't let a script build a
    // paste event that carries text.
    const message = page
      .getByLabelText("Message")
      .element() as HTMLInputElement;
    message.focus();
    message.select();
    await userEvent.copy();

    const first = group().element().querySelector("input") as HTMLInputElement;
    first.focus();
    await userEvent.paste();

    await expect
      .poll(() =>
        [
          ...group()
            .element()
            .querySelectorAll<HTMLInputElement>('input:not([type="hidden"])'),
        ]
          .map(({ value }) => value)
          .join(""),
      )
      .toBe("123456");
  });

  test("can be controlled", async () => {
    const onValueChange = vi.fn();
    await render(
      <OtpField aria-label="Code" value="12" onValueChange={onValueChange} />,
    );

    box(3).focus();
    await userEvent.keyboard("3");

    expect(onValueChange).toHaveBeenCalledWith("123");
    expect(typed()).toBe("12");
  });

  test("only the first box asks the browser for a code from a text message", async () => {
    await render(<OtpField aria-label="Code" />);

    // The attribute, not the property: Firefox's property is empty for a
    // value it doesn't act on.
    await expect
      .poll(() => box(1).getAttribute("autocomplete"))
      .toBe("one-time-code");
    expect(box(2).getAttribute("autocomplete")).toBe("off");
  });
});

describe("in a form", () => {
  test("submits the whole code under one name", async () => {
    let submitted: FormData | undefined;
    await render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = new FormData(event.currentTarget);
        }}
      >
        <OtpField aria-label="Code" name="code" defaultValue="123456" />
        <button type="submit">Verify</button>
      </form>,
    );

    await page.getByRole("button", { name: "Verify" }).click();

    expect(submitted?.get("code")).toBe("123456");
    expect([...(submitted?.keys() ?? [])]).toEqual(["code"]);
  });

  test("required blocks the form until every box is filled", async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    await render(
      <form onSubmit={onSubmit}>
        <OtpField aria-label="Code" length={4} required />
      </form>,
    );
    const form = box(1).closest("form");

    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("123");
    form?.requestSubmit();
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.keyboard("4");
    form?.requestSubmit();
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  test("autoSubmit sends the form once the last box is filled", async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    await render(
      <form onSubmit={onSubmit}>
        <OtpField aria-label="Code" length={4} autoSubmit />
      </form>,
    );

    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("1234");

    await expect.poll(() => onSubmit.mock.calls.length).toBe(1);
  });

  test("a form reset empties the boxes", async () => {
    await render(
      <form>
        <OtpField aria-label="Code" />
        <button type="reset">Reset</button>
      </form>,
    );
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("123");

    await page.getByRole("button", { name: "Reset" }).click();

    await expect.poll(typed).toBe("");
  });
});

describe("states", () => {
  test("disabled turns off every box", async () => {
    await render(<OtpField aria-label="Code" disabled />);

    for (const input of boxes()) {
      expect(input.disabled).toBe(true);
      expect(getComputedStyle(input).opacity).toBe("0.5");
    }
  });

  test("invalid goes on each box and not on the group", async () => {
    await render(<OtpField aria-label="Code" length={2} aria-invalid />);

    for (const input of boxes()) {
      expect(input.getAttribute("aria-invalid")).toBe("true");
    }
    expect(group().element().hasAttribute("aria-invalid")).toBe(false);
  });
});

describe("styles", () => {
  test("boxes are squares at the mouse height, 8px apart", async () => {
    await render(<OtpField aria-label="Code" />);
    const first = box(1).getBoundingClientRect();
    const second = box(2).getBoundingClientRect();

    expect(first.width).toBe(40);
    expect(first.height).toBe(40);
    expect(second.left - first.right).toBe(8);
    expect(getComputedStyle(box(1)).textAlign).toBe("center");
  });

  test("boxes get narrower before they overflow a small container", async () => {
    await render(
      <div style={{ inlineSize: 200 }}>
        <OtpField aria-label="Code" />
      </div>,
    );

    expect(group().element().getBoundingClientRect().width).toBe(200);
    expect(box(1).getBoundingClientRect().width).toBeLessThan(40);
    // Half a pixel of slack: WebKit rounds six shrunken boxes a hair over.
    expect(box(6).getBoundingClientRect().right).toBeLessThanOrEqual(
      group().element().getBoundingClientRect().right + 0.5,
    );
  });

  test("the box with focus has a ring", async () => {
    await render(<OtpField aria-label="Code" />);

    await userEvent.keyboard("{Tab}");

    expect(getComputedStyle(box(1)).outlineStyle).toBe("solid");
    expect(getComputedStyle(box(2)).outlineStyle).toBe("none");
  });

  test("the first box is on the right in a right-to-left layout", async () => {
    await render(
      <div dir="rtl">
        <OtpField aria-label="Code" />
      </div>,
    );

    expect(box(1).getBoundingClientRect().left).toBeGreaterThan(
      box(2).getBoundingClientRect().left,
    );
  });

  test("variables change the size and the gap", async () => {
    await render(
      <OtpField
        aria-label="Code"
        style={
          {
            "--nuv-otp-field-size": "56px",
            "--nuv-otp-field-gap": "4px",
          } as never
        }
      />,
    );

    expect(box(1).getBoundingClientRect().width).toBe(56);
    expect(
      box(2).getBoundingClientRect().left -
        box(1).getBoundingClientRect().right,
    ).toBe(4);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe empty, filled, invalid and disabled", async () => {
    const screen = await renderThemed(
      theme,
      <div style={{ display: "grid", gap: 16 }}>
        <OtpField aria-label="Empty" length={4} />
        <OtpField aria-label="Filled" length={4} defaultValue="1234" />
        <OtpField aria-label="Invalid" length={4} aria-invalid groupSize={2} />
        <OtpField aria-label="Disabled" length={4} disabled />
      </div>,
    );

    await expectNoViolations(screen.container);
  });

  test("a box's edge and the dash can be seen", async () => {
    const screen = await renderThemed(
      theme,
      <OtpField aria-label="Code" groupSize={3} />,
    );
    const pageColor = getComputedStyle(
      screen.container.firstElementChild as Element,
    ).backgroundColor;
    const dash = screen.container.querySelector(
      ".nuv-otp-field__separator",
    ) as Element;

    expect(
      contrast(getComputedStyle(box(1)).borderTopColor, pageColor),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrast(getComputedStyle(dash).borderTopColor, pageColor),
    ).toBeGreaterThanOrEqual(3);
  });
});
