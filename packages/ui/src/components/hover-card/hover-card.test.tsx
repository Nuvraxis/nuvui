import "../../styles/index.scss";
import { axe, outsideLandmarks } from "@nuvui/tooling/test/axe";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { setPageTheme, themes } from "@nuvui/tooling/test/themed";
import {
  type CSSProperties,
  createRef,
  type RefAttributes,
  useState,
} from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  HoverCard,
  HoverCardContent,
  type HoverCardContentProps,
  type HoverCardProps,
  HoverCardTrigger,
} from "./hover-card";

interface ExampleProps extends HoverCardProps {
  content?: HoverCardContentProps & RefAttributes<HTMLDivElement>;
  wrapper?: CSSProperties;
}

// No waiting unless a test asks for it.
function Example({
  content,
  wrapper = { padding: 80 },
  openDelay = 0,
  closeDelay = 0,
  ...props
}: ExampleProps) {
  return (
    <div style={wrapper}>
      <HoverCard openDelay={openDelay} closeDelay={closeDelay} {...props}>
        <HoverCardTrigger href="#ada">@ada</HoverCardTrigger>
        <HoverCardContent {...content}>
          <strong>Ada Lovelace</strong>
          <p style={{ margin: 0 }}>Wrote the first published program.</p>
          <a href="#profile">View profile</a>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}

const trigger = () => page.getByRole("link", { name: "@ada" });
const card = () => document.querySelector(".nuv-hover-card");
const rect = (element: Element) => element.getBoundingClientRect();
// Focus as the keyboard would give it. Not with the Tab key, because Safari
// doesn't stop at links with it unless a setting is turned on.
const focusTrigger = () => (trigger().element() as HTMLElement).focus();

// The animation scales the card, which would make measurements depend on
// timing.
async function openStill(node: React.ReactNode) {
  await emulateMedia({ reducedMotion: "reduce" });
  await render(node);
  await expect.poll(card).not.toBeNull();
  return card() as HTMLElement;
}

describe("rendering", () => {
  test("is closed until the pointer rests on the trigger", async () => {
    await render(<Example />);
    expect(card()).toBeNull();
    await expect.element(trigger()).toHaveAttribute("data-state", "closed");

    await userEvent.hover(trigger());

    await expect.poll(card).not.toBeNull();
    await expect.element(page.getByText("Ada Lovelace")).toBeVisible();
    await expect.element(trigger()).toHaveAttribute("data-state", "open");
  });

  test("closes when the pointer leaves", async () => {
    await render(<Example />);
    await userEvent.hover(trigger());
    await expect.poll(card).not.toBeNull();

    await userEvent.unhover(trigger());

    await expect.poll(card).toBeNull();
  });

  test("stays open while the pointer is on the card itself", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example closeDelay={150} />);
    await userEvent.hover(trigger());
    await expect.poll(card).not.toBeNull();

    await userEvent.hover(page.getByText("Ada Lovelace"));
    // Longer than the delay the trigger gives before closing.
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(card()).not.toBeNull();
  });

  test("waits for openDelay before it opens", async () => {
    await render(<Example openDelay={400} />);

    await userEvent.hover(trigger());
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(card()).toBeNull();

    await expect.poll(card).not.toBeNull();
  });

  test("the trigger is still a link", async () => {
    await render(<Example />);

    await expect.element(trigger()).toHaveAttribute("href", "#ada");
    expect(trigger().element().tagName).toBe("A");
  });

  test("renders at the end of body, or in a container when given one", async () => {
    function InSection() {
      const [section, setSection] = useState<HTMLElement | null>(null);
      return (
        <section ref={setSection} data-testid="section">
          <Example defaultOpen content={{ container: section }} />
        </section>
      );
    }
    const first = await render(<Example defaultOpen />);
    await expect.poll(card).not.toBeNull();
    expect(first.container.contains(card())).toBe(false);
    await first.unmount();

    await render(<InSection />);
    await expect.poll(card).not.toBeNull();
    expect(page.getByTestId("section").element().contains(card())).toBe(true);
  });

  test("forwards its ref and keeps a className", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(<Example defaultOpen content={{ ref, className: "mine" }} />);
    await expect.poll(card).not.toBeNull();

    expect(card()?.className).toBe("nuv-hover-card mine");
    expect(ref.current).toBe(card());
  });

  test("can be controlled", async () => {
    const onOpenChange = vi.fn();
    await render(<Example open onOpenChange={onOpenChange} />);
    await expect.poll(card).not.toBeNull();

    await userEvent.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(card()).not.toBeNull();
  });
});

