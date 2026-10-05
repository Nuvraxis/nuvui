import "../../styles/index.scss";
import {
  type ComponentProps,
  type CSSProperties,
  createRef,
  useState,
} from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axe } from "../../../test/axe";
import { emulateMedia, setViewport } from "../../../test/media";
import { setPageTheme, themes } from "../../../test/themed";
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
      <button type="button">After</button>
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
    const panel = await openStill(
      <Popover defaultOpen>
        <PopoverTrigger>Share</PopoverTrigger>
        <PopoverContent aria-label="Share this page">
          <div style={{ blockSize: 2000 }}>Long</div>
        </PopoverContent>
      </Popover>,
    );

    expect(rect(panel).bottom).toBeLessThanOrEqual(window.innerHeight);
    expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
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
});
