import "../../styles/index.scss";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { contrast } from "../../../test/contrast";
import { expectNoViolations, renderThemed, themes } from "../../../test/themed";
import { Button, type ButtonProps } from "../button/button";
import { Input } from "../input/input";
import { InputGroup, InputGroupAddon } from "../input-group/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select/select";
import { Toggle } from "../toggle/toggle";
import { ButtonGroup, type ButtonGroupProps } from "./button-group";

function Three({
  intent = "secondary",
  dir,
  ...props
}: ButtonGroupProps & { intent?: ButtonProps["intent"] }) {
  return (
    <div dir={dir} style={{ padding: 40 }}>
      <ButtonGroup aria-label="History" {...props}>
        <Button intent={intent}>Back</Button>
        <Button intent={intent}>Reload</Button>
        <Button intent={intent}>Forward</Button>
      </ButtonGroup>
    </div>
  );
}

const button = (name: string) => page.getByRole("button", { name });
const box = (name: string) => button(name).element().getBoundingClientRect();
const style = (name: string) => getComputedStyle(button(name).element());

describe("rendering", () => {
  test("is a group, named by its label", async () => {
    await render(<Three />);
    const group = page.getByRole("group", { name: "History" });

    await expect.element(group).toBeVisible();
    expect(group.element().className).toBe(
      "nuv-button-group nuv-button-group--horizontal",
    );
  });

  test("forwards its ref, keeps a className and passes props on", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <ButtonGroup ref={ref} className="mine" data-test="x">
        <Button>Save</Button>
      </ButtonGroup>,
    );

    expect(ref.current?.className).toContain("mine");
    expect(ref.current?.getAttribute("data-test")).toBe("x");
  });

  test("each button still works by itself", async () => {
    await render(<Three />);

    await userEvent.keyboard("{Tab}");
    await expect.element(button("Back")).toHaveFocus();
    await userEvent.keyboard("{Tab}");
    await expect.element(button("Reload")).toHaveFocus();
  });
});

