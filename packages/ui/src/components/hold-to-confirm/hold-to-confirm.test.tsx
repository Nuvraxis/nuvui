import "../../styles/index.scss";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { HoldToConfirm, type HoldToConfirmProps } from "./hold-to-confirm";

// Short enough to wait out, long enough to let go of in time.
const duration = 300;

function Delete(props: Partial<HoldToConfirmProps>) {
  return (
    <HoldToConfirm onConfirm={() => {}} duration={duration} {...props}>
      Hold to delete
    </HoldToConfirm>
  );
}

const button = () =>
  page.getByRole("button", { name: "Hold to delete" }).element() as HTMLElement;
const status = () => page.getByRole("status").element();
const progress = () =>
  button().querySelector(".nuv-hold-to-confirm__progress") as HTMLElement;
const state = () => button().dataset.state;
const style = (element: Element) => getComputedStyle(element);
const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

// What a mouse, a finger or a pen sends. React takes an event that a
// script sends a moment after it's sent, so what follows waits for it.
const pointer = (type: string, init: PointerEventInit = {}) =>
  button().dispatchEvent(
    new PointerEvent(type, { bubbles: true, button: 0, ...init }),
  );
// The click a browser sends after a press. `detail` is how many presses
// it counted, which is none when nothing was pressed.
const click = (detail: number) =>
  button().dispatchEvent(new MouseEvent("click", { bubbles: true, detail }));

describe("rendering", () => {
  test("is a danger button with its text, and says how to use it", async () => {
    await render(<Delete />);

    expect(button().tagName).toBe("BUTTON");
    expect(button().getAttribute("type")).toBe("button");
    expect(button().className).toBe(
      "nuv-button nuv-button--danger nuv-button--md nuv-hold-to-confirm",
    );
    expect(state()).toBe("idle");
    await expect
      .element(page.getByRole("button", { name: "Hold to delete" }))
      .toHaveAccessibleDescription("Hold down to confirm.");
    expect(status().textContent).toBe("");
  });

  test("the bar is hidden from screen readers, and is under the text, not behind it", async () => {
    await render(<Delete />);
    const label = button().querySelector(
      ".nuv-hold-to-confirm__label",
    ) as Element;
    const bar = progress().getBoundingClientRect();
    const box = button().getBoundingClientRect();

    expect(progress().getAttribute("aria-hidden")).toBe("true");
    expect(label.textContent).toBe("Hold to delete");
    expect(style(progress()).pointerEvents).toBe("none");
    // Along the bottom edge, the whole width of the button.
    expect(bar.height).toBe(4);
    expect(bar.top).toBeGreaterThanOrEqual(
      label.getBoundingClientRect().bottom,
    );
    expect(bar.bottom).toBeLessThanOrEqual(box.bottom);
    expect(bar.width).toBeGreaterThan(box.width - 4);
  });

  test("takes a button's props, and keeps a description of your own", async () => {
    const ref = createRef<HTMLButtonElement>();
    await render(
      <>
        <HoldToConfirm
          ref={ref}
          onConfirm={() => {}}
          intent="secondary"
          size="lg"
          className="mine"
          id="delete"
          aria-describedby="more"
        >
          Hold to delete
        </HoldToConfirm>
        <p id="more">This can't be undone.</p>
      </>,
    );

    expect(ref.current).toBe(button());
    expect(button().id).toBe("delete");
    expect(button().className).toBe(
      "nuv-button nuv-button--secondary nuv-button--lg nuv-hold-to-confirm mine",
    );
    await expect
      .element(page.getByRole("button", { name: "Hold to delete" }))
      .toHaveAccessibleDescription(
        "This can't be undone. Hold down to confirm.",
      );
  });
});

