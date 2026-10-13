import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { createRef, useState } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { EmojiReaction } from ".";

const style = (element: Element) => getComputedStyle(element);
const rect = (element: Element) => element.getBoundingClientRect();
const button = (name: string | RegExp = /thumbs up/) =>
  page.getByRole("button", { name });
const root = () =>
  document.querySelector(".nuv-emoji-reaction") as HTMLButtonElement;

// What an app does with it: the count is the app's, and goes up and down
// with the reader's own reaction.
function Kept({ others = 2, mine = false }) {
  const [pressed, setPressed] = useState(mine);
  return (
    <EmojiReaction
      emoji="👍"
      label="thumbs up"
      count={others + (pressed ? 1 : 0)}
      pressed={pressed}
      onPressedChange={setPressed}
    />
  );
}

beforeEach(async () => {
  await setViewport("desktop");
});

describe("rendering", () => {
  test("it's a button with the emoji and the count in it", async () => {
    await render(<EmojiReaction emoji="👍" label="thumbs up" count={3} />);

    expect(root().tagName).toBe("BUTTON");
    expect(root().getAttribute("type")).toBe("button");
    expect(
      root().querySelector(".nuv-emoji-reaction__emoji")?.textContent,
    ).toBe("👍");
    expect(
      root().querySelector(".nuv-emoji-reaction__count")?.textContent,
    ).toBe("3");
  });

  test("it's read as the emoji's name and the count, and not as the character", async () => {
    await render(<EmojiReaction emoji="👍" label="thumbs up" count={3} />);

    await expect.element(button("thumbs up, 3")).toBeVisible();
  });

  test("it isn't pressed unless it's said to be", async () => {
    const screen = await render(
      <EmojiReaction emoji="👍" label="thumbs up" count={3} />,
    );
    expect(root().getAttribute("aria-pressed")).toBe("false");
    expect(root().hasAttribute("data-pressed")).toBe(false);

    await screen.rerender(
      <EmojiReaction emoji="👍" label="thumbs up" count={4} pressed />,
    );
    expect(root().getAttribute("aria-pressed")).toBe("true");
    expect(root().hasAttribute("data-pressed")).toBe(true);
  });

  test("children are drawn in place of the count, and the name keeps the number", async () => {
    await render(
      <EmojiReaction emoji="👍" label="thumbs up" count={1200}>
        1.2K
      </EmojiReaction>,
    );

    expect(
      root().querySelector(".nuv-emoji-reaction__count")?.textContent,
    ).toBe("1.2K");
    await expect.element(button("thumbs up, 1200")).toBeVisible();
  });

  test("a name of your own is the one it has", async () => {
    await render(
      <EmojiReaction
        emoji="👍"
        label="thumbs up"
        count={3}
        aria-label="3 mensen: duim omhoog"
      />,
    );

    expect(root().getAttribute("aria-label")).toBe("3 mensen: duim omhoog");
  });

  test("it takes a ref, a class and what a button takes", async () => {
    const ref = createRef<HTMLButtonElement>();
    await render(
      <EmojiReaction
        ref={ref}
        emoji="👍"
        label="thumbs up"
        count={3}
        className="mine"
        data-testid="reaction"
      />,
    );

    expect(ref.current).toBe(root());
    expect(root().classList.contains("mine")).toBe(true);
    expect(root().classList.contains("nuv-emoji-reaction")).toBe(true);
    expect(root().dataset.testid).toBe("reaction");
  });
});