describe("styles", () => {
  test("joins the buttons: shared edges, round corners only at the ends", async () => {
    await render(<Three />);

    expect(box("Reload").left).toBe(box("Back").right - 1);
    expect(box("Forward").left).toBe(box("Reload").right - 1);

    expect(style("Back").borderTopLeftRadius).toBe("6px");
    expect(style("Back").borderBottomRightRadius).toBe("0px");
    expect(style("Reload").borderRadius).toBe("0px");
    expect(style("Forward").borderTopRightRadius).toBe("6px");
    expect(style("Forward").borderBottomLeftRadius).toBe("0px");
  });

  test("a button alone in a group keeps all its corners", async () => {
    await render(
      <ButtonGroup>
        <Button>Save</Button>
      </ButtonGroup>,
    );

    expect(style("Save").borderRadius).toBe("6px");
  });

  test("the round corners swap ends in a right-to-left layout", async () => {
    await render(<Three dir="rtl" />);

    expect(box("Back").left).toBeGreaterThan(box("Reload").left);
    expect(style("Back").borderTopRightRadius).toBe("6px");
    expect(style("Back").borderTopLeftRadius).toBe("0px");
  });

  test("a vertical group stacks and joins top to bottom", async () => {
    await render(<Three orientation="vertical" />);

    expect(box("Reload").left).toBe(box("Back").left);
    expect(box("Reload").top).toBe(box("Back").bottom - 1);
    expect(box("Reload").width).toBe(box("Forward").width);
    expect(style("Back").borderTopRightRadius).toBe("6px");
    expect(style("Back").borderBottomRightRadius).toBe("0px");
    expect(style("Forward").borderBottomLeftRadius).toBe("6px");
  });

  test("filled buttons get a line between them", async () => {
    await render(<Three intent="primary" />);

    expect(style("Back").borderLeftColor).toBe("rgba(0, 0, 0, 0)");
    expect(style("Reload").borderLeftColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(style("Reload").borderTopColor).toBe("rgba(0, 0, 0, 0)");
  });

  test("the line is on the top edge in a vertical group", async () => {
    await render(<Three intent="danger" orientation="vertical" />);

    expect(style("Reload").borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(style("Reload").borderLeftColor).toBe("rgba(0, 0, 0, 0)");
  });

  test("the button with focus is above its neighbours, so its ring shows whole", async () => {
    await render(<Three />);

    await userEvent.keyboard("{Tab}{Tab}");

    await expect.element(button("Reload")).toHaveFocus();
    expect(style("Reload").zIndex).toBe("1");
    expect(style("Forward").zIndex).toBe("auto");
  });

  test("an input and a select trigger join the same way", async () => {
    await render(
      <div style={{ inlineSize: 360 }}>
        <ButtonGroup>
          <Select defaultValue="https">
            <SelectTrigger
              aria-label="Protocol"
              style={{ "--nuv-select-width": "6rem" } as never}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="https">https</SelectItem>
            </SelectContent>
          </Select>
          <Input aria-label="Address" />
          <Button>Go</Button>
        </ButtonGroup>
      </div>,
    );
    const input = page.getByRole("textbox", { name: "Address" }).element();
    const trigger = page.getByRole("combobox").element();
    const go = box("Go");

    expect(getComputedStyle(input).borderRadius).toBe("0px");
    expect(getComputedStyle(trigger).borderTopLeftRadius).toBe("6px");
    expect(getComputedStyle(trigger).borderTopRightRadius).toBe("0px");
    expect(input.getBoundingClientRect().left).toBeCloseTo(
      trigger.getBoundingClientRect().right - 1,
      1,
    );
    expect(go.left).toBeCloseTo(input.getBoundingClientRect().right - 1, 1);
    // All one height, and the input takes the room the others leave.
    expect(input.getBoundingClientRect().height).toBe(go.height);
    expect(go.right).toBeLessThanOrEqual(
      (input.parentElement as Element).getBoundingClientRect().left + 360,
    );
  });

  test("a toggle and an input group join the same way", async () => {
    const screen = await render(
      <div style={{ inlineSize: 360 }}>
        <ButtonGroup>
          <Toggle variant="outline">Pin</Toggle>
          <InputGroup>
            <InputGroupAddon>#</InputGroupAddon>
            <Input aria-label="Tag" />
          </InputGroup>
          <Button intent="secondary">Add</Button>
        </ButtonGroup>
      </div>,
    );
    const pin = getComputedStyle(button("Pin").element());
    const group = screen.container.querySelector(
      ".nuv-input-group",
    ) as HTMLElement;

    expect(pin.borderTopLeftRadius).toBe("6px");
    expect(pin.borderTopRightRadius).toBe("0px");
    expect(getComputedStyle(group).borderRadius).toBe("0px");
    expect(group.getBoundingClientRect().left).toBeCloseTo(
      box("Pin").right - 1,
      1,
    );
    expect(box("Add").left).toBeCloseTo(
      group.getBoundingClientRect().right - 1,
      1,
    );
    expect(group.getBoundingClientRect().height).toBe(box("Add").height);
    expect(style("Add").borderTopRightRadius).toBe("6px");
  });

  test("a variable changes the line between filled buttons", async () => {
    await render(
      <div style={{ "--nuv-button-group-divider": "rgb(1, 2, 3)" } as never}>
        <Three intent="primary" />
      </div>,
    );

    expect(style("Reload").borderLeftColor).toBe("rgb(1, 2, 3)");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe with bordered and filled buttons", async () => {
    const screen = await renderThemed(
      theme,
      <div style={{ display: "grid", gap: 16, justifyItems: "start" }}>
        <ButtonGroup aria-label="History">
          <Button intent="secondary">Back</Button>
          <Button intent="secondary">Forward</Button>
        </ButtonGroup>
        <ButtonGroup aria-label="Save options">
          <Button>Save</Button>
          <Button>Save as</Button>
        </ButtonGroup>
      </div>,
    );

    await expectNoViolations(screen.container);
  });

  test("the line between filled buttons can be told from the fill", async () => {
    await renderThemed(
      theme,
      <ButtonGroup>
        <Button>Save</Button>
        <Button>Save as</Button>
      </ButtonGroup>,
    );
    const second = style("Save as");

    // Not a control's edge, so it isn't held to 3:1. It only has to show.
    expect(
      contrast(
        blend(second.borderLeftColor, second.backgroundColor),
        second.backgroundColor,
      ),
    ).toBeGreaterThan(1.15);
  });
});

// A see-through color as it looks over a solid one.
function blend(top: string, under: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("2D canvas isn't available");
  for (const color of [under, top]) {
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
  }
  const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
  return `rgb(${red}, ${green}, ${blue})`;
}
