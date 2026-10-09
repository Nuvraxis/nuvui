import "../../styles/index.scss";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Input } from "./input";

function Labelled(props: ComponentProps<typeof Input>) {
  return (
    <div style={{ display: "grid", gap: 8, padding: 40 }}>
      <label htmlFor="email">Email</label>
      <Input id="email" {...props} />
    </div>
  );
}

const input = () => page.getByRole("textbox", { name: "Email" });
const style = () => getComputedStyle(input().element());

describe("rendering", () => {
  test("renders an input that can be typed into", async () => {
    await render(<Labelled />);

    await input().fill("ada@example.com");

    await expect.element(input()).toHaveValue("ada@example.com");
    expect(input().element().tagName).toBe("INPUT");
  });

  test("passes type and other props to the input", async () => {
    await render(
      <Labelled type="email" placeholder="you@example.com" maxLength={40} />,
    );

    await expect.element(input()).toHaveAttribute("type", "email");
    await expect
      .element(input())
      .toHaveAttribute("placeholder", "you@example.com");
    await expect.element(input()).toHaveAttribute("maxlength", "40");
  });

  test("can be controlled", async () => {
    const onChange = vi.fn();
    await render(<Labelled value="fixed" onChange={onChange} />);

    await userEvent.type(input(), "x");

    expect(onChange).toHaveBeenCalled();
    await expect.element(input()).toHaveValue("fixed");
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
        <Labelled name="email" defaultValue="ada@example.com" />
        <button type="submit">Send</button>
      </form>,
    );

    await page.getByRole("button", { name: "Send" }).click();

    expect(submitted?.get("email")).toBe("ada@example.com");
  });

  test("required blocks the form until it's filled in", async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    await render(
      <form onSubmit={onSubmit}>
        <Labelled name="email" required />
        <button type="submit">Send</button>
      </form>,
    );

    await expect.element(input()).toBeRequired();
    await userEvent.keyboard("{Tab}{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.keyboard("ada{Enter}");
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  test("forwards its ref and keeps a className", async () => {
    const ref = createRef<HTMLInputElement>();
    await render(<Labelled ref={ref} className="mine" />);

    expect(ref.current).toBe(input().element());
    await expect.element(input()).toHaveClass("nuv-input", "mine");
  });
});

describe("keyboard", () => {
  test("Tab focuses it, and a disabled one is skipped", async () => {
    await render(
      <>
        <Input aria-label="Off" disabled />
        <Labelled />
      </>,
    );

    await userEvent.keyboard("{Tab}");

    await expect.element(input()).toHaveFocus();
    await expect
      .element(page.getByRole("textbox", { name: "Off" }))
      .toBeDisabled();
  });
});

describe("styles", () => {
  test("fills the width it's given, at the mouse height", async () => {
    await render(
      <div style={{ inlineSize: 300 }}>
        <Input aria-label="Email" />
      </div>,
    );
    const box = input().element().getBoundingClientRect();

    expect(box.width).toBe(300);
    expect(box.height).toBe(40);
  });

  test("text is smaller with a mouse than the 16px a touch screen gets", async () => {
    await render(<Labelled />);

    expect(style().fontSize).toBe("14px");
  });

  test("shows a focus ring when it has focus", async () => {
    await render(<Labelled />);

    await userEvent.keyboard("{Tab}");

    expect(style().outlineStyle).toBe("solid");
    expect(style().outlineWidth).toBe("2px");
  });

  test("an invalid one has an edge in the danger color", async () => {
    await render(<Labelled aria-invalid />);
    const probe = document.createElement("span");
    probe.style.color = "var(--color-danger)";
    document.body.append(probe);

    expect(style().borderTopColor).toBe(getComputedStyle(probe).color);
    probe.remove();
  });

  test("a disabled one fades", async () => {
    await render(<Labelled disabled />);

    expect(style().opacity).toBe("0.5");
    expect(style().cursor).toBe("not-allowed");
  });

  test("a read-only one is filled, and one that isn't keeps the surface", async () => {
    await render(
      <>
        <Input aria-label="Plain" />
        <Input aria-label="Fixed" readOnly defaultValue="INV-0042" />
        <Input aria-label="File" type="file" />
      </>,
    );
    const background = (name: string) =>
      getComputedStyle(page.getByLabelText(name).element()).backgroundColor;

    expect(background("Fixed")).not.toBe(background("Plain"));
    // A file input counts as read-only to the browser. It isn't one here.
    expect(background("File")).toBe(background("Plain"));
  });

  test("variables change its look", async () => {
    await render(
      <div
        style={
          {
            "--nuv-input-height": "60px",
            "--nuv-input-radius": "0px",
            "--nuv-input-bg": "rgb(1, 2, 3)",
          } as never
        }
      >
        <Input aria-label="Email" />
      </div>,
    );

    expect(input().element().getBoundingClientRect().height).toBe(60);
    expect(style().borderRadius).toBe("0px");
    expect(style().backgroundColor).toBe("rgb(1, 2, 3)");
  });

  test("follows the direction of the page", async () => {
    await render(
      <div dir="rtl">
        <Input aria-label="Email" defaultValue="abc" />
      </div>,
    );

    expect(style().direction).toBe("rtl");
    expect(style().textAlign).toBe("start");
    expect(style().paddingLeft).toBe(style().paddingRight);
  });

  test("only animates when motion is fine", async () => {
    await render(<Labelled />);

    await emulateMedia({ reducedMotion: "no-preference" });
    expect(style().transitionDuration).not.toBe("0s");

    await emulateMedia({ reducedMotion: "reduce" });
    expect(style().transitionDuration).toBe("0s");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe empty, filled, invalid and disabled", async () => {
    const screen = await renderThemed(
      theme,
      <div style={{ display: "grid", gap: 8 }}>
        <label htmlFor="a">Empty</label>
        <Input id="a" placeholder="Type here" />
        <label htmlFor="b">Filled</label>
        <Input id="b" defaultValue="Ada Lovelace" />
        <label htmlFor="c">Invalid</label>
        <Input id="c" aria-invalid defaultValue="nope" />
        <label htmlFor="d">Disabled</label>
        <Input id="d" disabled defaultValue="Locked" />
        <label htmlFor="e">Read-only</label>
        <Input id="e" readOnly defaultValue="INV-0042" />
      </div>,
    );

    await expectNoViolations(screen.container);
  });

  // axe doesn't measure a placeholder or a control's edge.
  test("the placeholder and the edge can be seen", async () => {
    const screen = await renderThemed(
      theme,
      <Input aria-label="Email" placeholder="you@example.com" />,
    );
    const element = screen.getByRole("textbox").element();
    const field = getComputedStyle(element);
    const pageColor = getComputedStyle(
      screen.container.firstElementChild as Element,
    ).backgroundColor;

    expect(
      contrast(
        getComputedStyle(element, "::placeholder").color,
        field.backgroundColor,
      ),
    ).toBeGreaterThanOrEqual(4.5);
    expect(contrast(field.borderTopColor, pageColor)).toBeGreaterThanOrEqual(3);
  });

  test("an invalid edge can be seen too", async () => {
    const screen = await renderThemed(
      theme,
      <Input aria-label="Email" aria-invalid />,
    );
    const field = getComputedStyle(screen.getByRole("textbox").element());
    const pageColor = getComputedStyle(
      screen.container.firstElementChild as Element,
    ).backgroundColor;

    expect(contrast(field.borderTopColor, pageColor)).toBeGreaterThanOrEqual(3);
  });
});
