import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { setPageTheme, themes } from "@nuvui/tooling/test/themed";
import { createRef, type ReactNode, type RefAttributes, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../button";
import {
  AlertDialog,
  AlertDialogAction,
  type AlertDialogActionProps,
  AlertDialogCancel,
  AlertDialogContent,
  type AlertDialogContentProps,
  AlertDialogDescription,
  AlertDialogFooter,
  type AlertDialogProps,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";

function Example({
  content,
  action,
  ...props
}: AlertDialogProps & {
  content?: AlertDialogContentProps & RefAttributes<HTMLDivElement>;
  action?: AlertDialogActionProps;
}) {
  return (
    <AlertDialog {...props}>
      <AlertDialogTrigger asChild>
        <Button intent="danger">Delete project</Button>
      </AlertDialogTrigger>
      <AlertDialogContent {...content}>
        <AlertDialogTitle>Delete this project?</AlertDialogTitle>
        <AlertDialogDescription>
          Its 12 files will be removed. This can't be undone.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction intent="danger" {...action}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const trigger = () => page.getByRole("button", { name: "Delete project" });
const dialog = () =>
  page.getByRole("alertdialog", { name: "Delete this project?" });
const cancel = () => page.getByRole("button", { name: "Cancel" });
const action = () => page.getByRole("button", { name: "Delete", exact: true });

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

  test("is an alert dialog, named and described by its title and description", async () => {
    await render(<Example defaultOpen />);

    await expect.element(dialog()).toHaveAccessibleName("Delete this project?");
    await expect
      .element(dialog())
      .toHaveAccessibleDescription(
        "Its 12 files will be removed. This can't be undone.",
      );
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
    await expect.element(dialog()).toBeVisible();
    expect(dialog().element().parentElement).toBe(document.body);
    await first.unmount();

    await render(<InSection />);
    await expect.element(dialog()).toBeVisible();
    expect(dialog().element().parentElement).toBe(
      page.getByTestId("section").element(),
    );
  });

  test("turns size into a BEM modifier, keeps a className and forwards its ref", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <Example defaultOpen content={{ size: "lg", className: "mine", ref }} />,
    );

    await expect
      .element(dialog())
      .toHaveClass("nuv-alert-dialog", "nuv-alert-dialog--lg", "mine");
    expect(ref.current).toBe(dialog().element());
  });

  test("has no close button, and its title keeps no room for one", async () => {
    await render(<Example defaultOpen />);
    await expect.element(dialog()).toBeVisible();

    expect(dialog().element().querySelectorAll("button")).toHaveLength(2);
    expect(
      getComputedStyle(
        page.getByRole("heading", { name: "Delete this project?" }).element(),
      ).paddingInlineEnd,
    ).toBe("0px");
  });

  test("can be controlled", async () => {
    const onOpenChange = vi.fn();
    await render(<Example open onOpenChange={onOpenChange} />);

    await expect.element(dialog()).toBeVisible();
    await cancel().click();

    expect(onOpenChange).toHaveBeenCalledWith(false);
    // Still open, because the parent hasn't changed the prop.
    await expect.element(dialog()).toBeVisible();
  });
});

describe("the two buttons", () => {
  test("are the library's buttons, and take its props", async () => {
    await render(<Example defaultOpen action={{ size: "lg" }} />);

    await expect
      .element(cancel())
      .toHaveClass("nuv-button", "nuv-button--secondary", "nuv-button--md");
    await expect
      .element(action())
      .toHaveClass("nuv-button", "nuv-button--danger", "nuv-button--lg");
    await expect.element(action()).toHaveAttribute("type", "button");
  });

  test("the action runs its handler and closes the dialog", async () => {
    const onClick = vi.fn();
    await render(<Example defaultOpen action={{ onClick }} />);

    await action().click();

    expect(onClick).toHaveBeenCalledOnce();
    await expect.element(dialog()).not.toBeInTheDocument();
  });

  test("the action leaves the dialog open when its handler prevents the default", async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    await render(<Example defaultOpen action={{ onClick }} />);

    await action().click();

    expect(onClick).toHaveBeenCalledOnce();
    await expect.element(dialog()).toBeVisible();
  });

  test("cancel closes the dialog and returns focus to the trigger", async () => {
    await render(<Example />);
    await trigger().click();
    await expect.element(dialog()).toBeVisible();

    await cancel().click();

    await expect.element(dialog()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveFocus();
  });

  test("forward their refs, and render a child with asChild", async () => {
    const cancelRef = createRef<HTMLButtonElement>();
    const actionRef = createRef<HTMLButtonElement>();
    await render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogTitle>Leave this page?</AlertDialogTitle>
          <AlertDialogDescription>
            Your changes aren't saved.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel ref={cancelRef}>Stay</AlertDialogCancel>
            <AlertDialogAction asChild ref={actionRef}>
              <a href="#elsewhere">Leave</a>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );
    const leave = page.getByRole("link", { name: "Leave" });

    await expect
      .element(leave)
      .toHaveClass("nuv-button", "nuv-button--primary");
    expect(cancelRef.current).toBe(
      page.getByRole("button", { name: "Stay" }).element(),
    );
    expect(actionRef.current).toBe(leave.element());

    await leave.click();
    await expect.element(page.getByRole("alertdialog")).not.toBeInTheDocument();
  });
});

