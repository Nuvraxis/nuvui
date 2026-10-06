import "../../styles/index.scss";
import { type ComponentProps, createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { contrast } from "../../../test/contrast";
import { expectNoViolations, renderThemed, themes } from "../../../test/themed";
import { NativeSelect } from "./native-select";

function Fruit({
  dir,
  ...props
}: ComponentProps<typeof NativeSelect> & { dir?: "ltr" | "rtl" }) {
  return (
    <div dir={dir} style={{ display: "grid", gap: 8, padding: 40 }}>
      <label htmlFor="fruit">Fruit</label>
      <NativeSelect id="fruit" {...props}>
        <option value="">Pick a fruit</option>
        <option value="apple">Apple</option>
        <option value="banana">Banana</option>
      </NativeSelect>
    </div>
  );
}

const select = () => page.getByLabelText("Fruit");
const wrapper = () => select().element().parentElement as HTMLElement;
const icon = () =>
  wrapper().querySelector(".nuv-native-select__icon") as SVGElement;
const style = () => getComputedStyle(select().element());

describe("rendering", () => {
  test("renders the browser's own select", async () => {
    await render(<Fruit />);

    await userEvent.selectOptions(select(), "banana");

    expect(select().element().tagName).toBe("SELECT");
    await expect.element(select()).toHaveValue("banana");
  });

  test("the class name goes on the wrapper, and the rest on the select", async () => {
    const ref = createRef<HTMLSelectElement>();
    await render(<Fruit ref={ref} className="mine" data-test="x" />);

    expect(ref.current).toBe(select().element());
    expect(wrapper().className).toBe("nuv-native-select mine");
    await expect.element(select()).toHaveClass("nuv-native-select__control");
    await expect.element(select()).toHaveAttribute("data-test", "x");
  });

  test("can be controlled", async () => {
    const onChange = vi.fn();
    await render(<Fruit value="apple" onChange={onChange} />);

    await userEvent.selectOptions(select(), "banana");

    expect(onChange).toHaveBeenCalled();
    await expect.element(select()).toHaveValue("apple");
  });

  test("submits with a form", async () => {
    let submitted: FormData | undefined;
    await render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = new FormData(event.currentTarget);
        }}
      >
        <Fruit name="fruit" defaultValue="apple" />
        <button type="submit">Send</button>
      </form>,
    );

    await page.getByRole("button", { name: "Send" }).click();

    expect(submitted?.get("fruit")).toBe("apple");
  });

  test("required blocks the form until something is picked", async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    await render(
      <form onSubmit={onSubmit}>
        <Fruit name="fruit" required />
      </form>,
    );
    const form = select().element().closest("form");

    form?.requestSubmit();
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.selectOptions(select(), "apple");
    form?.requestSubmit();
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});

describe("keyboard", () => {
  test("Tab focuses it and typing a letter picks an option", async () => {
    await render(<Fruit />);

    await userEvent.keyboard("{Tab}");
    await expect.element(select()).toHaveFocus();
    await userEvent.keyboard("b");

    await expect.element(select()).toHaveValue("banana");
  });

  test("a disabled one is skipped", async () => {
    await render(
      <>
        <Fruit disabled />
        <button type="button">Next</button>
      </>,
    );

    await userEvent.keyboard("{Tab}");

    await expect
      .element(page.getByRole("button", { name: "Next" }))
      .toHaveFocus();
  });
});