// Radix calls preventDefault when a finger lands on the trigger. React
// listens for that event passively, so the call does nothing there except
// make Chrome log an error for every tap.
describe("touch", () => {
  test("a touch on the trigger doesn't reach for preventDefault, and still runs your handler", async () => {
    const onTouchStart = vi.fn();
    await render(
      <HoverCard>
        <HoverCardTrigger href="#ada" onTouchStart={onTouchStart}>
          @ada
        </HoverCardTrigger>
        <HoverCardContent>Ada Lovelace</HoverCardContent>
      </HoverCard>,
    );
    const touch = new Event("touchstart", { bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(touch, "preventDefault");

    trigger().element().dispatchEvent(touch);

    expect(onTouchStart).toHaveBeenCalledOnce();
    expect(preventDefault).not.toHaveBeenCalled();
  });

  test("the trigger forwards its ref", async () => {
    const ref = createRef<HTMLAnchorElement>();
    await render(
      <HoverCard>
        <HoverCardTrigger ref={ref} href="#ada">
          @ada
        </HoverCardTrigger>
        <HoverCardContent>Ada Lovelace</HoverCardContent>
      </HoverCard>,
    );

    expect(ref.current).toBe(trigger().element());
  });
});

describe("keyboard", () => {
  test("focus on the trigger opens it, and moving on closes it", async () => {
    await render(
      <>
        <Example />
        <button type="button">After</button>
      </>,
    );

    focusTrigger();
    await expect.element(trigger()).toHaveFocus();
    await expect.poll(card).not.toBeNull();

    await userEvent.keyboard("{Tab}");
    await expect
      .element(page.getByRole("button", { name: "After" }))
      .toHaveFocus();
    await expect.poll(card).toBeNull();
  });

  test("Escape closes it and leaves focus on the trigger", async () => {
    await render(<Example />);
    focusTrigger();
    await expect.poll(card).not.toBeNull();

    await userEvent.keyboard("{Escape}");

    await expect.poll(card).toBeNull();
    await expect.element(trigger()).toHaveFocus();
  });

  // Radix does this. It's why a card can't hold the only way to do something.
  test("Tab doesn't go into the card", async () => {
    await render(
      <>
        <Example />
        <button type="button">After</button>
      </>,
    );
    focusTrigger();
    await expect.poll(card).not.toBeNull();

    await expect
      .poll(() => card()?.querySelector("a")?.getAttribute("tabindex"))
      .toBe("-1");
    await userEvent.keyboard("{Tab}");

    await expect
      .element(page.getByRole("button", { name: "After" }))
      .toHaveFocus();
  });
});

describe("layout", () => {
  test("opens under the trigger, centered on it, 8px away", async () => {
    await setViewport("desktop");
    const panel = await openStill(
      <Example
        defaultOpen
        wrapper={{ display: "flex", justifyContent: "center", padding: 80 }}
      />,
    );
    const link = rect(trigger().element());

    expect(rect(panel).top - link.bottom).toBe(8);
    expect(rect(panel).left + rect(panel).width / 2).toBeCloseTo(
      link.left + link.width / 2,
      0,
    );
    expect(rect(panel).width).toBe(288);
  });

  test("stays on a phone's screen when its trigger is at the edge", async () => {
    await setViewport("phone");
    const panel = await openStill(
      <Example defaultOpen wrapper={{ padding: 4 }} />,
    );

    expect(rect(panel).left).toBeGreaterThanOrEqual(8);
    expect(rect(panel).right).toBeLessThanOrEqual(window.innerWidth - 8);
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
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

  test("a tall card stays on the screen and scrolls inside itself", async () => {
    await setViewport("phone");
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <div style={{ padding: 40 }}>
        <HoverCard defaultOpen>
          <HoverCardTrigger href="#ada">@ada</HoverCardTrigger>
          <HoverCardContent>
            {Array.from({ length: 60 }, (_, line) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static filler text
              <p key={line}>Line {line}</p>
            ))}
          </HoverCardContent>
        </HoverCard>
      </div>,
    );
    await expect.poll(card).not.toBeNull();
    const panel = card() as HTMLElement;

    expect(rect(panel).bottom).toBeLessThanOrEqual(window.innerHeight);
    expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
  });

  test("component variables change the width and the padding", async () => {
    await setViewport("desktop");
    const panel = await openStill(
      <Example
        defaultOpen
        content={{
          style: {
            "--nuv-hover-card-width": "20rem",
            "--nuv-hover-card-padding": "24px",
          } as never,
        }}
      />,
    );

    expect(rect(panel).width).toBe(320);
    expect(getComputedStyle(panel).paddingTop).toBe("24px");
  });
});

describe("motion", () => {
  test("pops in when motion is fine", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Example defaultOpen />);

    await expect.poll(card).not.toBeNull();
    expect(getComputedStyle(card() as Element).animationName).toBe(
      "nuv-hover-card-in",
    );
  });

  test("still closes after its exit animation", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Example defaultOpen />);
    await expect.poll(card).not.toBeNull();

    await userEvent.keyboard("{Escape}");

    await expect.poll(card).toBeNull();
  });

  test("doesn't animate when reduced motion is on", async () => {
    const panel = await openStill(<Example defaultOpen />);

    expect(getComputedStyle(panel).animationName).toBe("none");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("the open card passes axe", async () => {
    setPageTheme(theme);
    await openStill(<Example defaultOpen />);

    const results = await axe(document.body, outsideLandmarks);

    expect(results).toHaveNoViolations();
    const contrast = results.passes.find(
      (rule) => rule.id === "color-contrast",
    );
    // The trigger, and the name, the line and the link in the card.
    expect(contrast?.nodes.length).toBeGreaterThanOrEqual(4);
  });
});