describe("keyboard", () => {
  test("opening moves focus to Cancel, the answer that changes nothing", async () => {
    await render(<Example />);

    await userEvent.keyboard("{Tab}");
    await expect.element(trigger()).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    await expect.element(dialog()).toBeVisible();
    await expect.element(cancel()).toHaveFocus();
  });

  test("Tab stays inside the dialog and wraps around", async () => {
    await render(<Example defaultOpen />);
    await expect.element(cancel()).toHaveFocus();

    const visited: string[] = [];
    for (let press = 0; press < 3; press += 1) {
      await userEvent.keyboard("{Tab}");
      expect(dialog().element().contains(document.activeElement)).toBe(true);
      visited.push(document.activeElement?.textContent ?? "");
    }

    expect(visited).toEqual(["Delete", "Cancel", "Delete"]);
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
  test("a click on the overlay doesn't close it", async () => {
    await setViewport("desktop");
    await openWithoutMotion(<Example />);
    const overlay = document.querySelector(".nuv-alert-dialog__overlay");
    if (!overlay) throw new Error("no overlay rendered");

    await userEvent.click(overlay, { position: { x: 8, y: 8 } });
    // Long enough for a close to have happened.
    await new Promise((resolve) => setTimeout(resolve, 200));

    await expect.element(dialog()).toBeVisible();
  });

  test("the page behind can't be reached while it's open", async () => {
    await render(<Example defaultOpen />);

    await expect.element(dialog()).toBeVisible();
    expect(trigger().query()).toBeNull();
    expect(getComputedStyle(document.body).pointerEvents).toBe("none");
  });
});

describe("layout", () => {
  test("is a full-width sheet at the bottom on a phone, with the action on top", async () => {
    await setViewport("phone");
    const panel = await openWithoutMotion(<Example />);

    const rect = panel.getBoundingClientRect();
    expect(rect.left).toBe(0);
    expect(rect.width).toBe(window.innerWidth);
    expect(rect.bottom).toBe(window.innerHeight);

    const top = (button: Element) => button.getBoundingClientRect().top;
    expect(top(action().element())).toBeLessThan(top(cancel().element()));
    expect(action().element().getBoundingClientRect().width).toBe(
      cancel().element().getBoundingClientRect().width,
    );
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

  test("on a desktop the buttons sit in a row at the end, cancel first", async () => {
    await setViewport("desktop");
    const panel = await openWithoutMotion(<Example />);
    const box = (button: Element) => button.getBoundingClientRect();

    expect(box(cancel().element()).top).toBe(box(action().element()).top);
    expect(box(cancel().element()).right).toBeLessThan(
      box(action().element()).left,
    );
    // The panel's edge, less its border and its padding.
    expect(box(action().element()).right).toBeCloseTo(box(panel).right - 25, 1);
  });

  test("component variables change the width and the padding", async () => {
    await setViewport("desktop");
    const root = document.documentElement.style;
    root.setProperty("--nuv-alert-dialog-width", "20rem");
    root.setProperty("--nuv-alert-dialog-padding", "40px");

    try {
      const panel = await openWithoutMotion(<Example />);
      expect(panel.getBoundingClientRect().width).toBe(320);
      expect(getComputedStyle(panel).paddingInlineStart).toBe("40px");
    } finally {
      root.removeProperty("--nuv-alert-dialog-width");
      root.removeProperty("--nuv-alert-dialog-padding");
    }
  });

  test("a dialog's variables don't reach it", async () => {
    await setViewport("desktop");
    document.documentElement.style.setProperty("--nuv-dialog-width", "20rem");

    try {
      const panel = await openWithoutMotion(<Example />);
      expect(panel.getBoundingClientRect().width).toBe(512);
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
      "nuv-alert-dialog-sheet-in",
    );
  });

  test("pops in on a desktop", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await setViewport("desktop");
    await render(<Example defaultOpen />);

    await expect.element(dialog()).toBeVisible();
    expect(getComputedStyle(dialog().element()).animationName).toBe(
      "nuv-alert-dialog-pop-in",
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
    const overlay = document.querySelector(".nuv-alert-dialog__overlay");
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
    // Title, description and the two buttons.
    expect(contrast?.nodes.length).toBeGreaterThanOrEqual(4);
  });
});
