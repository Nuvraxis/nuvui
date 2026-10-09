import "../../styles/index.scss";
import { axe, outsideLandmarks } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia } from "@nuvui/tooling/test/media";
import { setPageTheme, themes } from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef, useState } from "react";
import { describe, expect, test } from "vitest";
import { type Locator, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../button";
import {
  Tooltip,
  TooltipContent,
  type TooltipProps,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

interface ExampleProps extends TooltipProps {
  // ComponentProps and not TooltipContentProps, so a test can pass a ref.
  content?: ComponentProps<typeof TooltipContent>;
  name?: string;
  text?: string;
}

function Example({
  content,
  name = "Delete",
  text = "Delete this file",
  ...props
}: ExampleProps) {
  return (
    <Tooltip delayDuration={0} {...props}>
      <TooltipTrigger asChild>
        <Button intent="secondary" aria-label={name}>
          ×
        </Button>
      </TooltipTrigger>
      <TooltipContent {...content}>{text}</TooltipContent>
    </Tooltip>
  );
}

// Room on every side, so the tooltip opens where it's asked to, and a spot
// in the corner for the pointer to go when it leaves.
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: 80 }}>
      {children}
      <span
        data-testid="away"
        style={{ position: "fixed", inset: "auto 0 0 auto", padding: 20 }}
      />
    </div>
  );
}

// Radix works out whether the pointer is heading for the tooltip or leaving
// by watching it move, and keeps the tooltip open while the pointer is
// anywhere between where it left the trigger and the bubble. A test's
// pointer jumps straight to its target, which is one event and not movement.
// So it's nudged twice more, toward the bottom right, which in these tests is
// always away from the bubble.
async function moveTo(target: Locator) {
  const { width, height } = target.element().getBoundingClientRect();
  await userEvent.hover(target);
  await userEvent.hover(target, { position: { x: width - 4, y: height - 4 } });
  await userEvent.hover(target, { position: { x: width - 8, y: height - 8 } });
}

const trigger = (name = "Delete") => page.getByRole("button", { name });
// Radix renders the text twice: once in the bubble people see, and once in a
// visually hidden element with the tooltip role. This is the bubble.
const bubble = () => document.querySelector<HTMLElement>(".nuv-tooltip");
const rect = (element: Element) => element.getBoundingClientRect();

async function shown() {
  await expect.poll(bubble).not.toBeNull();
  return bubble() as HTMLElement;
}

describe("rendering", () => {
  test("works without a provider around it", async () => {
    await render(
      <Stage>
        <Example />
      </Stage>,
    );

    await expect.element(trigger()).toBeVisible();
    expect(bubble()).toBeNull();
  });

  test("shows on hover and hides when the pointer leaves", async () => {
    await render(
      <Stage>
        <Example />
      </Stage>,
    );

    await userEvent.hover(trigger());
    expect((await shown()).textContent).toBe("Delete this file");

    await moveTo(page.getByTestId("away"));
    await expect.poll(bubble).toBeNull();
  });

  test("describes its trigger, and doesn't name it", async () => {
    await render(
      <Stage>
        <Example />
      </Stage>,
    );

    await userEvent.hover(trigger());
    await shown();

    await expect.element(trigger()).toHaveAccessibleName("Delete");
    await expect
      .element(trigger())
      .toHaveAccessibleDescription("Delete this file");
    await expect.element(page.getByRole("tooltip")).toBeInTheDocument();
  });

  test("renders at the end of body, or in a container when given one", async () => {
    function InSection() {
      const [section, setSection] = useState<HTMLElement | null>(null);
      return (
        <section ref={setSection} data-testid="section">
          <Stage>
            <Example defaultOpen content={{ container: section }} />
          </Stage>
        </section>
      );
    }
    const first = await render(
      <Stage>
        <Example defaultOpen />
      </Stage>,
    );
    expect(first.container.contains(await shown())).toBe(false);
    await first.unmount();

    await render(<InSection />);
    expect(
      page
        .getByTestId("section")
        .element()
        .contains(await shown()),
    ).toBe(true);
  });

  test("forwards its ref and keeps a className", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <Stage>
        <Example defaultOpen content={{ ref, className: "mine" }} />
      </Stage>,
    );

    const element = await shown();
    expect(element.classList.contains("mine")).toBe(true);
    expect(ref.current).toBe(element);
  });

  test("draws an arrow unless it's turned off", async () => {
    const first = await render(
      <Stage>
        <Example defaultOpen />
      </Stage>,
    );
    expect((await shown()).querySelector(".nuv-tooltip__arrow")).not.toBeNull();
    await first.unmount();

    await render(
      <Stage>
        <Example defaultOpen content={{ showArrow: false }} />
      </Stage>,
    );
    expect((await shown()).querySelector(".nuv-tooltip__arrow")).toBeNull();
  });
});

