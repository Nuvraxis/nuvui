import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { setPageTheme, themes } from "@nuvui/tooling/test/themed";
import {
  type ComponentProps,
  type CSSProperties,
  createRef,
  useState,
} from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  type PopoverProps,
  PopoverTrigger,
} from "./popover";

function Example({
  content,
  wrapper = { padding: 80 },
  ...props
}: PopoverProps & {
  // ComponentProps and not PopoverContentProps, so a test can pass a ref.
  content?: ComponentProps<typeof PopoverContent>;
  wrapper?: CSSProperties;
}) {
  return (
    <div style={wrapper}>
      <Popover {...props}>
        <PopoverTrigger asChild>
          <Button intent="secondary">Share</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Share this page" {...content}>
          <p style={{ margin: 0 }}>Anyone with the link can view.</p>
          <Button size="sm" intent="secondary">
            Copy link
          </Button>
          <PopoverClose asChild>
            <Button size="sm">Done</Button>
          </PopoverClose>
        </PopoverContent>
      </Popover>
      <Button intent="ghost">After</Button>
    </div>
  );
}

const trigger = () => page.getByRole("button", { name: "Share" });
const popover = () => page.getByRole("dialog", { name: "Share this page" });
const rect = (element: Element) => element.getBoundingClientRect();

// The animation scales the panel, which would make measurements depend on
// timing.
async function openStill(node: React.ReactNode) {
  await emulateMedia({ reducedMotion: "reduce" });
  await render(node);
  await expect.element(popover()).toBeVisible();
  return popover().element();
}

describe("rendering", () => {
  test("is closed until the trigger is pressed", async () => {
    await render(<Example />);

    await expect.element(popover()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveAttribute("aria-haspopup", "dialog");
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "false");

    await trigger().click();

    await expect.element(popover()).toBeVisible();
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "true");
    await expect
      .element(trigger())
      .toHaveAttribute("aria-controls", popover().element().id);
  });

  test("renders at the end of body, outside the component tree", async () => {
    const screen = await render(<Example defaultOpen />);

    await expect.element(popover()).toBeVisible();
    expect(screen.container.contains(popover().element())).toBe(false);
    // Radix wraps the panel in the element it positions.
    expect(popover().element().parentElement?.parentElement).toBe(
      document.body,
    );
  });

  test("renders into a container when given one", async () => {
    function InSection() {
      const [section, setSection] = useState<HTMLElement | null>(null);
      return (
        <section ref={setSection} data-theme="dark" data-testid="section">
          <Example defaultOpen content={{ container: section }} />
        </section>
      );
    }
    await render(<InSection />);

    await expect.element(popover()).toBeVisible();
    expect(
      page.getByTestId("section").element().contains(popover().element()),
    ).toBe(true);
  });

  test("forwards its ref and keeps a className", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(<Example defaultOpen content={{ ref, className: "mine" }} />);

    await expect.element(popover()).toHaveClass("nuv-popover", "mine");
    expect(ref.current).toBe(popover().element());
  });

  test("can be controlled", async () => {
    const onOpenChange = vi.fn();
    await render(<Example open onOpenChange={onOpenChange} />);

    await expect.element(popover()).toBeVisible();
    await userEvent.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
    // Still open, because the parent hasn't changed the prop.
    await expect.element(popover()).toBeVisible();
  });
});

