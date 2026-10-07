import "../../styles/index.scss";
import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { contrast } from "../../../test/contrast";
import { emulateMedia, setViewport } from "../../../test/media";
import {
  expectNoViolations,
  renderThemed,
  themeAttributes,
  themes,
} from "../../../test/themed";
import { Button } from "../button";
import {
  Toolbar,
  ToolbarButton,
  ToolbarLink,
  type ToolbarProps,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from "./toolbar";

function Example(props: ToolbarProps) {
  return (
    <Toolbar aria-label="Formatting" {...props}>
      <ToolbarToggleGroup type="multiple" aria-label="Text style">
        <ToolbarToggleItem value="bold">Bold</ToolbarToggleItem>
        <ToolbarToggleItem value="italic">Italic</ToolbarToggleItem>
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarLink href="#help">Help</ToolbarLink>
      <ToolbarButton>Share</ToolbarButton>
    </Toolbar>
  );
}

const toolbar = () => page.getByRole("toolbar");
const button = (name: string) => page.getByRole("button", { name });
const link = () => page.getByRole("link", { name: "Help" });
const separator = () => page.getByRole("separator");
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);

// Radix moves focus a moment after an arrow key goes down. See the same
// helper in the radio group's tests.
async function arrow(key: string) {
  await userEvent.keyboard(`{${key}>}`);
  await new Promise((resolve) => setTimeout(resolve, 30));
  await userEvent.keyboard(`{/${key}}`);
}

