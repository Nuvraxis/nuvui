import "../../styles/index.scss";
import { type ComponentProps, createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { contrast } from "../../../test/contrast";
import { expectNoViolations, renderThemed, themes } from "../../../test/themed";
import { PasswordInput } from "./password-input";

function Labelled(props: ComponentProps<typeof PasswordInput>) {
  return (
    <div style={{ display: "grid", gap: 8, padding: 40 }}>
      <label htmlFor="password">Password</label>
      <PasswordInput id="password" {...props} />
    </div>
  );
}

// A password field has no role to look it up by.
const input = () => page.getByLabelText("Password", { exact: true });
const toggle = () => page.getByRole("button");
const group = () => input().element().parentElement as HTMLElement;
const style = (element: Element) => getComputedStyle(element);

describe("rendering", () => {
  test("hides what's typed until the button is pressed", async () => {
    await render(<Labelled />);
    await input().fill("hunter2");

    await expect.element(input()).toHaveAttribute("type", "password");
    await expect.element(toggle()).toHaveAccessibleName("Show password");

    await toggle().click();
    await expect.element(input()).toHaveAttribute("type", "text");
    await expect.element(toggle()).toHaveAccessibleName("Hide password");
    await expect.element(input()).toHaveValue("hunter2");

    await toggle().click();
    await expect.element(input()).toHaveAttribute("type", "password");
  });

  test("the button says which input it controls, and has an id of its own", async () => {
    await render(<Labelled />);

    await expect.element(toggle()).toHaveAttribute("aria-controls", "password");
    expect(toggle().element().id).not.toBe("password");
    expect(document.querySelectorAll("#password")).toHaveLength(1);
  });

  test("can start out readable", async () => {
    await render(<Labelled defaultVisible />);

    await expect.element(input()).toHaveAttribute("type", "text");
  });

  test("can be controlled", async () => {
    const onVisibilityChange = vi.fn();
    await render(
      <Labelled visible={false} onVisibilityChange={onVisibilityChange} />,
    );

    await toggle().click();

    expect(onVisibilityChange).toHaveBeenCalledWith(true);
    await expect.element(input()).toHaveAttribute("type", "password");
  });

  test("the button's names can be replaced", async () => {
    await render(
      <Labelled showLabel="Passwort anzeigen" hideLabel="Passwort verbergen" />,
    );

    await expect.element(toggle()).toHaveAccessibleName("Passwort anzeigen");
    await toggle().click();
    await expect.element(toggle()).toHaveAccessibleName("Passwort verbergen");
  });

  test("tells password managers which password it is", async () => {
    const screen = await render(<Labelled />);
    await expect
      .element(input())
      .toHaveAttribute("autocomplete", "current-password");

    await screen.rerender(<Labelled autoComplete="new-password" />);
    await expect
      .element(input())
      .toHaveAttribute("autocomplete", "new-password");
  });

  test("the class name goes on the box, and the rest on the input", async () => {
    const ref = createRef<HTMLInputElement>();
    await render(<Labelled ref={ref} className="mine" data-test="x" />);

    expect(ref.current).toBe(input().element());
    expect(group().className).toBe("nuv-password-input mine");
    await expect.element(input()).toHaveAttribute("data-test", "x");
  });

  test("submits with a form, and hides the password again when it does", async () => {
    let submitted: FormData | undefined;
    await render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = new FormData(event.currentTarget);
        }}
      >
        <Labelled name="password" />
        <button type="submit">Sign in</button>
      </form>,
    );
    await input().fill("hunter2");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect.element(input()).toHaveAttribute("type", "text");

    await page.getByRole("button", { name: "Sign in" }).click();

    expect(submitted?.get("password")).toBe("hunter2");
    await expect.element(input()).toHaveAttribute("type", "password");
  });

  test("a disabled one takes its button with it", async () => {
    await render(<Labelled disabled />);

    await expect.element(input()).toBeDisabled();
    await expect.element(toggle()).toBeDisabled();
    expect(style(group()).opacity).toBe("0.5");
  });
});