describe("keyboard", () => {
  test("Enter on the trigger opens it and moves focus inside", async () => {
    await render(<Example />);

    await userEvent.keyboard("{Tab}");
    await expect.element(trigger()).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    await expect
      .element(page.getByRole("button", { name: "Copy link" }))
      .toHaveFocus();
  });

  test("Escape closes it and returns focus to the trigger", async () => {
    await render(<Example />);
    await trigger().click();
    await expect.element(popover()).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.element(popover()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveFocus();
  });

  test("Tab moves through the controls inside and wraps around", async () => {
    await render(<Example />);
    await trigger().click();
    await expect
      .element(page.getByRole("button", { name: "Copy link" }))
      .toHaveFocus();

    await userEvent.keyboard("{Tab}");
    await expect
      .element(page.getByRole("button", { name: "Done" }))
      .toHaveFocus();

    // Not on to the page behind. Escape or a click outside is the way out.
    await userEvent.keyboard("{Tab}");
    await expect
      .element(page.getByRole("button", { name: "Copy link" }))
      .toHaveFocus();
    await expect.element(popover()).toBeVisible();
  });
});

describe("pointer", () => {
  test("a click outside closes it", async () => {
    await render(<Example defaultOpen />);
    await expect.element(popover()).toBeVisible();

    await page.getByRole("button", { name: "After" }).click();

    await expect.element(popover()).not.toBeInTheDocument();
  });

  test("PopoverClose closes it", async () => {
    await render(<Example defaultOpen />);

    await page.getByRole("button", { name: "Done" }).click();

    await expect.element(popover()).not.toBeInTheDocument();
  });
});

describe("layout", () => {
  test("opens under the trigger, 8px away", async () => {
    const panel = await openStill(<Example defaultOpen />);

    expect(rect(panel).top - rect(trigger().element()).bottom).toBe(8);
  });

  test("sideOffset changes the gap", async () => {
    const panel = await openStill(
      <Example defaultOpen content={{ sideOffset: 20 }} />,
    );

    expect(rect(panel).top - rect(trigger().element()).bottom).toBe(20);
  });

  test("flips above the trigger when there's no room below", async () => {
    const panel = await openStill(
      <Example
        defaultOpen
        wrapper={{ position: "fixed", insetBlockEnd: 16, insetInlineStart: 16 }}
      />,
    );

    expect(rect(panel).bottom).toBeLessThanOrEqual(
      rect(trigger().element()).top,
    );
  });

  test("stays on a phone's screen even when asked to be wider", async () => {
    await setViewport("phone");
    const panel = await openStill(
      <Example
        defaultOpen
        content={{ style: { "--nuv-popover-width": "60rem" } as never }}
      />,
    );

    expect(rect(panel).left).toBeGreaterThanOrEqual(8);
    expect(rect(panel).right).toBeLessThanOrEqual(window.innerWidth - 8);
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });

  test("a variable changes the width", async () => {
    await setViewport("desktop");
    const panel = await openStill(
      <Example
        defaultOpen
        content={{ style: { "--nuv-popover-width": "25rem" } as never }}
      />,
    );

    expect(rect(panel).width).toBe(400);
  });

  test("scrolls inside itself when the content is taller than the room", async () => {
    await setViewport("phone");
    const panel = await openStill(<Tall />);

    expect(rect(panel).bottom).toBeLessThanOrEqual(window.innerHeight);
    expect(body().scrollHeight).toBeGreaterThan(body().clientHeight);
    // The panel itself doesn't, or it would cut off an arrow.
    expect(getComputedStyle(panel).overflowY).toBe("visible");
  });

  test("the padding is on the body, and a variable changes it", async () => {
    const panel = await openStill(
      <Example
        defaultOpen
        content={{ style: { "--nuv-popover-padding": "30px" } as never }}
      />,
    );

    expect(getComputedStyle(panel).paddingTop).toBe("0px");
    expect(getComputedStyle(body()).paddingTop).toBe("30px");
    expect(rect(body()).width).toBe(panel.clientWidth);
  });
});

// A popover taller than the screen, with nothing in it that takes focus.
function Tall(props: ComponentProps<typeof PopoverContent>) {
  return (
    <Popover defaultOpen>
      <PopoverTrigger asChild>
        <Button intent="secondary">Share</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Share this page" {...props}>
        <div style={{ blockSize: 2000 }}>Long</div>
      </PopoverContent>
    </Popover>
  );
}

const body = () => document.querySelector(".nuv-popover__body") as HTMLElement;
const arrow = () => document.querySelector(".nuv-popover__arrow");

describe("arrow", () => {
  test("isn't drawn unless asked for", async () => {
    await openStill(<Example defaultOpen />);

    expect(arrow()).toBeNull();
    expect(popover().element().querySelector("svg")).toBeNull();
  });

  test("points at the middle of the trigger from the panel's edge", async () => {
    const panel = await openStill(
      <Example defaultOpen content={{ showArrow: true }} />,
    );
    const tip = rect(arrow() as Element);
    const button = rect(trigger().element());

    expect(tip.left + tip.width / 2).toBeCloseTo(
      button.left + button.width / 2,
      0,
    );
    // Its base is on the panel's outer edge, and it's 6px tall.
    expect(tip.bottom).toBe(rect(panel).top);
    expect(tip.height).toBe(6);
  });

  test("the gap is measured from its tip", async () => {
    await openStill(<Example defaultOpen content={{ showArrow: true }} />);

    expect(
      rect(arrow() as Element).top - rect(trigger().element()).bottom,
    ).toBe(8);
  });

  test("follows the panel when it flips to the other side", async () => {
    const panel = await openStill(
      <Example
        defaultOpen
        content={{ showArrow: true }}
        wrapper={{ position: "fixed", insetBlockEnd: 16, insetInlineStart: 16 }}
      />,
    );

    expect(rect(panel).bottom).toBeLessThan(rect(trigger().element()).top);
    expect(rect(arrow() as Element).top).toBe(rect(panel).bottom);
  });

  test.each(["left", "right"] as const)(
    "faces the trigger when the panel opens on the %s",
    async (side) => {
      await setViewport("desktop");
      const panel = await openStill(
        <Example
          defaultOpen
          content={{ showArrow: true, side }}
          wrapper={{ padding: "200px 500px" }}
        />,
      );
      const tip = rect(arrow() as Element);
      const button = rect(trigger().element());

      expect(tip.top + tip.height / 2).toBeCloseTo(
        button.top + button.height / 2,
        0,
      );
      if (side === "right") expect(tip.right).toBe(rect(panel).left);
      else expect(tip.left).toBe(rect(panel).right);
    },
  );

  test("keeps clear of the panel's rounded corners", async () => {
    await setViewport("desktop");
    const panel = await openStill(
      <div style={{ padding: 80 }}>
        <Popover defaultOpen>
          <PopoverTrigger style={{ inlineSize: 8, padding: 0 }}>
            <span aria-hidden="true">+</span>
          </PopoverTrigger>
          <PopoverContent showArrow align="start" aria-label="Share this page">
            Anyone with the link can view.
          </PopoverContent>
        </Popover>
      </div>,
    );

    const tip = rect(arrow() as Element);
    const button = rect(page.getByRole("button").element());

    expect(tip.left - rect(panel).left).toBe(12);
    // The panel moves over so that the arrow still points at the trigger.
    expect(tip.left + tip.width / 2).toBeCloseTo(
      button.left + button.width / 2,
      0,
    );
    expect(getComputedStyle(arrow()?.parentElement as Element).visibility).toBe(
      "visible",
    );
  });

  test("arrowPadding changes how close to a corner it may go", async () => {
    await setViewport("desktop");
    const panel = await openStill(
      <div style={{ padding: 80 }}>
        <Popover defaultOpen>
          <PopoverTrigger style={{ inlineSize: 8, padding: 0 }}>
            <span aria-hidden="true">+</span>
          </PopoverTrigger>
          <PopoverContent
            showArrow
            arrowPadding={30}
            align="start"
            aria-label="Share this page"
          >
            Anyone with the link can view.
          </PopoverContent>
        </Popover>
      </div>,
    );

    expect(rect(arrow() as Element).left - rect(panel).left).toBe(30);
  });

  test.each(themes)(
    "takes the panel's background and border in %s",
    async (theme) => {
      setPageTheme(theme);
      const panel = await openStill(
        <Example defaultOpen content={{ showArrow: true }} />,
      );
      const drawn = getComputedStyle(arrow() as Element);

      expect(drawn.fill).toBe(getComputedStyle(panel).backgroundColor);
      expect(drawn.stroke).toBe(getComputedStyle(panel).borderTopColor);
    },
  );

  test("follows the panel's variables", async () => {
    const panel = await openStill(
      <Example
        defaultOpen
        content={{
          showArrow: true,
          style: {
            "--nuv-popover-bg": "rgb(1, 2, 3)",
            "--nuv-popover-border": "rgb(4, 5, 6)",
          } as never,
        }}
      />,
    );
    const drawn = getComputedStyle(arrow() as Element);

    expect(getComputedStyle(panel).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(drawn.fill).toBe("rgb(1, 2, 3)");
    expect(drawn.stroke).toBe("rgb(4, 5, 6)");
  });

  test("is hidden from screen readers and takes no clicks", async () => {
    await openStill(<Example defaultOpen content={{ showArrow: true }} />);

    expect(arrow()?.getAttribute("aria-hidden")).toBe("true");
    expect(
      getComputedStyle(arrow()?.closest(".nuv-popover__arrow-frame") as Element)
        .pointerEvents,
    ).toBe("none");
  });

  test("stays outside a panel whose content scrolls", async () => {
    await setViewport("phone");
    const panel = await openStill(<Tall showArrow />);

    expect(body().scrollHeight).toBeGreaterThan(body().clientHeight);
    expect(rect(arrow() as Element).bottom).toBe(rect(panel).top);
    // Nothing between the arrow and the panel clips what's outside it.
    for (
      let box = arrow()?.parentElement;
      box && box !== panel.parentElement;
      box = box.parentElement
    ) {
      expect(getComputedStyle(box).overflowY).toBe("visible");
    }
  });

  test("is in the same place while the panel animates in", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const root = document.documentElement;
    // Held at its first frame for long enough to measure.
    root.style.setProperty("--nuv-duration-base", "100s");

    try {
      await render(<Example defaultOpen content={{ showArrow: true }} />);
      await expect.element(popover()).toBeVisible();
      const panel = popover().element() as HTMLElement;
      expect(getComputedStyle(panel).animationName).toBe("nuv-popover-in");
      const tip = rect(arrow() as Element);
      const middle = tip.left + tip.width / 2;

      // The panel is drawn a little smaller during the animation, so what's
      // compared is where the arrow sits within it.
      const during = (middle - rect(panel).left) / rect(panel).width;
      panel.style.animation = "none";
      const still = rect(arrow() as Element);
      const after =
        (still.left + still.width / 2 - rect(panel).left) / rect(panel).width;

      expect(during).toBeCloseTo(after, 3);
    } finally {
      root.style.removeProperty("--nuv-duration-base");
    }
  });
});

describe("scrolling the body from the keyboard", () => {
  test("a body of text that scrolls becomes a tab stop with the popover's name", async () => {
    await setViewport("phone");
    await openStill(<Tall />);

    await expect.poll(() => body().tabIndex).toBe(0);
    await expect
      .element(page.getByRole("group", { name: "Share this page" }))
      .toBeInTheDocument();

    body().focus();
    await userEvent.keyboard("{PageDown}");
    await expect.poll(() => body().scrollTop).toBeGreaterThan(0);
  });

  test("takes its name from a heading when the popover does", async () => {
    await setViewport("phone");
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button intent="secondary">Share</Button>
        </PopoverTrigger>
        <PopoverContent aria-labelledby="terms">
          <h2 id="terms">Terms of use</h2>
          <div style={{ blockSize: 2000 }}>Long</div>
        </PopoverContent>
      </Popover>,
    );

    await expect
      .element(page.getByRole("group", { name: "Terms of use" }))
      .toBeInTheDocument();
  });

  test("a body that fits, or holds a control, is left alone", async () => {
    await openStill(<Example defaultOpen />);
    // Long enough for the measurement to have happened.
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(body().hasAttribute("tabindex")).toBe(false);
    expect(body().hasAttribute("role")).toBe(false);
  });
});

describe("motion", () => {
  test("pops in when motion is fine", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Example defaultOpen />);

    await expect.element(popover()).toBeVisible();
    expect(getComputedStyle(popover().element()).animationName).toBe(
      "nuv-popover-in",
    );
  });

  test("still closes after its exit animation", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Example defaultOpen />);
    await expect.element(popover()).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.element(popover()).not.toBeInTheDocument();
  });

  test("doesn't animate when reduced motion is on", async () => {
    const panel = await openStill(<Example defaultOpen />);

    expect(getComputedStyle(panel).animationName).toBe("none");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("the open popover passes axe", async () => {
    setPageTheme(theme);
    await openStill(<Example defaultOpen />);

    const results = await axe(document.body);

    expect(results).toHaveNoViolations();
    const contrast = results.passes.find(
      (rule) => rule.id === "color-contrast",
    );
    // The paragraph and the two buttons inside the panel, at least.
    expect(contrast?.nodes.length).toBeGreaterThanOrEqual(3);
  });

  test("so does one with an arrow and a body that scrolls", async () => {
    setPageTheme(theme);
    await setViewport("phone");
    await openStill(<Tall showArrow />);
    await expect.poll(() => body().tabIndex).toBe(0);

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