describe("pressing", () => {
  test("a press asks for the other state, and changes nothing by itself", async () => {
    const onPressedChange = vi.fn();
    await render(
      <EmojiReaction
        emoji="👍"
        label="thumbs up"
        count={3}
        onPressedChange={onPressedChange}
      />,
    );

    await button().click();

    expect(onPressedChange).toHaveBeenCalledTimes(1);
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(root().getAttribute("aria-pressed")).toBe("false");
  });

  test("a press on the reader's own asks to take it away", async () => {
    const onPressedChange = vi.fn();
    await render(
      <EmojiReaction
        emoji="👍"
        label="thumbs up"
        count={3}
        pressed
        onPressedChange={onPressedChange}
      />,
    );

    await button().click();

    expect(onPressedChange).toHaveBeenCalledWith(false);
  });

  test("kept by an app, the count goes up with a press and down with the next", async () => {
    await render(<Kept />);

    await button("thumbs up, 2").click();
    await expect
      .element(button("thumbs up, 3"))
      .toHaveAttribute("aria-pressed", "true");

    await button("thumbs up, 3").click();
    await expect
      .element(button("thumbs up, 2"))
      .toHaveAttribute("aria-pressed", "false");
  });

  test("Enter and Space press it", async () => {
    const onPressedChange = vi.fn();
    await render(
      <EmojiReaction
        emoji="👍"
        label="thumbs up"
        count={3}
        onPressedChange={onPressedChange}
      />,
    );
    root().focus();

    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");

    expect(onPressedChange).toHaveBeenCalledTimes(2);
  });

  test("onClick is called first, and can stop the press", async () => {
    const onPressedChange = vi.fn();
    const onClick = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    await render(
      <EmojiReaction
        emoji="👍"
        label="thumbs up"
        count={3}
        onClick={onClick}
        onPressedChange={onPressedChange}
      />,
    );

    await button().click();

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  test("disabled, it can't be pressed and is out of the Tab order", async () => {
    const onPressedChange = vi.fn();
    await render(
      <EmojiReaction
        emoji="👍"
        label="thumbs up"
        count={3}
        disabled
        onPressedChange={onPressedChange}
      />,
    );

    root().click();

    expect(onPressedChange).not.toHaveBeenCalled();
    expect(root().disabled).toBe(true);
    expect(style(root()).pointerEvents).toBe("none");
  });

  test("it doesn't send the form it's in", async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    await render(
      <form onSubmit={onSubmit}>
        <EmojiReaction emoji="👍" label="thumbs up" count={3} />
      </form>,
    );

    await button().click();

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("styles", () => {
  test("with a mouse it's 32 pixels tall, and a pill", async () => {
    await render(<EmojiReaction emoji="👍" label="thumbs up" count={3} />);

    expect(rect(root()).height).toBe(32);
    expect(
      Number.parseFloat(style(root()).borderTopLeftRadius),
    ).toBeGreaterThan(16);
  });

  test("the reader's own has another edge, and a thicker one", async () => {
    const screen = await render(
      <EmojiReaction emoji="👍" label="thumbs up" count={3} />,
    );
    const before = style(root()).borderTopColor;
    expect(style(root()).boxShadow).toBe("none");

    await screen.rerender(
      <EmojiReaction emoji="👍" label="thumbs up" count={4} pressed />,
    );

    await expect.poll(() => style(root()).borderTopColor).not.toBe(before);
    await expect.poll(() => style(root()).boxShadow).toContain("inset");
  });

  test("it's the same width whichever figures the count is in", async () => {
    const screen = await render(
      <EmojiReaction emoji="👍" label="thumbs up" count={11} />,
    );
    const ones = rect(root()).width;

    await screen.rerender(
      <EmojiReaction emoji="👍" label="thumbs up" count={88} />,
    );

    expect(rect(root()).width).toBe(ones);
  });

  test("several in a row that wraps keep their size", async () => {
    await render(
      <div style={{ display: "flex", flexWrap: "wrap", inlineSize: 120 }}>
        <EmojiReaction emoji="👍" label="thumbs up" count={3} />
        <EmojiReaction emoji="🎉" label="party popper" count={12} />
        <EmojiReaction emoji="👏" label="clapping hands" count={104} />
      </div>,
    );
    const all = [...document.querySelectorAll(".nuv-emoji-reaction")];

    for (const one of all) {
      expect(one.scrollWidth).toBeLessThanOrEqual(one.clientWidth);
      expect(rect(one).height).toBe(32);
    }
    expect(rect(all[2] as Element).top).toBeGreaterThan(
      rect(all[0] as Element).top,
    );
  });

  test("component variables change the size and the colors", async () => {
    await render(
      <EmojiReaction
        emoji="👍"
        label="thumbs up"
        count={3}
        pressed
        style={
          {
            "--nuv-emoji-reaction-height": "40px",
            "--nuv-emoji-reaction-padding-inline": "20px",
            "--nuv-emoji-reaction-gap": "10px",
            "--nuv-emoji-reaction-radius": "4px",
            "--nuv-emoji-reaction-fg": "rgb(1, 2, 3)",
            "--nuv-emoji-reaction-pressed-bg": "rgb(10, 20, 30)",
            "--nuv-emoji-reaction-pressed-border": "rgb(40, 50, 60)",
            "--nuv-emoji-reaction-emoji-size": "24px",
          } as never
        }
      />,
    );

    expect(rect(root()).height).toBe(40);
    expect(style(root()).paddingLeft).toBe("20px");
    expect(style(root()).columnGap).toBe("10px");
    expect(style(root()).borderTopLeftRadius).toBe("4px");
    expect(style(root()).color).toBe("rgb(1, 2, 3)");
    await expect
      .poll(() => style(root()).backgroundColor)
      .toBe("rgb(10, 20, 30)");
    await expect
      .poll(() => style(root()).borderTopColor)
      .toBe("rgb(40, 50, 60)");
    expect(
      style(root().querySelector(".nuv-emoji-reaction__emoji") as Element)
        .fontSize,
    ).toBe("24px");
  });

  test("the keys draw a ring on it, and a press with the pointer doesn't", async () => {
    await render(
      <>
        <EmojiReaction emoji="🎉" label="party popper" count={1} />
        <EmojiReaction emoji="👍" label="thumbs up" count={3} />
      </>,
    );
    (document.querySelector(".nuv-emoji-reaction") as HTMLElement).focus();
    await userEvent.keyboard("{Tab}");

    const second = button().element();
    expect(document.activeElement).toBe(second);
    expect(style(second).outlineStyle).toBe("solid");
  });
});

describe("forced colors", () => {
  test("the reader's own has a thicker border, which a shadow can't give it there", async () => {
    await emulateMedia({ forcedColors: "active" });
    await render(
      <>
        <EmojiReaction emoji="🎉" label="party popper" count={1} />
        <EmojiReaction emoji="👍" label="thumbs up" count={3} pressed />
      </>,
    );
    const [other, mine] = [
      ...document.querySelectorAll(".nuv-emoji-reaction"),
    ] as [Element, Element];

    expect(Number.parseFloat(style(mine).borderTopWidth)).toBeGreaterThan(
      Number.parseFloat(style(other).borderTopWidth),
    );
    await emulateMedia({ forcedColors: "none" });
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe pressed, not pressed and disabled", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const { container } = await renderThemed(
      theme,
      <div style={{ display: "flex", gap: 8 }}>
        <EmojiReaction emoji="🎉" label="party popper" count={5} pressed />
        <EmojiReaction emoji="👏" label="clapping hands" count={2} />
        <EmojiReaction emoji="👍" label="thumbs up" count={1} disabled />
      </div>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
