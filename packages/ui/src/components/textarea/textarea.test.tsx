import "../../styles/index.scss";
import { type ComponentProps, createRef, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { contrast } from "../../../test/contrast";
import { expectNoViolations, renderThemed, themes } from "../../../test/themed";
import { Textarea } from "./textarea";

function Labelled(props: ComponentProps<typeof Textarea>) {
  return (
    <div style={{ display: "grid", gap: 8, padding: 40 }}>
      <label htmlFor="notes">Notes</label>
      <Textarea id="notes" {...props} />
    </div>
  );
}

const textarea = () => page.getByRole("textbox", { name: "Notes" });
const style = () => getComputedStyle(textarea().element());
const height = () => textarea().element().getBoundingClientRect().height;

const tenLines = Array.from(
  { length: 10 },
  (_, line) => `Line ${line + 1}`,
).join("\n");

describe("rendering", () => {
  test("renders a textarea that can be typed into", async () => {
    await render(<Labelled />);

    await textarea().fill("First line");

    await expect.element(textarea()).toHaveValue("First line");
    expect(textarea().element().tagName).toBe("TEXTAREA");
  });

  test("passes rows and other props through", async () => {
    await render(<Labelled rows={8} placeholder="Anything else?" />);

    await expect.element(textarea()).toHaveAttribute("rows", "8");
    await expect
      .element(textarea())
      .toHaveAttribute("placeholder", "Anything else?");
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
        <Labelled name="notes" defaultValue="Hello" />
        <button type="submit">Send</button>
      </form>,
    );

    await page.getByRole("button", { name: "Send" }).click();

    expect(submitted?.get("notes")).toBe("Hello");
  });

  test("forwards its ref and keeps a className", async () => {
    const ref = createRef<HTMLTextAreaElement>();
    await render(<Labelled ref={ref} className="mine" />);

    expect(ref.current).toBe(textarea().element());
    await expect.element(textarea()).toHaveClass("nuv-textarea", "mine");
  });
});

describe("growing with the text", () => {
  test("stays the height it was without autoResize", async () => {
    await render(<Labelled />);
    const before = height();

    await textarea().fill(tenLines);

    expect(height()).toBe(before);
    await expect.element(textarea()).not.toHaveClass(/auto-resize/);
  });

  test("grows as lines are added and shrinks as they go", async () => {
    await render(<Labelled autoResize />);
    const empty = height();

    await textarea().fill(tenLines);
    await expect.poll(height).toBeGreaterThan(empty + 100);
    // All of it shows, so there's nothing to scroll.
    const element = textarea().element();
    expect(element.scrollHeight).toBeLessThanOrEqual(element.clientHeight + 1);

    await textarea().fill("One line");
    await expect.poll(height).toBe(empty);
  });

  test("can't be dragged taller while it grows by itself", async () => {
    await render(<Labelled autoResize />);

    expect(style().resize).toBe("none");
  });

  test("stops at the height a variable gives it and scrolls from there", async () => {
    await render(
      <Labelled
        autoResize
        style={{ "--nuv-textarea-max-height": "120px" } as never}
      />,
    );

    await textarea().fill(tenLines);

    await expect.poll(height).toBe(120);
    const element = textarea().element();
    expect(element.scrollHeight).toBeGreaterThan(element.clientHeight);
  });

  test("follows a value that's set from outside", async () => {
    function Controlled() {
      const [value, setValue] = useState("");
      return (
        <>
          <Labelled autoResize value={value} onChange={() => {}} />
          <button type="button" onClick={() => setValue(tenLines)}>
            Fill
          </button>
        </>
      );
    }
    await render(<Controlled />);
    const empty = height();

    await page.getByRole("button", { name: "Fill" }).click();

    await expect.poll(height).toBeGreaterThan(empty + 100);
  });

  test("goes back to its first height when the form is reset", async () => {
    await render(
      <form>
        <Labelled autoResize />
        <button type="reset">Reset</button>
      </form>,
    );
    const empty = height();
    await textarea().fill(tenLines);
    await expect.poll(height).toBeGreaterThan(empty + 100);

    await page.getByRole("button", { name: "Reset" }).click();

    await expect.poll(height).toBe(empty);
  });
});

describe("styles", () => {
  test("fills the width it's given and starts 80px tall", async () => {
    await render(
      <div style={{ inlineSize: 300 }}>
        <Textarea aria-label="Notes" />
      </div>,
    );
    const box = textarea().element().getBoundingClientRect();

    expect(box.width).toBe(300);
    expect(box.height).toBe(80);
  });

  test("can only be dragged up and down", async () => {
    await render(<Labelled />);

    expect(style().resize).toBe("vertical");
  });

  test("shows a focus ring when it has focus", async () => {
    await render(<Labelled />);

    await userEvent.keyboard("{Tab}");

    expect(style().outlineStyle).toBe("solid");
  });

  test("an invalid one has a different edge, and a disabled one fades", async () => {
    await render(
      <>
        <Textarea aria-label="Plain" />
        <Textarea aria-label="Wrong" aria-invalid />
        <Textarea aria-label="Off" disabled />
      </>,
    );
    const look = (name: string) =>
      getComputedStyle(page.getByLabelText(name).element());

    expect(look("Wrong").borderTopColor).not.toBe(look("Plain").borderTopColor);
    expect(look("Off").opacity).toBe("0.5");
  });

  test("a variable changes the height it starts at", async () => {
    await render(
      <Labelled style={{ "--nuv-textarea-min-height": "200px" } as never} />,
    );

    expect(height()).toBe(200);
  });

  test("required blocks the form until it's filled in", async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    await render(
      <form onSubmit={onSubmit}>
        <Labelled name="notes" required />
        <button type="submit">Send</button>
      </form>,
    );
    const form = textarea().element().closest("form");

    form?.requestSubmit();
    expect(onSubmit).not.toHaveBeenCalled();

    await textarea().fill("Something");
    form?.requestSubmit();
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe empty, filled, invalid and disabled", async () => {
    const screen = await renderThemed(
      theme,
      <div style={{ display: "grid", gap: 8 }}>
        <label htmlFor="a">Empty</label>
        <Textarea id="a" placeholder="Type here" />
        <label htmlFor="b">Filled</label>
        <Textarea id="b" defaultValue="Some notes" />
        <label htmlFor="c">Invalid</label>
        <Textarea id="c" aria-invalid defaultValue="nope" />
        <label htmlFor="d">Disabled</label>
        <Textarea id="d" disabled defaultValue="Locked" />
      </div>,
    );

    await expectNoViolations(screen.container);
  });

  test("the placeholder and the edge can be seen", async () => {
    const screen = await renderThemed(
      theme,
      <Textarea aria-label="Notes" placeholder="Anything else?" />,
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
});
