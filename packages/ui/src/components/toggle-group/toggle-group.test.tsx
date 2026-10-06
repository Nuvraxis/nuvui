import "../../styles/index.scss";
import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { emulateMedia } from "../../../test/media";
import { expectNoViolations, renderThemed, themes } from "../../../test/themed";
import {
  ToggleGroup,
  ToggleGroupItem,
  type ToggleGroupProps,
} from "./toggle-group";

type Extra = Partial<
  Pick<
    ToggleGroupProps,
    "variant" | "size" | "orientation" | "dir" | "disabled" | "className"
  >
>;

function Align(props: Extra & { defaultValue?: string }) {
  return (
    <div style={{ padding: 40 }}>
      <ToggleGroup type="single" aria-label="Alignment" {...props}>
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="center">Center</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

function Format(props: Extra & { defaultValue?: string[] }) {
  return (
    <div style={{ padding: 40 }}>
      <ToggleGroup type="multiple" aria-label="Formatting" {...props}>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

const option = (name: string) => page.getByRole("radio", { name });
const button = (name: string) => page.getByRole("button", { name });
const box = (name: string) =>
  page.getByText(name, { exact: true }).element().getBoundingClientRect();
const style = (name: string) =>
  getComputedStyle(page.getByText(name, { exact: true }).element());

// Radix moves focus a moment after an arrow key goes down. See the same
// helper in the radio group's tests.
async function arrow(key: "ArrowRight" | "ArrowLeft" | "ArrowDown") {
  await userEvent.keyboard(`{${key}>}`);
  await new Promise((resolve) => setTimeout(resolve, 30));
  await userEvent.keyboard(`{/${key}}`);
}

describe("one at a time", () => {
  test("is a radio group, and a click picks one option", async () => {
    await render(<Align />);

    await expect
      .element(page.getByRole("radiogroup", { name: "Alignment" }))
      .toBeVisible();
    await option("Center").click();
    await expect.element(option("Center")).toBeChecked();

    await option("Right").click();
    await expect.element(option("Right")).toBeChecked();
    await expect.element(option("Center")).not.toBeChecked();
  });

  test("a click on the picked option lets go of it", async () => {
    await render(<Align defaultValue="left" />);

    await option("Left").click();

    await expect.element(option("Left")).not.toBeChecked();
  });

  test("can be controlled", async () => {
    const onValueChange = vi.fn();
    await render(
      <ToggleGroup
        type="single"
        aria-label="Alignment"
        value="left"
        onValueChange={onValueChange}
      >
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>,
    );

    await option("Right").click();

    expect(onValueChange).toHaveBeenCalledWith("right");
    await expect.element(option("Left")).toBeChecked();
  });
});

describe("several at a time", () => {
  test("is a row of buttons that press on and off by themselves", async () => {
    await render(<Format />);

    await button("Bold").click();
    await button("Italic").click();

    await expect
      .element(button("Bold"))
      .toHaveAttribute("aria-pressed", "true");
    await expect
      .element(button("Italic"))
      .toHaveAttribute("aria-pressed", "true");

    await button("Bold").click();
    await expect
      .element(button("Bold"))
      .toHaveAttribute("aria-pressed", "false");
  });
});

describe("keyboard", () => {
  test("Tab enters the group once and the arrow keys move inside it", async () => {
    await render(
      <>
        <Align />
        <button type="button">Next</button>
      </>,
    );

    await userEvent.keyboard("{Tab}");
    await expect.element(option("Left")).toHaveFocus();

    await arrow("ArrowRight");
    await expect.element(option("Center")).toHaveFocus();
    // Moving doesn't pick. Space does.
    await expect.element(option("Center")).not.toBeChecked();
    await userEvent.keyboard(" ");
    await expect.element(option("Center")).toBeChecked();

    await userEvent.keyboard("{Tab}");
    await expect.element(button("Next")).toHaveFocus();
  });

  test("the left and right arrows swap in a right-to-left group", async () => {
    await render(<Align dir="rtl" />);

    await userEvent.keyboard("{Tab}");
    await arrow("ArrowLeft");

    await expect.element(option("Center")).toHaveFocus();
  });

  test("a vertical group moves with the up and down arrows", async () => {
    await render(<Align orientation="vertical" />);

    await userEvent.keyboard("{Tab}");
    await arrow("ArrowDown");

    await expect.element(option("Center")).toHaveFocus();
  });

  test("a disabled group is skipped", async () => {
    await render(
      <>
        <Align disabled />
        <button type="button">Next</button>
      </>,
    );

    await userEvent.keyboard("{Tab}");

    await expect.element(button("Next")).toHaveFocus();
    expect(style("Left").opacity).toBe("0.5");
  });
});

describe("styles", () => {
  test("the group hands its variant and size to every button", async () => {
    const screen = await render(<Align />);
    await expect
      .element(option("Left"))
      .toHaveClass(
        "nuv-toggle",
        "nuv-toggle--outline",
        "nuv-toggle--md",
        "nuv-toggle-group__item",
      );

    await screen.rerender(<Align variant="ghost" size="sm" />);
    await expect
      .element(option("Left"))
      .toHaveClass("nuv-toggle--ghost", "nuv-toggle--sm");
    expect(box("Left").height).toBe(32);
  });

  test("outlined buttons are joined: shared edges, round corners only at the ends", async () => {
    await render(<Align />);

    // Each overlaps the one before it by the 1px edge.
    expect(box("Center").left).toBe(box("Left").right - 1);
    expect(box("Right").left).toBe(box("Center").right - 1);

    expect(style("Left").borderTopLeftRadius).toBe("6px");
    expect(style("Left").borderTopRightRadius).toBe("0px");
    expect(style("Center").borderRadius).toBe("0px");
    expect(style("Right").borderBottomRightRadius).toBe("6px");
    expect(style("Right").borderBottomLeftRadius).toBe("0px");
  });

  test("the round corners swap ends in a right-to-left group", async () => {
    await render(<Align dir="rtl" />);

    expect(box("Left").left).toBeGreaterThan(box("Center").left);
    expect(style("Left").borderTopRightRadius).toBe("6px");
    expect(style("Left").borderTopLeftRadius).toBe("0px");
  });

  test("a vertical group stacks and joins top to bottom", async () => {
    await render(<Align orientation="vertical" />);

    expect(box("Center").left).toBe(box("Left").left);
    expect(box("Center").top).toBe(box("Left").bottom - 1);
    expect(style("Left").borderTopLeftRadius).toBe("6px");
    expect(style("Left").borderBottomLeftRadius).toBe("0px");
    expect(style("Right").borderBottomRightRadius).toBe("6px");
    expect(style("Right").borderTopRightRadius).toBe("0px");
  });

  test("ghost buttons keep their corners and sit a little apart", async () => {
    await render(<Align variant="ghost" />);

    expect(box("Center").left - box("Left").right).toBe(4);
    expect(style("Center").borderRadius).toBe("6px");
  });

  test("the pressed button's edge isn't covered by the next one", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Align defaultValue="left" />);
    const pressed = page.getByText("Left", { exact: true }).element();
    const edge = pressed.getBoundingClientRect();

    expect(
      document.elementFromPoint(edge.right - 0.5, edge.top + edge.height / 2),
    ).toBe(pressed);
  });

  test("the button with focus is above its neighbours, so its ring shows whole", async () => {
    await render(<Align defaultValue="center" />);

    await userEvent.keyboard("{Tab}");

    await expect.element(option("Center")).toHaveFocus();
    expect(style("Center").outlineStyle).toBe("solid");
    expect(Number(style("Center").zIndex)).toBeGreaterThan(
      Number(style("Left").zIndex) || 0,
    );
  });

  test("forwards refs and keeps class names", async () => {
    const root = createRef<HTMLDivElement>();
    const item = createRef<HTMLButtonElement>();
    await render(
      <ToggleGroup
        ref={root}
        type="single"
        aria-label="Alignment"
        className="mine"
      >
        <ToggleGroupItem ref={item} value="left" className="yours">
          Left
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(root.current?.className).toBe(
      "nuv-toggle-group nuv-toggle-group--outline nuv-toggle-group--horizontal mine",
    );
    expect(item.current?.className).toContain("nuv-toggle-group__item yours");
  });

  test("a variable changes the gap between ghost buttons", async () => {
    await render(
      <div style={{ "--nuv-toggle-group-gap": "12px" } as never}>
        <Align variant="ghost" />
      </div>,
    );

    expect(box("Center").left - box("Left").right).toBe(12);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe as a radio group and as a row of buttons", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const screen = await renderThemed(
      theme,
      <div style={{ display: "grid", gap: 16, justifyItems: "start" }}>
        <ToggleGroup type="single" aria-label="Alignment" defaultValue="left">
          <ToggleGroupItem value="left">Left</ToggleGroupItem>
          <ToggleGroupItem value="center">Center</ToggleGroupItem>
          <ToggleGroupItem value="right" disabled>
            Right
          </ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          type="multiple"
          aria-label="Formatting"
          variant="ghost"
          defaultValue={["bold"]}
        >
          <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
          <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
        </ToggleGroup>
      </div>,
    );

    await expectNoViolations(screen.container);
  });
});