describe("styles", () => {
  test("fills the width it's given, at the mouse height", async () => {
    await render(
      <div style={{ inlineSize: 300 }}>
        <NativeSelect aria-label="Fruit">
          <option>Apple</option>
        </NativeSelect>
      </div>,
    );
    const box = select().element().getBoundingClientRect();

    expect(box.width).toBe(300);
    expect(box.height).toBe(40);
  });

  test("draws its own arrow in place of the browser's", async () => {
    await render(<Fruit />);
    const arrow = icon().getBoundingClientRect();
    const box = select().element().getBoundingClientRect();

    expect(style().appearance).toBe("none");
    expect(arrow.width).toBe(16);
    // Inside the box, at the end, and centered on its height.
    expect(arrow.right).toBeLessThan(box.right);
    expect(arrow.left).toBeGreaterThan(box.left + box.width / 2);
    expect(arrow.top + arrow.height / 2).toBeCloseTo(
      box.top + box.height / 2,
      0,
    );
  });

  test("a click on the arrow lands on the select", async () => {
    await render(<Fruit />);
    const arrow = icon().getBoundingClientRect();

    expect(
      document.elementFromPoint(
        arrow.left + arrow.width / 2,
        arrow.top + arrow.height / 2,
      ),
    ).toBe(select().element());
  });

  test("the arrow is at the other end in a right-to-left layout", async () => {
    await render(<Fruit dir="rtl" />);
    const arrow = icon().getBoundingClientRect();
    const box = select().element().getBoundingClientRect();

    expect(arrow.left).toBeGreaterThan(box.left);
    expect(arrow.right).toBeLessThan(box.left + box.width / 2);
  });

  test("the text leaves room for the arrow", async () => {
    await render(<Fruit />);
    const arrow = icon().getBoundingClientRect();
    const box = select().element().getBoundingClientRect();

    expect(Number.parseFloat(style().paddingRight)).toBeGreaterThan(
      box.right - arrow.left,
    );
  });

  test("a list box has no arrow", async () => {
    await render(<Fruit multiple />);

    expect(getComputedStyle(icon()).display).toBe("none");
    expect(select().element().getBoundingClientRect().height).toBeGreaterThan(
      40,
    );
  });

  test("shows a focus ring when it has focus", async () => {
    await render(<Fruit />);

    await userEvent.keyboard("{Tab}");

    expect(style().outlineStyle).toBe("solid");
  });

  test("an invalid one has a different edge, and a disabled one fades with its arrow", async () => {
    await render(
      <>
        <NativeSelect aria-label="Plain">
          <option>A</option>
        </NativeSelect>
        <NativeSelect aria-label="Wrong" aria-invalid>
          <option>A</option>
        </NativeSelect>
        <NativeSelect aria-label="Off" disabled>
          <option>A</option>
        </NativeSelect>
      </>,
    );
    const look = (name: string) =>
      getComputedStyle(page.getByLabelText(name).element());
    const off = page.getByLabelText("Off").element();

    expect(look("Wrong").borderTopColor).not.toBe(look("Plain").borderTopColor);
    expect(look("Off").opacity).toBe("0.5");
    expect(getComputedStyle(off.nextElementSibling as Element).opacity).toBe(
      "0.5",
    );
  });

  test("variables change its look", async () => {
    await render(
      <div
        style={
          {
            "--nuv-native-select-width": "200px",
            "--nuv-native-select-height": "60px",
          } as never
        }
      >
        <NativeSelect aria-label="Fruit">
          <option>Apple</option>
        </NativeSelect>
      </div>,
    );
    const box = select().element().getBoundingClientRect();

    expect(box.width).toBe(200);
    expect(box.height).toBe(60);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe plain, invalid and disabled", async () => {
    const screen = await renderThemed(
      theme,
      <div style={{ display: "grid", gap: 8 }}>
        <label htmlFor="a">Plain</label>
        <NativeSelect id="a">
          <option>Apple</option>
          <option>Banana</option>
        </NativeSelect>
        <label htmlFor="b">Invalid</label>
        <NativeSelect id="b" aria-invalid>
          <option>Apple</option>
        </NativeSelect>
        <label htmlFor="c">Disabled</label>
        <NativeSelect id="c" disabled>
          <option>Apple</option>
        </NativeSelect>
      </div>,
    );

    await expectNoViolations(screen.container);
  });

  test("the edge and the arrow can be seen", async () => {
    const screen = await renderThemed(
      theme,
      <NativeSelect aria-label="Fruit">
        <option>Apple</option>
      </NativeSelect>,
    );
    const element = screen.getByLabelText("Fruit").element();
    const field = getComputedStyle(element);
    const pageColor = getComputedStyle(
      screen.container.firstElementChild as Element,
    ).backgroundColor;

    expect(contrast(field.borderTopColor, pageColor)).toBeGreaterThanOrEqual(3);
    expect(
      contrast(
        getComputedStyle(element.nextElementSibling as Element).color,
        field.backgroundColor,
      ),
    ).toBeGreaterThanOrEqual(3);
  });
});
