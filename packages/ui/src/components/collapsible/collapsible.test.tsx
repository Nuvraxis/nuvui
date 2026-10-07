import "../../styles/index.scss";
import { createRef, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { emulateMedia } from "../../../test/media";
import { expectNoViolations, renderThemed, themes } from "../../../test/themed";
import { Button } from "../button";
import {
  Collapsible,
  CollapsibleContent,
  type CollapsibleProps,
  CollapsibleTrigger,
} from "./collapsible";

function Example(props: CollapsibleProps) {
  return (
    <Collapsible data-testid="root" {...props}>
      <CollapsibleTrigger asChild>
        <Button intent="secondary">Show details</Button>
      </CollapsibleTrigger>
      <CollapsibleContent data-testid="content">
        <p>Order 10248, placed on 4 July.</p>
      </CollapsibleContent>
    </Collapsible>
  );
}

const trigger = () => page.getByRole("button", { name: "Show details" });
const content = () => page.getByTestId("content");
const text = () => page.getByText("Order 10248, placed on 4 July.");
const style = (element: Element) => getComputedStyle(element);

describe("rendering", () => {
  test("starts closed, with the content out of the page", async () => {
    await render(<Example />);

    await expect.element(trigger()).toHaveAttribute("aria-expanded", "false");
    await expect.element(trigger()).toHaveAttribute("data-state", "closed");
    expect(text().elements()).toHaveLength(0);
  });

  test("a click shows the content, and another hides it", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example />);

    await trigger().click();
    await expect.element(text()).toBeVisible();
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "true");
    await expect.element(content()).toHaveAttribute("data-state", "open");

    await trigger().click();
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(text().elements()).toHaveLength(0);
  });

  test("the button says which element it controls", async () => {
    await render(<Example defaultOpen />);

    await expect
      .element(trigger())
      .toHaveAttribute("aria-controls", content().element().id);
  });

  test("defaultOpen starts it open", async () => {
    await render(<Example defaultOpen />);

    await expect.element(text()).toBeVisible();
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "true");
  });

  test("can be controlled", async () => {
    const onOpenChange = vi.fn();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Example
            open={open}
            onOpenChange={(next) => {
              onOpenChange(next);
              setOpen(next);
            }}
          />
          <Button onClick={() => setOpen(false)}>Hide from outside</Button>
        </>
      );
    }
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Controlled />);

    await trigger().click();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await expect.element(text()).toBeVisible();

    await page.getByRole("button", { name: "Hide from outside" }).click();
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  test("disabled stops it from opening", async () => {
    await render(<Example disabled />);

    await expect.element(trigger()).toBeDisabled();
    await expect.element(trigger()).toHaveAttribute("data-disabled", "");
  });

  test("forceMount keeps the content in the page while closed, and leaves hiding it to you", async () => {
    await render(
      <Collapsible>
        <CollapsibleTrigger>Show details</CollapsibleTrigger>
        <CollapsibleContent forceMount data-testid="content">
          Findable text
        </CollapsibleContent>
      </Collapsible>,
    );

    expect(content().element().textContent).toBe("Findable text");
    await expect.element(content()).toHaveAttribute("data-state", "closed");
    expect(content().element().hasAttribute("hidden")).toBe(false);
  });

  test("every part forwards its ref and keeps a className", async () => {
    const refs = {
      root: createRef<HTMLDivElement>(),
      trigger: createRef<HTMLButtonElement>(),
      content: createRef<HTMLDivElement>(),
    };
    await render(
      <Collapsible ref={refs.root} className="mine" defaultOpen>
        <CollapsibleTrigger ref={refs.trigger} className="mine">
          Show details
        </CollapsibleTrigger>
        <CollapsibleContent ref={refs.content} className="mine">
          Text
        </CollapsibleContent>
      </Collapsible>,
    );

    expect(refs.root.current?.className).toBe("nuv-collapsible mine");
    expect(refs.trigger.current?.className).toBe(
      "nuv-collapsible__trigger mine",
    );
    expect(refs.content.current?.className).toBe(
      "nuv-collapsible__content mine",
    );
  });
});

describe("keyboard", () => {
  test("Tab reaches the button, and Enter and Space both work it", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example />);

    await userEvent.keyboard("{Tab}");
    await expect.element(trigger()).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "true");

    await userEvent.keyboard(" ");
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "false");
    // Focus stays on the button, so the next press works too.
    await expect.element(trigger()).toHaveFocus();
  });

  test("what's inside comes next in the tab order once it's open", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button>Show details</Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Button>Refund</Button>
        </CollapsibleContent>
      </Collapsible>,
    );

    await userEvent.keyboard("{Tab}{Enter}{Tab}");

    await expect
      .element(page.getByRole("button", { name: "Refund" }))
      .toHaveFocus();
  });
});

describe("styles", () => {
  test("slides open when motion is fine", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Example />);

    await trigger().click();

    await expect.element(text()).toBeVisible();
    expect(style(content().element()).animationName).toBe(
      "nuv-collapsible-down",
    );
    expect(style(content().element()).overflow).toBe("hidden");
  });

  test("slides shut, and only leaves the page when that's done", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <Example
        defaultOpen
        style={{ "--nuv-collapsible-duration": "300ms" } as never}
      />,
    );

    await trigger().click();

    expect(style(content().element()).animationName).toBe("nuv-collapsible-up");
    await expect.poll(() => text().elements().length).toBe(0);
  });

  test("doesn't animate when reduced motion is on", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example />);

    await trigger().click();

    await expect.element(text()).toBeVisible();
    expect(style(content().element()).animationName).toBe("none");
  });

  test("a component variable sets how long it takes", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <Example style={{ "--nuv-collapsible-duration": "2s" } as never} />,
    );

    await trigger().click();

    await expect.element(text()).toBeVisible();
    expect(style(content().element()).animationDuration).toBe("2s");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, closed and open", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const screen = await renderThemed(theme, <Example />);
    await expectNoViolations(screen.container);

    await trigger().click();
    await expect.element(text()).toBeVisible();

    await expectNoViolations(screen.container);
  });
});
