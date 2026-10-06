import "../../styles/index.scss";
import { createRef, type ReactNode, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axe } from "../../../test/axe";
import { emulateMedia, setViewport } from "../../../test/media";
import { setPageTheme, themes } from "../../../test/themed";
import { Button } from "../button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  type DialogContentProps,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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

  test("is 32px with a mouse", async () => {
    await render(<Example defaultOpen />);

    const { width, height } = page
      .getByRole("button", { name: "Close", exact: true })
      .element()
      .getBoundingClientRect();

    expect(width).toBe(32);
    expect(height).toBe(32);
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

// A dialog in three parts. `lines` is how much text the body holds, and
// `field` puts a control in it.
function Parts({
  lines = 80,
  field = false,
  ...props
}: DialogProps & { lines?: number; field?: boolean }) {
  return (
    <Dialog {...props}>
      <DialogTrigger asChild>
        <Button>Edit profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Changes are saved to your account.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {field ? <input aria-label="Name" /> : null}
          {Array.from({ length: lines }, (_, line) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static filler text
            <p key={line}>Line {line}</p>
          ))}
        </DialogBody>
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

const body = () => document.querySelector(".nuv-dialog__body") as HTMLElement;

describe("header and body", () => {
  test("forward their refs and keep a className", async () => {
    const header = createRef<HTMLDivElement>();
    const main = createRef<HTMLDivElement>();
    await render(
      <Dialog defaultOpen>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader ref={header} className="mine">
            <DialogTitle>Edit profile</DialogTitle>
          </DialogHeader>
          <DialogBody ref={main} className="mine">
            Text
          </DialogBody>
        </DialogContent>
      </Dialog>,
    );

    await expect.element(dialog()).toBeVisible();
    expect(header.current?.className).toBe("nuv-dialog__header mine");
    expect(main.current?.className).toBe("nuv-dialog__body mine");
  });

  test.each(["phone", "desktop"] as const)(
    "on a %s the body scrolls and the panel doesn't",
    async (viewport) => {
      await setViewport(viewport);
      const panel = await openWithoutMotion(<Parts />);

      expect(panel.getBoundingClientRect().height).toBeLessThan(
        window.innerHeight,
      );
      expect(panel.scrollHeight).toBe(panel.clientHeight);
      expect(body().scrollHeight).toBeGreaterThan(body().clientHeight);
    },
  );

  test.each(["phone", "desktop"] as const)(
    "on a %s the title and the buttons stay put while it scrolls",
    async (viewport) => {
      await setViewport(viewport);
      const panel = await openWithoutMotion(<Parts />);
      const tops = () =>
        [
          page.getByRole("heading", { name: "Edit profile" }),
          page.getByRole("button", { name: "Save" }),
        ].map((part) => part.element().getBoundingClientRect().top);
      const before = tops();

      body().scrollTop = body().scrollHeight;

      expect(body().scrollTop).toBeGreaterThan(0);
      expect(tops()).toEqual(before);
      const save = page
        .getByRole("button", { name: "Save" })
        .element()
        .getBoundingClientRect();
      expect(save.bottom).toBeLessThanOrEqual(
        panel.getBoundingClientRect().bottom,
      );
    },
  );

  test("the scrollbar sits on the panel's edge, and the text lines up with the title", async () => {
    await setViewport("desktop");
    const panel = await openWithoutMotion(<Parts />);

    // The panel's width without its border.
    expect(body().getBoundingClientRect().width).toBe(panel.clientWidth);
    expect(
      (body().querySelector("p") as Element).getBoundingClientRect().left,
    ).toBe(
      page
        .getByRole("heading", { name: "Edit profile" })
        .element()
        .getBoundingClientRect().left,
    );
  });

  test("a body that fits doesn't scroll, and takes no room it doesn't need", async () => {
    await setViewport("desktop");
    const panel = await openWithoutMotion(<Parts lines={2} />);

    expect(body().scrollHeight).toBe(body().clientHeight);
    expect(panel.getBoundingClientRect().height).toBeLessThan(400);
  });

  test("a component variable changes the padding on every side", async () => {
    await setViewport("desktop");
    document.documentElement.style.setProperty("--nuv-dialog-padding", "40px");

    try {
      const panel = await openWithoutMotion(<Parts />);
      const edge = panel.getBoundingClientRect().left;

      expect(body().getBoundingClientRect().left).toBe(edge + 1);
      expect(
        (body().querySelector("p") as Element).getBoundingClientRect().left,
      ).toBe(edge + 41);
    } finally {
      document.documentElement.style.removeProperty("--nuv-dialog-padding");
    }
  });
});

// Someone who doesn't use a mouse scrolls with the arrow keys, and those go
// to whatever has focus. A body with only text in it has nothing to focus.
describe("scrolling the body from the keyboard", () => {
  test("a body of text that scrolls becomes a tab stop with a name", async () => {
    await openWithoutMotion(<Parts />);

    await expect.poll(() => body().tabIndex).toBe(0);
    await expect
      .element(page.getByRole("group", { name: "Edit profile" }))
      .toBeInTheDocument();
    expect(page.getByRole("group").element()).toBe(body());
  });

  test("the arrow keys scroll it once it has focus", async () => {
    await openWithoutMotion(<Parts />);
    await expect.poll(() => body().tabIndex).toBe(0);

    body().focus();
    await userEvent.keyboard("{PageDown}");

    await expect.poll(() => body().scrollTop).toBeGreaterThan(0);
  });

  test("Tab reaches it between the header and the footer, with a ring", async () => {
    await openWithoutMotion(<Parts />);
    await expect.poll(() => body().tabIndex).toBe(0);
    // Focus starts on Cancel, the first control. Going backwards from there
    // is the body.
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");

    expect(document.activeElement).toBe(body());
    expect(getComputedStyle(body()).outlineStyle).toBe("solid");
  });

  test("opening still puts focus on the first control, not on the body", async () => {
    await openWithoutMotion(<Parts />);
    await expect.poll(() => body().tabIndex).toBe(0);

    await expect
      .element(page.getByRole("button", { name: "Cancel" }))
      .toHaveFocus();
  });

  test("a body that fits is left alone", async () => {
    await openWithoutMotion(<Parts lines={2} />);
    // Long enough for the measurement to have happened.
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(body().hasAttribute("tabindex")).toBe(false);
    expect(body().hasAttribute("role")).toBe(false);
  });

  test("so is one with a control in it, which Tab can already reach", async () => {
    await openWithoutMotion(<Parts field />);
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(body().scrollHeight).toBeGreaterThan(body().clientHeight);
    expect(body().hasAttribute("tabindex")).toBe(false);
    await expect
      .element(page.getByRole("textbox", { name: "Name" }))
      .toHaveFocus();
  });

  test("it follows the content as that grows and shrinks", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const screen = await render(<Parts defaultOpen lines={2} />);
    await expect.element(dialog()).toBeVisible();
    expect(body().hasAttribute("tabindex")).toBe(false);

    await screen.rerender(<Parts defaultOpen lines={80} />);
    await expect.poll(() => body().getAttribute("tabindex")).toBe("0");

    await screen.rerender(<Parts defaultOpen lines={2} />);
    await expect.poll(() => body().hasAttribute("tabindex")).toBe(false);
  });

  test("your own tabIndex and role win", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <Dialog defaultOpen>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Terms</DialogTitle>
          <DialogBody tabIndex={-1} role="document">
            <div style={{ blockSize: 3000 }}>Long</div>
          </DialogBody>
        </DialogContent>
      </Dialog>,
    );
    await expect.element(page.getByRole("dialog")).toBeVisible();
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(body().getAttribute("tabindex")).toBe("-1");
    expect(body().getAttribute("role")).toBe("document");
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

describe.each(themes)("accessibility in %s", (theme) => {
  test("the open dialog passes axe", async () => {
    setPageTheme(theme);
    await openWithoutMotion(<Example />);

    const results = await axe(document.body);

    expect(results).toHaveNoViolations();
    const contrast = results.passes.find(
      (rule) => rule.id === "color-contrast",
    );
    // Title, description and the two footer buttons.
    expect(contrast?.nodes.length).toBeGreaterThanOrEqual(4);
  });

  test("a dialog whose body scrolls passes axe", async () => {
    setPageTheme(theme);
    await openWithoutMotion(<Parts />);
    await expect.poll(() => body().tabIndex).toBe(0);

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