describe("keyboard", () => {
  test("shows at once when the trigger gets keyboard focus", async () => {
    await render(
      <Stage>
        <Example delayDuration={5000} />
      </Stage>,
    );

    await userEvent.keyboard("{Tab}");

    // Well inside the five second hover delay.
    expect((await shown()).dataset.state).toBe("instant-open");
  });

  test("Escape hides it and leaves focus where it was", async () => {
    await render(
      <Stage>
        <Example />
      </Stage>,
    );
    await userEvent.keyboard("{Tab}");
    await shown();

    await userEvent.keyboard("{Escape}");

    await expect.poll(bubble).toBeNull();
    await expect.element(trigger()).toHaveFocus();
  });

  test("hides when focus moves on", async () => {
    await render(
      <Stage>
        <Example />
        <button type="button">Next</button>
      </Stage>,
    );
    await userEvent.keyboard("{Tab}");
    await shown();

    await userEvent.keyboard("{Tab}");

    await expect.poll(bubble).toBeNull();
  });
});

describe("touch", () => {
  test("a finger on the trigger doesn't open it", async () => {
    await render(
      <Stage>
        <Example />
      </Stage>,
    );
    const element = trigger().element();
    const move = (pointerType: string) =>
      element.dispatchEvent(
        new PointerEvent("pointermove", { pointerType, bubbles: true }),
      );

    move("touch");
    // Long enough for a tooltip with no delay to have appeared.
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(bubble()).toBeNull();

    // The same event from a mouse does open it, so the check above means
    // something.
    move("mouse");
    await shown();
  });
});

describe("provider", () => {
  const pair = (
    <Stage>
      <Example name="Delete" text="Delete this file" />
      <Example name="Rename" text="Rename this file" />
    </Stage>
  );

  test("under one provider, the second tooltip skips the delay", async () => {
    // The default leaves 300ms to get from one trigger to the next, which a
    // test's pointer can miss when the browser is busy.
    await render(
      <TooltipProvider skipDelayDuration={5000}>{pair}</TooltipProvider>,
    );

    await userEvent.hover(trigger("Delete"));
    expect((await shown()).dataset.state).toBe("delayed-open");

    await moveTo(trigger("Rename"));
    await expect.poll(() => bubble()?.textContent).toBe("Rename this file");
    expect(bubble()?.dataset.state).toBe("instant-open");
  });

  test("on their own, each tooltip waits for itself", async () => {
    await render(pair);

    await userEvent.hover(trigger("Delete"));
    await shown();

    await moveTo(trigger("Rename"));
    await expect.poll(() => bubble()?.textContent).toBe("Rename this file");
    expect(bubble()?.dataset.state).toBe("delayed-open");
  });
});

describe("styles", () => {
  test("opens above the trigger, clear of it", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <Stage>
        <Example defaultOpen />
      </Stage>,
    );

    const element = await shown();
    // The 5px arrow and the 4px offset sit between the two.
    expect(rect(trigger().element()).top - rect(element).bottom).toBe(9);
  });

  test("wraps long text instead of running off the screen", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <Stage>
        <Example
          defaultOpen
          text="Deletes this file and every version of it. This can't be undone, so check the name first."
        />
      </Stage>,
    );

    const element = await shown();
    expect(rect(element).width).toBeLessThanOrEqual(256);
    expect(rect(element).left).toBeGreaterThanOrEqual(8);
    expect(rect(element).right).toBeLessThanOrEqual(window.innerWidth - 8);
  });

  test("fades in after a hover when motion is fine", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <Stage>
        <Example />
      </Stage>,
    );

    await userEvent.hover(trigger());

    expect(getComputedStyle(await shown()).animationName).toBe(
      "nuv-tooltip-in",
    );
  });

  test("doesn't animate when reduced motion is on", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <Stage>
        <Example />
      </Stage>,
    );

    await userEvent.hover(trigger());

    expect(getComputedStyle(await shown()).animationName).toBe("none");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("the open tooltip passes axe and its text has contrast", async () => {
    setPageTheme(theme);
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <main>
        <Stage>
          <Example defaultOpen />
        </Stage>
      </main>,
    );
    const style = getComputedStyle(await shown());

    const results = await axe(document.body, outsideLandmarks);

    expect(results).toHaveNoViolations();
    expect(contrast(style.color, style.backgroundColor)).toBeGreaterThan(7);
  });
});
