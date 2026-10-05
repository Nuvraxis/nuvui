import "../../styles/index.scss";
import { type ComponentProps, createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { emulateTouch } from "../../../test/media";
import {
  expectNoViolations,
  hitAt,
  renderThemed,
  themes,
} from "../../../test/themed";
import { Checkbox } from "./checkbox";

// ComponentProps and not CheckboxProps, so the helper can take a ref too.
function Labelled(props: ComponentProps<typeof Checkbox>) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: 40 }}>
      <Checkbox id="terms" {...props} />
      <label htmlFor="terms">Accept the terms</label>
    </div>
  );
}

const checkbox = () => page.getByRole("checkbox", { name: "Accept the terms" });

describe("rendering", () => {
  test("starts unchecked and toggles on click", async () => {
    await render(<Labelled />);

    await expect.element(checkbox()).not.toBeChecked();
    await checkbox().click();
    await expect.element(checkbox()).toBeChecked();
    await checkbox().click();
    await expect.element(checkbox()).not.toBeChecked();
  });

  test("a click on the label toggles it", async () => {
    await render(<Labelled />);

    await page.getByText("Accept the terms").click();

    await expect.element(checkbox()).toBeChecked();
  });

  test("shows a dash and reports mixed when indeterminate", async () => {
    await render(<Labelled checked="indeterminate" />);
    const element = checkbox().element();

    await expect.element(checkbox()).toHaveAttribute("aria-checked", "mixed");
    const display = (part: string) =>
      getComputedStyle(
        element.querySelector(`.nuv-checkbox__${part}`) as Element,
      ).display;
    expect(display("dash")).not.toBe("none");
    expect(display("check")).toBe("none");
  });

  test("can be controlled", async () => {
    const onCheckedChange = vi.fn();
    await render(
      <Labelled checked={false} onCheckedChange={onCheckedChange} />,
    );

    await checkbox().click();

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    await expect.element(checkbox()).not.toBeChecked();
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
        <Labelled name="terms" defaultChecked />
        <button type="submit">Send</button>
      </form>,
    );

    await page.getByRole("button", { name: "Send" }).click();

    expect(submitted?.get("terms")).toBe("on");
  });

  test("required blocks the form until it's checked", async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    await render(
      <form onSubmit={onSubmit}>
        <Labelled name="terms" required />
        <button type="submit">Send</button>
      </form>,
    );
    const send = page.getByRole("button", { name: "Send" });

    await expect.element(checkbox()).toBeRequired();
    await send.click();
    expect(onSubmit).not.toHaveBeenCalled();

    await checkbox().click();
    await send.click();
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  test("a form reset puts it back to how it started", async () => {
    await render(
      <form>
        <Labelled name="terms" />
        <button type="reset">Reset</button>
      </form>,
    );

    await checkbox().click();
    await expect.element(checkbox()).toBeChecked();
    await page.getByRole("button", { name: "Reset" }).click();

    await expect.element(checkbox()).not.toBeChecked();
  });

  test("forwards its ref and keeps a className", async () => {
    const ref = createRef<HTMLButtonElement>();
    await render(<Labelled ref={ref} className="mine" />);

    expect(ref.current).toBe(checkbox().element());
    await expect.element(checkbox()).toHaveClass("nuv-checkbox", "mine");
  });
});

describe("keyboard", () => {
  test("Tab focuses it and Space toggles it", async () => {
    await render(<Labelled />);

    await userEvent.keyboard("{Tab}");
    await expect.element(checkbox()).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect.element(checkbox()).toBeChecked();
  });

  test("Enter does nothing, as on a native checkbox", async () => {
    await render(<Labelled />);

    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");

    await expect.element(checkbox()).not.toBeChecked();
  });

  test("a disabled checkbox is skipped and can't be toggled", async () => {
    await render(
      <>
        <Labelled disabled />
        <button type="button">Next</button>
      </>,
    );

    await userEvent.keyboard("{Tab}");

    await expect
      .element(page.getByRole("button", { name: "Next" }))
      .toHaveFocus();
    await expect.element(checkbox()).toBeDisabled();
  });
});

describe("styles", () => {
  test("shows a focus ring for keyboard focus", async () => {
    await render(<Labelled />);

    await userEvent.keyboard("{Tab}");

    expect(getComputedStyle(checkbox().element()).outlineStyle).toBe("solid");
  });

  test("fills with the primary color when checked", async () => {
    await render(<Labelled />);
    const style = getComputedStyle(checkbox().element());
    const before = style.backgroundColor;

    await checkbox().click();

    await expect.poll(() => style.backgroundColor).not.toBe(before);
  });

  test("a tap just outside the box still lands on it on a touch screen", async () => {
    await emulateTouch(true);
    await render(<Labelled />);
    const element = checkbox().element();

    // The box is 20px. 18px up from its center is outside the box and
    // inside a 44px target.
    expect(element.getBoundingClientRect().width).toBe(20);
    expect(hitAt(element, 0, -18)).toBe(element);
  });

  test("the tap area doesn't reach past the box with a mouse", async () => {
    await render(<Labelled />);
    const element = checkbox().element();

    expect(hitAt(element, 0, -18)).not.toBe(element);
  });

  test("a variable changes the size", async () => {
    await render(
      <Labelled style={{ "--nuv-checkbox-size": "32px" } as never} />,
    );

    expect(checkbox().element().getBoundingClientRect().width).toBe(32);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe unchecked, checked and disabled", async () => {
    const screen = await renderThemed(
      theme,
      <>
        <div>
          <Checkbox id="a" /> <label htmlFor="a">Unchecked</label>
        </div>
        <div>
          <Checkbox id="b" defaultChecked /> <label htmlFor="b">Checked</label>
        </div>
        <div>
          <Checkbox id="c" checked="indeterminate" />{" "}
          <label htmlFor="c">Some</label>
        </div>
        <div>
          <Checkbox id="d" disabled /> <label htmlFor="d">Disabled</label>
        </div>
      </>,
    );

    await expectNoViolations(screen.container);
  });
});