describe("rendering", () => {
  test("is a toolbar with a name, running across", async () => {
    await render(<Example />);

    await expect.element(toolbar()).toHaveAccessibleName("Formatting");
    await expect.element(toolbar()).toHaveClass("nuv-toolbar");
    await expect
      .element(toolbar())
      .toHaveAttribute("aria-orientation", "horizontal");
  });

  test("holds buttons, a link, toggles and a separator that stands upright", async () => {
    await render(<Example />);

    // One toolbar. The toggles inside it are a group, not a second one.
    expect(page.getByRole("toolbar").elements()).toHaveLength(1);

    await expect.element(button("Share")).toHaveClass("nuv-toolbar__button");
    await expect.element(link()).toHaveClass("nuv-toolbar__link");
    await expect
      .element(button("Bold"))
      .toHaveClass("nuv-toolbar__toggle-item");
    await expect
      .element(page.getByRole("group", { name: "Text style" }))
      .toHaveClass("nuv-toolbar__toggle-group");
    await expect
      .element(separator())
      .toHaveAttribute("aria-orientation", "vertical");
  });

  test("a button doesn't submit a form around it", async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    await render(
      <form onSubmit={onSubmit}>
        <Example />
      </form>,
    );

    await button("Share").click();
    await button("Bold").click();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("toggles of type multiple each stay pressed", async () => {
    await render(<Example />);

    await button("Bold").click();
    await button("Italic").click();

    await expect
      .element(button("Bold"))
      .toHaveAttribute("aria-pressed", "true");
    await expect
      .element(button("Italic"))
      .toHaveAttribute("aria-pressed", "true");
  });

  test("toggles of type single let one be picked at a time", async () => {
    const onValueChange = vi.fn();
    await render(
      <Toolbar aria-label="Layout">
        <ToolbarToggleGroup
          type="single"
          aria-label="Alignment"
          defaultValue="left"
          onValueChange={onValueChange}
        >
          <ToolbarToggleItem value="left">Left</ToolbarToggleItem>
          <ToolbarToggleItem value="right">Right</ToolbarToggleItem>
        </ToolbarToggleGroup>
      </Toolbar>,
    );
    const option = (name: string) => page.getByRole("radio", { name });

    await expect.element(option("Left")).toBeChecked();
    await option("Right").click();

    await expect.element(option("Right")).toBeChecked();
    await expect.element(option("Left")).not.toBeChecked();
    expect(onValueChange).toHaveBeenLastCalledWith("right");
  });

  test("asChild puts your own button in the toolbar's arrow-key order", async () => {
    await render(
      <Toolbar aria-label="Actions">
        <ToolbarButton>First</ToolbarButton>
        <ToolbarButton asChild>
          <Button size="sm">Save</Button>
        </ToolbarButton>
      </Toolbar>,
    );

    await userEvent.keyboard("{Tab}");
    await arrow("ArrowRight");

    await expect.element(button("Save")).toHaveFocus();
    await expect.element(button("Save")).toHaveClass("nuv-button");
  });

  test("every part forwards its ref and keeps a className", async () => {
    const refs = {
      toolbar: createRef<HTMLDivElement>(),
      button: createRef<HTMLButtonElement>(),
      link: createRef<HTMLAnchorElement>(),
      separator: createRef<HTMLDivElement>(),
      group: createRef<HTMLDivElement>(),
      item: createRef<HTMLButtonElement>(),
    };
    await render(
      <Toolbar ref={refs.toolbar} className="mine" aria-label="Formatting">
        <ToolbarToggleGroup
          ref={refs.group}
          className="mine"
          type="multiple"
          aria-label="Text style"
        >
          <ToolbarToggleItem ref={refs.item} className="mine" value="bold">
            Bold
          </ToolbarToggleItem>
        </ToolbarToggleGroup>
        <ToolbarSeparator ref={refs.separator} className="mine" />
        <ToolbarLink ref={refs.link} className="mine" href="#help">
          Help
        </ToolbarLink>
        <ToolbarButton ref={refs.button} className="mine">
          Share
        </ToolbarButton>
      </Toolbar>,
    );

    expect(refs.toolbar.current?.className).toBe("nuv-toolbar mine");
    expect(refs.button.current?.className).toBe("nuv-toolbar__button mine");
    expect(refs.link.current?.className).toBe("nuv-toolbar__link mine");
    expect(refs.separator.current?.className).toBe(
      "nuv-toolbar__separator mine",
    );
    expect(refs.group.current?.className).toBe(
      "nuv-toolbar__toggle-group mine",
    );
    expect(refs.item.current?.className).toBe("nuv-toolbar__toggle-item mine");
  });
});

describe("keyboard", () => {
  test("the toolbar is one tab stop", async () => {
    await render(
      <>
        <Example />
        <Button>After</Button>
      </>,
    );

    await userEvent.keyboard("{Tab}");
    await expect.element(button("Bold")).toHaveFocus();

    await userEvent.keyboard("{Tab}");
    await expect.element(button("After")).toHaveFocus();
  });

  test("the arrow keys move through every control, the link included, and wrap", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");

    await arrow("ArrowRight");
    await expect.element(button("Italic")).toHaveFocus();
    await arrow("ArrowRight");
    await expect.element(link()).toHaveFocus();
    await arrow("ArrowRight");
    await expect.element(button("Share")).toHaveFocus();
    await arrow("ArrowRight");
    await expect.element(button("Bold")).toHaveFocus();
    await arrow("ArrowLeft");
    await expect.element(button("Share")).toHaveFocus();
  });

  test("Home and End go to the first and the last control", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");

    await arrow("End");
    await expect.element(button("Share")).toHaveFocus();
    await arrow("Home");
    await expect.element(button("Bold")).toHaveFocus();
  });

  test("Tab comes back to the control that was left", async () => {
    await render(
      <>
        <Example />
        <Button>After</Button>
      </>,
    );
    await userEvent.keyboard("{Tab}");
    await arrow("ArrowRight");
    await userEvent.keyboard("{Tab}");
    await expect.element(button("After")).toHaveFocus();

    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");

    await expect.element(button("Italic")).toHaveFocus();
  });

  test("Space and Enter press the control that has focus", async () => {
    const onClick = vi.fn();
    await render(
      <Toolbar aria-label="Actions">
        <ToolbarToggleGroup type="multiple" aria-label="Text style">
          <ToolbarToggleItem value="bold">Bold</ToolbarToggleItem>
        </ToolbarToggleGroup>
        <ToolbarButton onClick={onClick}>Share</ToolbarButton>
      </Toolbar>,
    );
    await userEvent.keyboard("{Tab}");

    await userEvent.keyboard(" ");
    await expect
      .element(button("Bold"))
      .toHaveAttribute("aria-pressed", "true");

    await arrow("ArrowRight");
    await userEvent.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("a disabled control is skipped", async () => {
    await render(
      <Toolbar aria-label="Actions">
        <ToolbarButton>Cut</ToolbarButton>
        <ToolbarButton disabled>Copy</ToolbarButton>
        <ToolbarButton>Paste</ToolbarButton>
      </Toolbar>,
    );
    await userEvent.keyboard("{Tab}");

    await arrow("ArrowRight");

    await expect.element(button("Paste")).toHaveFocus();
    expect(style(button("Copy").element()).opacity).toBe("0.5");
  });

  test("a vertical toolbar moves with the up and down arrows", async () => {
    await render(<Example orientation="vertical" />);
    await userEvent.keyboard("{Tab}");

    await arrow("ArrowDown");
    await expect.element(button("Italic")).toHaveFocus();
    await arrow("ArrowUp");
    await expect.element(button("Bold")).toHaveFocus();
  });

  test("in a right-to-left toolbar the left arrow moves forward", async () => {
    await render(
      <div dir="rtl">
        <Example dir="rtl" />
      </div>,
    );
    await userEvent.keyboard("{Tab}");

    await arrow("ArrowLeft");

    await expect.element(button("Italic")).toHaveFocus();
    expect(rect(button("Italic").element()).right).toBeLessThan(
      rect(button("Bold").element()).left,
    );
  });

  test("the control with keyboard focus has a ring that can be seen", async () => {
    await render(<Example />);

    await userEvent.keyboard("{Tab}");

    const focused = style(button("Bold").element());
    expect(focused.outlineStyle).toBe("solid");
    expect(contrast(focused.outlineColor, "white")).toBeGreaterThanOrEqual(3);
  });
});

describe("layout", () => {
  test("the controls sit in a row, each 32px tall with a mouse", async () => {
    await render(<Example />);
    const controls = [
      button("Bold"),
      button("Italic"),
      link(),
      button("Share"),
    ].map((control) => rect(control.element()));

    for (const control of controls) {
      expect(control.height).toBe(32);
      expect(control.top).toBe(controls[0]?.top);
      expect(control.width).toBeGreaterThanOrEqual(32);
    }
  });

  test("the separator is a line as tall as the controls", async () => {
    await render(<Example />);

    expect(rect(separator().element()).width).toBe(1);
    expect(rect(separator().element()).height).toBe(32);
  });

  test("a vertical toolbar is a column, with the separator lying down", async () => {
    await render(<Example orientation="vertical" />);

    expect(rect(button("Italic").element()).top).toBeGreaterThanOrEqual(
      rect(button("Bold").element()).bottom,
    );
    // Lying down is what the role means unless it says otherwise.
    await expect.element(separator()).not.toHaveAttribute("aria-orientation");
    expect(rect(separator().element()).height).toBe(1);
    expect(rect(separator().element()).width).toBeGreaterThan(30);
  });

  test("wraps onto a second row when there isn't room, and doesn't widen the page", async () => {
    await setViewport("phone");
    await render(
      <Toolbar aria-label="Formatting">
        {[
          "Undo",
          "Redo",
          "Cut",
          "Copy",
          "Paste",
          "Find",
          "Replace",
          "Print",
        ].map((name) => (
          <ToolbarButton key={name}>{name}</ToolbarButton>
        ))}
      </Toolbar>,
    );

    expect(rect(button("Print").element()).top).toBeGreaterThan(
      rect(button("Undo").element()).top,
    );
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });
});

describe("styles", () => {
  test("a pressed toggle is filled, and one that isn't has no fill", async () => {
    await render(<Example />);
    const resting = style(button("Bold").element()).backgroundColor;

    await button("Bold").click();
    // Moved off, so that what's measured is pressed and not hovered.
    await userEvent.hover(document.body, { position: { x: 0, y: 300 } });

    expect(resting).toBe("rgba(0, 0, 0, 0)");
    await expect
      .poll(() => style(button("Bold").element()).backgroundColor)
      .not.toBe(resting);
  });

  test("a control gets a fill under the pointer", async () => {
    await render(<Example />);
    const resting = style(button("Share").element()).backgroundColor;

    await userEvent.hover(button("Share"));

    await expect
      .poll(() => style(button("Share").element()).backgroundColor)
      .not.toBe(resting);
  });

  test("the link isn't underlined, and has the controls' text color", async () => {
    await render(<Example />);

    expect(style(link().element()).textDecorationLine).toBe("none");
    expect(style(link().element()).color).toBe(
      style(button("Share").element()).color,
    );
  });

  test("component variables change the look", async () => {
    await render(
      <Example
        style={
          {
            "--nuv-toolbar-bg": "rgb(10, 20, 30)",
            "--nuv-toolbar-fg": "rgb(200, 210, 220)",
            "--nuv-toolbar-border": "rgb(40, 50, 60)",
            "--nuv-toolbar-radius": "2px",
            "--nuv-toolbar-padding": "10px",
            "--nuv-toolbar-gap": "12px",
            "--nuv-toolbar-item-height": "50px",
            "--nuv-toolbar-item-radius": "1px",
            "--nuv-toolbar-item-padding-inline": "20px",
            "--nuv-toolbar-item-hover-bg": "rgb(1, 2, 3)",
            "--nuv-toolbar-on-bg": "rgb(4, 5, 6)",
            "--nuv-toolbar-on-fg": "rgb(250, 251, 252)",
          } as never
        }
      />,
    );
    const bar = style(toolbar().element());
    const share = button("Share").element();

    expect(bar.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(bar.borderTopColor).toBe("rgb(40, 50, 60)");
    expect(bar.borderTopLeftRadius).toBe("2px");
    expect(bar.paddingTop).toBe("10px");
    expect(bar.columnGap).toBe("12px");
    expect(style(share).color).toBe("rgb(200, 210, 220)");
    expect(rect(share).height).toBe(50);
    expect(style(share).borderTopLeftRadius).toBe("1px");
    expect(style(share).paddingInlineStart).toBe("20px");
    expect(style(separator().element()).borderInlineStartColor).toBe(
      "rgb(40, 50, 60)",
    );

    await button("Bold").click();
    await userEvent.hover(share);

    await expect.poll(() => style(share).backgroundColor).toBe("rgb(1, 2, 3)");
    await expect
      .poll(() => style(button("Bold").element()).backgroundColor)
      .toBe("rgb(4, 5, 6)");
    expect(style(button("Bold").element()).color).toBe("rgb(250, 251, 252)");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, with a toggle pressed", async () => {
    // Colors change over a moment, and axe would measure them halfway.
    await emulateMedia({ reducedMotion: "reduce" });
    const screen = await renderThemed(theme, <Example />);
    await button("Bold").click();
    await userEvent.hover(document.body, { position: { x: 0, y: 300 } });

    await expectNoViolations(screen.container);
  });

  test("a pressed toggle stands out from one that isn't by 3:1", async () => {
    await render(
      <div {...themeAttributes(theme)}>
        <Toolbar aria-label="Formatting">
          <ToolbarToggleGroup
            type="multiple"
            aria-label="Text style"
            defaultValue={["bold"]}
          >
            <ToolbarToggleItem value="bold">Bold</ToolbarToggleItem>
          </ToolbarToggleGroup>
        </Toolbar>
      </div>,
    );

    expect(
      contrast(
        style(button("Bold").element()).backgroundColor,
        style(toolbar().element()).backgroundColor,
      ),
    ).toBeGreaterThanOrEqual(3);
  });
});
