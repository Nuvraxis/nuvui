import "../../styles/index.scss";
import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { contrast } from "../../../test/contrast";
import {
  expectNoViolations,
  hitAt,
  renderThemed,
  themes,
} from "../../../test/themed";
import { Input } from "../input/input";
import { InputGroup, InputGroupAddon, InputGroupButton } from "./input-group";

function Site({
  dir,
  onCopy,
  ...props
}: {
  dir?: "ltr" | "rtl";
  onCopy?: () => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
}) {
  return (
    <div dir={dir} style={{ padding: 40, inlineSize: 340 }}>
      <InputGroup>
        <InputGroupAddon>https://</InputGroupAddon>
        <Input aria-label="Site" {...props} />
        <InputGroupButton onClick={onCopy} disabled={props.disabled}>
          Copy
        </InputGroupButton>
      </InputGroup>
    </div>
  );
}

const input = () => page.getByRole("textbox", { name: "Site" });
const button = () => page.getByRole("button", { name: "Copy" });
const group = () => input().element().parentElement as HTMLElement;
const addon = () => page.getByText("https://");
const box = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);

describe("rendering", () => {
  test("puts the parts in one box, in the order they're written", async () => {
    await render(<Site />);

    expect(group().className).toBe("nuv-input-group");
    expect(box(addon().element()).right).toBeLessThanOrEqual(
      box(input().element()).left,
    );
    expect(box(input().element()).right).toBeLessThanOrEqual(
      box(button().element()).left,
    );
    // Everything is inside the group's edge.
    expect(box(addon().element()).left).toBeGreaterThan(box(group()).left);
    expect(box(button().element()).right).toBeLessThan(box(group()).right);
  });

  test("the input gives up its own edge and fills the room that's left", async () => {
    await render(<Site />);

    expect(style(input().element()).borderTopWidth).toBe("0px");
    expect(style(input().element()).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(style(group()).borderTopWidth).toBe("1px");
    expect(box(group()).width).toBe(340);
    expect(box(group()).height).toBe(40);
    expect(box(input().element()).height).toBe(38);
  });

  test("the button doesn't submit a form", async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    const onCopy = vi.fn();
    await render(
      <form onSubmit={onSubmit}>
        <Site onCopy={onCopy} />
      </form>,
    );

    await button().click();

    expect(onCopy).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
    await expect.element(button()).toHaveAttribute("type", "button");
  });

  test("forwards refs and keeps class names", async () => {
    const root = createRef<HTMLDivElement>();
    const text = createRef<HTMLDivElement>();
    const action = createRef<HTMLButtonElement>();
    await render(
      <InputGroup ref={root} className="one">
        <InputGroupAddon ref={text} className="two">
          $
        </InputGroupAddon>
        <Input aria-label="Amount" />
        <InputGroupButton ref={action} className="three">
          Max
        </InputGroupButton>
      </InputGroup>,
    );

    expect(root.current?.className).toBe("nuv-input-group one");
    expect(text.current?.className).toBe("nuv-input-group__addon two");
    expect(action.current?.className).toBe("nuv-input-group__button three");
  });
});

describe("pointer", () => {
  test("a press on the text beside the input puts the cursor in it", async () => {
    await render(<Site />);

    await addon().click();

    await expect.element(input()).toHaveFocus();
  });

  test("a press on the button doesn't", async () => {
    await render(<Site />);

    await button().click();

    await expect.element(input()).not.toHaveFocus();
  });

  test("a handler of your own can stop it", async () => {
    await render(
      <InputGroup onPointerDown={(event) => event.preventDefault()}>
        <InputGroupAddon>$</InputGroupAddon>
        <Input aria-label="Amount" />
      </InputGroup>,
    );

    await page.getByText("$").click();

    await expect
      .element(page.getByRole("textbox", { name: "Amount" }))
      .not.toHaveFocus();
  });
});

describe("keyboard", () => {
  test("Tab goes to the input and then to the button", async () => {
    await render(<Site />);

    await userEvent.keyboard("{Tab}");
    await expect.element(input()).toHaveFocus();
    await userEvent.keyboard("{Tab}");
    await expect.element(button()).toHaveFocus();
  });

  test("the ring goes around the box for the input, and around the button for the button", async () => {
    await render(<Site />);

    await userEvent.keyboard("{Tab}");
    expect(style(group()).outlineStyle).toBe("solid");
    expect(style(input().element()).outlineStyle).toBe("none");

    await userEvent.keyboard("{Tab}");
    expect(style(group()).outlineStyle).toBe("none");
    expect(style(button().element()).outlineStyle).toBe("solid");
  });
});

describe("styles", () => {
  test("the box takes the invalid edge and the disabled fade from its input", async () => {
    const screen = await render(
      <>
        <Site />
        <Site aria-invalid />
        <Site disabled />
      </>,
    );
    const [plain, wrong, off] = [
      ...screen.container.querySelectorAll(".nuv-input-group"),
    ] as [Element, Element, Element];

    expect(style(wrong).borderTopColor).not.toBe(style(plain).borderTopColor);
    expect(style(off).opacity).toBe("0.5");
    // Faded once, by the box.
    expect(style(off.querySelector("input") as Element).opacity).toBe("1");
  });

  test("the button is smaller than the box and has no wider tap area with a mouse", async () => {
    await render(<Site />);
    const element = button().element();

    expect(box(element).height).toBe(32);
    expect(hitAt(element, 0, -20)).not.toBe(element);
  });

  test("the order turns around in a right-to-left layout", async () => {
    await render(<Site dir="rtl" />);

    expect(box(addon().element()).left).toBeGreaterThanOrEqual(
      box(input().element()).right,
    );
    expect(box(button().element()).right).toBeLessThanOrEqual(
      box(input().element()).left,
    );
  });

  test("variables change its look", async () => {
    await render(
      <div
        style={
          {
            "--nuv-input-group-height": "60px",
            "--nuv-input-group-radius": "0px",
            "--nuv-input-group-width": "200px",
          } as never
        }
      >
        <InputGroup>
          <Input aria-label="Site" />
          <InputGroupButton>Copy</InputGroupButton>
        </InputGroup>
      </div>,
    );

    expect(box(group()).height).toBe(60);
    expect(box(group()).width).toBe(200);
    expect(style(group()).borderRadius).toBe("0px");
    expect(box(button().element()).height).toBe(52);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe", async () => {
    const screen = await renderThemed(
      theme,
      <div style={{ display: "grid", gap: 16 }}>
        <InputGroup>
          <InputGroupAddon>https://</InputGroupAddon>
          <Input aria-label="Site" placeholder="example.com" />
          <InputGroupButton>Copy</InputGroupButton>
        </InputGroup>
        <InputGroup>
          <Input aria-label="Amount" aria-invalid defaultValue="12" />
          <InputGroupAddon>USD</InputGroupAddon>
        </InputGroup>
      </div>,
    );

    await expectNoViolations(screen.container);
  });

  test("the box's edge can be seen", async () => {
    const screen = await renderThemed(
      theme,
      <InputGroup>
        <Input aria-label="Site" />
      </InputGroup>,
    );
    const pageColor = style(
      screen.container.firstElementChild as Element,
    ).backgroundColor;

    expect(
      contrast(style(group()).borderTopColor, pageColor),
    ).toBeGreaterThanOrEqual(3);
  });
});