describe("holding with a pointer", () => {
  test("held for the whole time, it confirms once", async () => {
    const onConfirm = vi.fn();
    await render(<Delete onConfirm={onConfirm} />);

    pointer("pointerdown");
    await expect.poll(state).toBe("holding");
    expect(onConfirm).not.toHaveBeenCalled();

    await expect.poll(() => onConfirm.mock.calls.length).toBe(1);
    await expect.poll(state).toBe("idle");

    // Letting go afterwards, and the click that comes with it, do nothing
    // more.
    pointer("pointerup");
    click(1);
    await wait(50);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(state()).toBe("idle");
  });

  test("let go of too soon, it does nothing and says how it works", async () => {
    const onConfirm = vi.fn();
    await render(<Delete onConfirm={onConfirm} />);

    pointer("pointerdown");
    await expect.poll(state).toBe("holding");
    pointer("pointerup");
    click(1);
    await expect.poll(state).toBe("idle");
    await expect.poll(() => status().textContent).toBe("Hold down to confirm.");

    await wait(duration + 100);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test.each(["pointerleave", "pointercancel"])(
    "%s ends the hold",
    async (type) => {
      const onConfirm = vi.fn();
      await render(<Delete onConfirm={onConfirm} />);

      pointer("pointerdown");
      await expect.poll(state).toBe("holding");
      // React listens for the pointer leaving as the pointer going out.
      pointer(type === "pointerleave" ? "pointerout" : type, { buttons: 1 });
      await expect.poll(state).toBe("idle");

      await wait(duration + 100);
      expect(onConfirm).not.toHaveBeenCalled();
    },
  );

  test("a press that isn't the main button does nothing", async () => {
    await render(<Delete />);

    pointer("pointerdown", { button: 2 });
    await wait(50);

    expect(state()).toBe("idle");
  });

  test("a second hold starts from the beginning", async () => {
    const onConfirm = vi.fn();
    await render(<Delete onConfirm={onConfirm} />);

    pointer("pointerdown");
    await wait(duration / 2);
    pointer("pointerup");
    click(1);
    await expect.poll(state).toBe("idle");

    pointer("pointerdown");
    await expect.poll(state).toBe("holding");
    // The first hold's time doesn't count towards this one.
    await wait(duration / 2);
    expect(onConfirm).not.toHaveBeenCalled();
    await expect.poll(() => onConfirm.mock.calls.length).toBe(1);
  });

  test("handlers of your own still run", async () => {
    const onPointerDown = vi.fn();
    const onClick = vi.fn();
    await render(<Delete onPointerDown={onPointerDown} onClick={onClick} />);

    pointer("pointerdown");
    pointer("pointerup");
    click(1);

    await expect.poll(() => onPointerDown.mock.calls.length).toBe(1);
    await expect.poll(() => onClick.mock.calls.length).toBe(1);
  });
});

describe("holding a key", () => {
  test.each(["Enter", "Space"])("%s held down confirms", async (key) => {
    const onConfirm = vi.fn();
    await render(<Delete onConfirm={onConfirm} />);
    button().focus();

    await userEvent.keyboard(`{${key}>}`);
    await expect.poll(state).toBe("holding");
    await expect.poll(() => onConfirm.mock.calls.length).toBe(1);
    await userEvent.keyboard(`{/${key}}`);

    await wait(50);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(state()).toBe("idle");
  });

  test.each(["Enter", "Space"])(
    "%s let go of too soon does nothing, and isn't the first of two presses",
    async (key) => {
      const onConfirm = vi.fn();
      await render(<Delete onConfirm={onConfirm} />);
      button().focus();

      await userEvent.keyboard(`{${key}>}`);
      await expect.poll(state).toBe("holding");
      await userEvent.keyboard(`{/${key}}`);

      await expect.poll(state).toBe("idle");
      await expect
        .poll(() => status().textContent)
        .toBe("Hold down to confirm.");
      await wait(duration + 100);
      expect(onConfirm).not.toHaveBeenCalled();
    },
  );

  test("another key does nothing", async () => {
    await render(<Delete />);
    button().focus();

    await userEvent.keyboard("{a>}");
    await wait(50);
    expect(state()).toBe("idle");
    await userEvent.keyboard("{/a}");
  });

  test("moving focus away ends the hold", async () => {
    const onConfirm = vi.fn();
    await render(
      <>
        <Delete onConfirm={onConfirm} />
        <button type="button">Next</button>
      </>,
    );
    button().focus();

    await userEvent.keyboard("{Enter>}");
    await expect.poll(state).toBe("holding");
    page.getByRole("button", { name: "Next" }).element().focus();
    await expect.poll(state).toBe("idle");
    await userEvent.keyboard("{/Enter}");

    await wait(duration + 100);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe("a press that can't be held", () => {
  test("the first press asks for a second, and the second confirms", async () => {
    const onConfirm = vi.fn();
    await render(<Delete onConfirm={onConfirm} />);

    // A screen reader's press: a click with no pointer and no key.
    click(0);
    await expect.poll(state).toBe("armed");
    expect(status().textContent).toBe("Press again to confirm.");
    expect(onConfirm).not.toHaveBeenCalled();

    click(0);
    await expect.poll(() => onConfirm.mock.calls.length).toBe(1);
    await expect.poll(state).toBe("idle");
    expect(status().textContent).toBe("");
  });

  test("a press that says it counted one, with no pointer before it, is taken the same way", async () => {
    await render(<Delete />);

    click(1);

    await expect.poll(state).toBe("armed");
  });

  test("holding after the first press starts a hold", async () => {
    const onConfirm = vi.fn();
    await render(<Delete onConfirm={onConfirm} />);

    click(0);
    await expect.poll(state).toBe("armed");
    pointer("pointerdown");
    await expect.poll(state).toBe("holding");
    await expect.poll(() => onConfirm.mock.calls.length).toBe(1);
  });
});

describe("the words", () => {
  test("can be translated", async () => {
    await render(
      <Delete
        hint="Zum Bestätigen gedrückt halten."
        againLabel="Zum Bestätigen erneut drücken."
      />,
    );

    await expect
      .element(page.getByRole("button", { name: "Hold to delete" }))
      .toHaveAccessibleDescription("Zum Bestätigen gedrückt halten.");
    click(0);
    await expect
      .poll(() => status().textContent)
      .toBe("Zum Bestätigen erneut drücken.");
  });
});

describe("disabled", () => {
  test("can't be held or pressed", async () => {
    const onConfirm = vi.fn();
    await render(<Delete disabled onConfirm={onConfirm} />);

    expect((button() as HTMLButtonElement).disabled).toBe(true);
    expect(style(button()).pointerEvents).toBe("none");
    // A disabled button gets no click from the browser.
    (button() as HTMLButtonElement).click();
    await wait(50);
    expect(state()).toBe("idle");
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe("styles", () => {
  test("the bar is covered at rest, and uncovered over the time it's held for", async () => {
    await render(<Delete duration={2000} />);
    // Browsers write the same shape out in slightly different words.
    expect(style(progress()).clipPath).toMatch(
      /^inset\(0(px)? 100% 0(px)? 0(px)?\)$/,
    );

    pointer("pointerdown");
    await expect.poll(state).toBe("holding");

    expect(style(progress()).transitionDuration).toBe("2s");
    expect(style(progress()).transitionTimingFunction).toBe("linear");
    expect(progress().style.transitionDuration).toBe("2000ms");
    pointer("pointerup");
    await expect.poll(() => progress().style.transitionDuration).toBe("");
  });

  test("it's uncovered from the right where text is read from the right", async () => {
    await render(
      <div dir="rtl">
        <Delete />
      </div>,
    );

    expect(style(progress()).clipPath).toMatch(
      /^inset\(0(px)? 0(px)? 0(px)? 100%\)$/,
    );
  });

  test("it's the color of the button's text, whatever the intent", async () => {
    const screen = await render(<Delete />);
    expect(style(progress()).backgroundColor).toBe(style(button()).color);

    await screen.rerender(<Delete intent="secondary" />);
    expect(style(progress()).backgroundColor).toBe(style(button()).color);
  });

  test("a finger held on it doesn't scroll the page", async () => {
    await render(<Delete />);

    expect(style(button()).touchAction).toBe("none");
  });

  test("component variables change the bar", async () => {
    await render(
      <div
        style={
          {
            "--nuv-hold-to-confirm-progress": "rgb(10, 20, 30)",
            "--nuv-hold-to-confirm-progress-size": "7px",
          } as never
        }
      >
        <Delete />
      </div>,
    );

    expect(style(progress()).backgroundColor).toBe("rgb(10, 20, 30)");
    expect(progress().getBoundingClientRect().height).toBe(7);
  });

  test("what's said to a screen reader is drawn for nobody", async () => {
    await render(<Delete />);

    expect(status().getBoundingClientRect().width).toBeLessThanOrEqual(1);
    expect(style(status()).position).toBe("absolute");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, at rest, waiting for a second press, and disabled", async () => {
    const screen = await renderThemed(
      theme,
      <>
        <Delete />
        <HoldToConfirm onConfirm={() => {}} intent="secondary">
          Hold to archive
        </HoldToConfirm>
        <HoldToConfirm onConfirm={() => {}} disabled>
          Hold to remove
        </HoldToConfirm>
      </>,
    );
    click(0);
    // The bar is full here, which is when it's most in the way if it's in
    // the way at all.
    await expect.poll(state).toBe("armed");

    await expectNoViolations(screen.container);
  });
});
