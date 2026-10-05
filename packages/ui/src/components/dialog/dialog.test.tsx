import "../../styles/index.scss";
import { type ReactNode, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axe } from "../../../test/axe";
import { emulateMedia, emulateTouch, setViewport } from "../../../test/media";
import { Button } from "../button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  type DialogContentProps,
  DialogDescription,
  DialogFooter,
  type DialogProps,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

function Example({
  content,
  children,
  ...props
}: DialogProps & { content?: DialogContentProps }) {
  return (
    <Dialog {...props}>
      <DialogTrigger asChild>
        <Button>Edit profile</Button>
      </DialogTrigger>
      <DialogContent {...content}>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>
          Changes are saved to your account.
        </DialogDescription>
        {children}
        <DialogFooter>
          <DialogClose asChild>
            <Button intent="secondary">Cancel</Button>
          </DialogClose>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const trigger = () => page.getByRole("button", { name: "Edit profile" });
const dialog = () => page.getByRole("dialog", { name: "Edit profile" });

// Animations move and scale the panel, which would make measurements depend
// on timing.
async function openWithoutMotion(node: ReactNode) {
  await emulateMedia({ reducedMotion: "reduce" });
  await render(node);
  await trigger().click();
  await expect.element(dialog()).toBeVisible();
  return dialog().element();
}

describe("rendering", () => {
  test("is closed until the trigger is pressed", async () => {
    await render(<Example />);

    await expect.element(dialog()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveAttribute("aria-haspopup", "dialog");
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "false");

    // Held as an element, because once the dialog is open the trigger is
    // hidden from the accessibility tree and a role query can't find it.
    const button = trigger().element();
    await trigger().click();

    await expect.element(dialog()).toBeVisible();
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  test("takes its name and description from the title and description", async () => {
    await render(<Example defaultOpen />);

    await expect.element(dialog()).toHaveAccessibleName("Edit profile");
    await expect
      .element(dialog())
      .toHaveAccessibleDescription("Changes are saved to your account.");
  });

  test("renders at the end of body, outside the component tree", async () => {
    const screen = await render(<Example defaultOpen />);

    await expect.element(dialog()).toBeVisible();
    expect(screen.container.contains(dialog().element())).toBe(false);
    expect(dialog().element().parentElement).toBe(document.body);
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

    await expect.element(dialog()).toBeVisible();
    expect(dialog().element().parentElement).toBe(
      page.getByTestId("section").element(),
    );
  });

  test("turns size into a BEM modifier and keeps a className", async () => {
    await render(
      <Example defaultOpen content={{ size: "lg", className: "mine" }} />,
    );

    await expect
      .element(dialog())
      .toHaveClass("nuv-dialog", "nuv-dialog--lg", "mine");
  });

  test("can be controlled", async () => {
    const onOpenChange = vi.fn();
    await render(<Example open onOpenChange={onOpenChange} />);

    await expect.element(dialog()).toBeVisible();
    await userEvent.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
    // Still open, because the parent hasn't changed the prop.
    await expect.element(dialog()).toBeVisible();
  });
});

describe("close button", () => {
  test("closes the dialog and has an accessible name", async () => {
    await render(<Example defaultOpen />);

    await page.getByRole("button", { name: "Close", exact: true }).click();

    await expect.element(dialog()).not.toBeInTheDocument();
  });

  test("takes a translated label", async () => {
    await render(<Example defaultOpen content={{ closeLabel: "Schließen" }} />);

    await expect
      .element(page.getByRole("button", { name: "Schließen" }))
      .toBeVisible();
  });

  test("can be left out", async () => {
    await render(<Example defaultOpen content={{ showCloseButton: false }} />);

    await expect.element(dialog()).toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Close", exact: true }))
      .not.toBeInTheDocument();
  });

  test("is at least 44px on a touch screen", async () => {
    await emulateTouch(true);
    await render(<Example defaultOpen />);

    const { width, height } = page
      .getByRole("button", { name: "Close", exact: true })
      .element()
      .getBoundingClientRect();

    expect(width).toBeGreaterThanOrEqual(44);
    expect(height).toBeGreaterThanOrEqual(44);
  });
});

describe("keyboard", () => {
  test("Enter on the trigger opens it and moves focus inside", async () => {
    await render(<Example />);

    await userEvent.keyboard("{Tab}");
    await expect.element(trigger()).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    await expect.element(dialog()).toBeVisible();
    // The first control in the content, not the close button in the corner.
    await expect
      .element(page.getByRole("button", { name: "Cancel" }))
      .toHaveFocus();
  });

  test("Tab stays inside the dialog and wraps around", async () => {
    await render(<Example defaultOpen />);
    await expect.element(dialog()).toBeVisible();

    const visited: string[] = [];
    // Three controls, so five presses go round more than once.
    for (let press = 0; press < 5; press += 1) {
      await userEvent.keyboard("{Tab}");
      expect(dialog().element().contains(document.activeElement)).toBe(true);
      visited.push(document.activeElement?.textContent || "close");
    }

    expect(visited).toEqual(["Save", "close", "Cancel", "Save", "close"]);
  });

  test("Shift+Tab wraps backwards", async () => {
    await render(<Example defaultOpen />);
    await expect
      .element(page.getByRole("button", { name: "Cancel" }))
      .toHaveFocus();

    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");

    await expect
      .element(page.getByRole("button", { name: "Close", exact: true }))
      .toHaveFocus();
  });

  test("Escape closes it and returns focus to the trigger", async () => {
    await render(<Example />);
    await trigger().click();
    await expect.element(dialog()).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.element(dialog()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveFocus();
  });
});

describe("pointer", () => {
  test("a click on the overlay closes it", async () => {
    await setViewport("desktop");
    await openWithoutMotion(<Example />);
    const overlay = document.querySelector(".nuv-dialog__overlay");
    if (!overlay) throw new Error("no overlay rendered");

    await userEvent.click(overlay, { position: { x: 8, y: 8 } });

    await expect.element(dialog()).not.toBeInTheDocument();
  });

  test("the page behind can't be reached while it's open", async () => {
    await render(<Example defaultOpen />);

    await expect.element(dialog()).toBeVisible();
    // Radix hides everything else from assistive tech and blocks the pointer.
    expect(trigger().query()).toBeNull();
    expect(getComputedStyle(document.body).pointerEvents).toBe("none");
  });
});

describe("layout", () => {
  test("is a full-width sheet at the bottom on a phone", async () => {
    await setViewport("phone");
    const panel = await openWithoutMotion(<Example />);

    const rect = panel.getBoundingClientRect();

    expect(rect.left).toBe(0);
    expect(rect.width).toBe(window.innerWidth);
    expect(rect.bottom).toBe(window.innerHeight);
  });

  test.each([
    ["sm", 384],
    ["md", 512],
    ["lg", 768],
  ] as const)(
    "size %s is centered and %ipx wide on a desktop",
    async (size, width) => {
      await setViewport("desktop");
      const panel = await openWithoutMotion(<Example content={{ size }} />);

      const rect = panel.getBoundingClientRect();

      expect(rect.width).toBe(width);
      expect(rect.left + rect.width / 2).toBeCloseTo(window.innerWidth / 2, 0);
      expect(rect.top + rect.height / 2).toBeCloseTo(window.innerHeight / 2, 0);
    },
  );

  test("never grows taller than the screen, and scrolls instead", async () => {
    await setViewport("phone");
    const panel = await openWithoutMotion(
      <Example>
        {Array.from({ length: 80 }, (_, line) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static filler text
          <p key={line}>Line {line}</p>
        ))}
      </Example>,
    );

    const rect = panel.getBoundingClientRect();

    expect(rect.top).toBeGreaterThan(0);
    expect(rect.height).toBeLessThan(window.innerHeight);
    expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
    expect(getComputedStyle(panel).overflowY).toBe("auto");
  });

  test("a component variable changes the width", async () => {
    await setViewport("desktop");
    document.documentElement.style.setProperty("--nuv-dialog-width", "20rem");

    try {
      const panel = await openWithoutMotion(<Example />);
      expect(panel.getBoundingClientRect().width).toBe(320);
    } finally {
      document.documentElement.style.removeProperty("--nuv-dialog-width");
    }
  });
});

describe("motion", () => {
  test("slides up as a sheet on a phone", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await setViewport("phone");
    await render(<Example defaultOpen />);

    await expect.element(dialog()).toBeVisible();
    expect(getComputedStyle(dialog().element()).animationName).toBe(
      "nuv-dialog-sheet-in",
    );
  });

  test("pops in on a desktop", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await setViewport("desktop");
    await render(<Example defaultOpen />);

    await expect.element(dialog()).toBeVisible();
    expect(getComputedStyle(dialog().element()).animationName).toBe(
      "nuv-dialog-pop-in",
    );
  });

  test("still closes after its exit animation", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Example defaultOpen />);
    await expect.element(dialog()).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.element(dialog()).not.toBeInTheDocument();
  });

  test("doesn't animate when reduced motion is on", async () => {
    const panel = await openWithoutMotion(<Example />);
    const overlay = document.querySelector(".nuv-dialog__overlay");
    if (!overlay) throw new Error("no overlay rendered");

    expect(getComputedStyle(panel).animationName).toBe("none");
    expect(getComputedStyle(overlay).animationName).toBe("none");
  });
});

describe.each(["light", "dark"] as const)("accessibility in %s", (theme) => {
  test("the open dialog passes axe", async () => {
    document.documentElement.setAttribute("data-theme", theme);
    await openWithoutMotion(<Example />);

    const results = await axe(document.body);

    expect(results).toHaveNoViolations();
    const contrast = results.passes.find(
      (rule) => rule.id === "color-contrast",
    );
    // Title, description and the two footer buttons.
    expect(contrast?.nodes.length).toBeGreaterThanOrEqual(4);
  });
});