describe("keyboard", () => {
  test("Tab goes to the input and then the button, which Space presses", async () => {
    await render(<Labelled />);

    await userEvent.keyboard("{Tab}");
    await expect.element(input()).toHaveFocus();
    await userEvent.keyboard("{Tab}");
    await expect.element(toggle()).toHaveFocus();

    await userEvent.keyboard(" ");
    await expect.element(input()).toHaveAttribute("type", "text");
    // Pressed from the keyboard, focus stays on the button.
    await expect.element(toggle()).toHaveFocus();
  });

  test("a click on the button puts the cursor back in the input", async () => {
    await render(<Labelled />);
    await input().fill("hunter2");

    await toggle().click();

    await expect.element(input()).toHaveFocus();
  });
});

describe("styles", () => {
  test("is one box at the mouse height, with the button inside", async () => {
    await render(
      <div style={{ inlineSize: 300 }}>
        <PasswordInput aria-label="Password" />
      </div>,
    );
    const box = group().getBoundingClientRect();
    const button = toggle().element().getBoundingClientRect();

    expect(box.width).toBe(300);
    expect(box.height).toBe(40);
    expect(button.height).toBe(32);
    expect(button.right).toBeLessThan(box.right);
    expect(style(input().element()).borderTopWidth).toBe("0px");
  });

  test("the ring goes around the box while the input has focus", async () => {
    await render(<Labelled />);

    await userEvent.keyboard("{Tab}");
    expect(style(group()).outlineStyle).toBe("solid");

    await userEvent.keyboard("{Tab}");
    expect(style(group()).outlineStyle).toBe("none");
    expect(style(toggle().element()).outlineStyle).toBe("solid");
  });

  test("an invalid one has a different edge", async () => {
    const screen = await render(
      <>
        <PasswordInput aria-label="Plain" />
        <PasswordInput aria-label="Wrong" aria-invalid />
      </>,
    );
    const [plain, wrong] = [
      ...screen.container.querySelectorAll(".nuv-password-input"),
    ] as [Element, Element];

    expect(style(wrong).borderTopColor).not.toBe(style(plain).borderTopColor);
  });

  test("the button is at the other end in a right-to-left layout", async () => {
    await render(
      <div dir="rtl">
        <Labelled />
      </div>,
    );

    expect(toggle().element().getBoundingClientRect().right).toBeLessThan(
      input().element().getBoundingClientRect().left + 1,
    );
  });

  test("variables change its look", async () => {
    await render(
      <div
        style={
          {
            "--nuv-password-input-height": "60px",
            "--nuv-password-input-radius": "0px",
          } as never
        }
      >
        <PasswordInput aria-label="Password" />
      </div>,
    );

    expect(group().getBoundingClientRect().height).toBe(60);
    expect(style(group()).borderRadius).toBe("0px");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe hidden, shown, invalid and disabled", async () => {
    const screen = await renderThemed(
      theme,
      <div style={{ display: "grid", gap: 8 }}>
        <label htmlFor="a">Hidden</label>
        <PasswordInput id="a" defaultValue="hunter2" />
        <label htmlFor="b">Shown</label>
        <PasswordInput id="b" defaultVisible defaultValue="hunter2" />
        <label htmlFor="c">Invalid</label>
        <PasswordInput id="c" aria-invalid placeholder="At least 12" />
        <label htmlFor="d">Disabled</label>
        <PasswordInput id="d" disabled />
      </div>,
    );
    // Radix keeps the button out of reach until the page has hydrated.
    await expect
      .poll(() => screen.container.querySelector("button[aria-hidden]"))
      .toBeNull();

    await expectNoViolations(screen.container);
  });

  test("the edge and the eye can be seen", async () => {
    const screen = await renderThemed(
      theme,
      <PasswordInput aria-label="Password" />,
    );
    const pageColor = style(
      screen.container.firstElementChild as Element,
    ).backgroundColor;

    expect(
      contrast(style(group()).borderTopColor, pageColor),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrast(style(toggle().element()).color, style(group()).backgroundColor),
    ).toBeGreaterThanOrEqual(3);
  });
});
