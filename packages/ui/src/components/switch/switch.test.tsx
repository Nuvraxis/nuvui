import "../../styles/index.scss";
import { type ComponentProps, createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { emulateMedia } from "../../../test/media";
import { expectNoViolations, renderThemed, themes } from "../../../test/themed";
import { Switch } from "./switch";

// ComponentProps and not SwitchProps, so the helper can take a ref too.
function Labelled({
  dir,
  ...props
}: ComponentProps<typeof Switch> & { dir?: "ltr" | "rtl" }) {
  return (
    <div
      dir={dir}
      style={{ display: "flex", gap: 8, alignItems: "center", padding: 40 }}
    >
      <Switch id="updates" {...props} />
      <label htmlFor="updates">Email me updates</label>
    </div>
  );
}

const control = () => page.getByRole("switch", { name: "Email me updates" });
const thumbX = () =>
  (
    control().element().querySelector(".nuv-switch__thumb") as Element
  ).getBoundingClientRect().x;

describe("rendering", () => {
  test("starts off and toggles on click", async () => {
    await render(<Labelled />);

    await expect.element(control()).toHaveAttribute("aria-checked", "false");
    await control().click();
    await expect.element(control()).toHaveAttribute("aria-checked", "true");
  });

  test("a click on the label toggles it", async () => {
    await render(<Labelled />);

    await page.getByText("Email me updates").click();

    await expect.element(control()).toBeChecked();
  });

  test("can be controlled", async () => {
    const onCheckedChange = vi.fn();
    await render(
      <Labelled checked={false} onCheckedChange={onCheckedChange} />,
    );

    await control().click();

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    await expect.element(control()).not.toBeChecked();
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
        <Labelled name="updates" defaultChecked />
        <button type="submit">Send</button>
      </form>,
    );

    await page.getByRole("button", { name: "Send" }).click();

    expect(submitted?.get("updates")).toBe("on");
  });

  test("required blocks the form until it's on", async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    await render(
      <form onSubmit={onSubmit}>
        <Labelled name="updates" required />
        <button type="submit">Send</button>
      </form>,
    );
    const send = page.getByRole("button", { name: "Send" });

    // toBeRequired doesn't know the switch role, so read the attribute.
    await expect.element(control()).toHaveAttribute("aria-required", "true");
    await send.click();
    expect(onSubmit).not.toHaveBeenCalled();

    await control().click();
    await send.click();
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  test("forwards its ref and keeps a className", async () => {
    const ref = createRef<HTMLButtonElement>();
    await render(<Labelled ref={ref} className="mine" />);

    expect(ref.current).toBe(control().element());
    await expect.element(control()).toHaveClass("nuv-switch", "mine");
  });
});

describe("keyboard", () => {
  test("Tab focuses it, Space and Enter toggle it", async () => {
    await render(<Labelled />);

    await userEvent.keyboard("{Tab}");
    await expect.element(control()).toHaveFocus();

    await userEvent.keyboard(" ");
    await expect.element(control()).toBeChecked();
    await userEvent.keyboard("{Enter}");
    await expect.element(control()).not.toBeChecked();
  });

  test("a disabled switch is skipped", async () => {
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
  });
});

describe("styles", () => {
  test("the thumb moves to the end when on", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Labelled />);
    const off = thumbX();

    await control().click();

    // 36px track, 20px tall, so the 16px thumb travels 16px.
    expect(thumbX() - off).toBe(16);
  });

  test("the thumb moves the other way in a right-to-left layout", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Labelled dir="rtl" />);
    const off = thumbX();

    await control().click();

    expect(thumbX() - off).toBe(-16);
  });

  test("is smaller with a mouse", async () => {
    await render(<Labelled />);

    const rect = control().element().getBoundingClientRect();

    expect(rect.width).toBe(36);
    expect(rect.height).toBe(20);
  });

  test("shows a focus ring for keyboard focus", async () => {
    await render(<Labelled />);

    await userEvent.keyboard("{Tab}");

    expect(getComputedStyle(control().element()).outlineStyle).toBe("solid");
  });

  test("the thumb only animates when motion is fine", async () => {
    await render(<Labelled />);
    const thumb = control().element().querySelector(".nuv-switch__thumb");
    const style = getComputedStyle(thumb as Element);

    await emulateMedia({ reducedMotion: "no-preference" });
    expect(style.transitionDuration).not.toBe("0s");
    await emulateMedia({ reducedMotion: "reduce" });
    expect(style.transitionDuration).toBe("0s");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe off, on and disabled", async () => {
    const screen = await renderThemed(
      theme,
      <>
        <div>
          <Switch id="a" /> <label htmlFor="a">Off</label>
        </div>
        <div>
          <Switch id="b" defaultChecked /> <label htmlFor="b">On</label>
        </div>
        <div>
          <Switch id="c" disabled /> <label htmlFor="c">Disabled</label>
        </div>
      </>,
    );

    await expectNoViolations(screen.container);
  });
});
