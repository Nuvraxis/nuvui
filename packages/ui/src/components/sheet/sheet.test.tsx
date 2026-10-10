import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { contrast as ratio } from "@nuvui/tooling/test/contrast";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { setPageTheme, themes } from "@nuvui/tooling/test/themed";
import {
  Component,
  createRef,
  type ReactNode,
  type RefAttributes,
  useState,
} from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../button";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  type SheetContentProps,
  SheetDescription,
  SheetFooter,
  SheetHandle,
  SheetHeader,
  type SheetProps,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

// `lines` is how much text the body holds, and `field` puts a control in it.
function Example({
  content,
  lines = 2,
  field = false,
  ...props
}: SheetProps & {
  content?: SheetContentProps & RefAttributes<HTMLDivElement>;
  lines?: number;
  field?: boolean;
}) {
  return (
    <Sheet {...props}>
      <SheetTrigger asChild>
        <Button>Filters</Button>
      </SheetTrigger>
      <SheetContent {...content}>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow down the list of orders.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          {field ? <input aria-label="Customer" /> : null}
          {Array.from({ length: lines }, (_, line) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static filler text
            <p key={line}>Line {line}</p>
          ))}
        </SheetBody>
        <SheetFooter>
          <SheetClose asChild>
            <Button intent="secondary">Cancel</Button>
          </SheetClose>
          <Button>Apply</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const trigger = () => page.getByRole("button", { name: "Filters" });
const sheet = () => page.getByRole("dialog", { name: "Filters" });
const close = () => page.getByRole("button", { name: "Close", exact: true });
const body = () => document.querySelector(".nuv-sheet__body") as HTMLElement;
const rect = (element: Element) => element.getBoundingClientRect();

// The panel slides in, which would make measurements depend on timing.
async function openWithoutMotion(node: ReactNode) {
  await emulateMedia({ reducedMotion: "reduce" });
  await render(node);
  await trigger().click();
  await expect.element(sheet()).toBeVisible();
  return sheet().element();
}

// The sheet renders at the end of <body>, so its direction is the page's.
afterEach(() => {
  document.documentElement.removeAttribute("dir");
});

describe("rendering", () => {
  test("is closed until the trigger is pressed", async () => {
    await render(<Example />);

    await expect.element(sheet()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveAttribute("aria-haspopup", "dialog");
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "false");

    const button = trigger().element();
    await trigger().click();

    await expect.element(sheet()).toBeVisible();
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  test("is a dialog, named and described by its title and description", async () => {
    await render(<Example defaultOpen />);

    await expect.element(sheet()).toHaveAccessibleName("Filters");
    await expect
      .element(sheet())
      .toHaveAccessibleDescription("Narrow down the list of orders.");
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
    await expect.element(sheet()).toBeVisible();
    expect(sheet().element().parentElement).toBe(document.body);
    await first.unmount();

    await render(<InSection />);
    await expect.element(sheet()).toBeVisible();
    expect(sheet().element().parentElement).toBe(
      page.getByTestId("section").element(),
    );
  });

  test("turns side and size into BEM modifiers, keeps a className and forwards its ref", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <Example
        defaultOpen
        content={{ side: "start", size: "lg", className: "mine", ref }}
      />,
    );

    await expect
      .element(sheet())
      .toHaveClass("nuv-sheet", "nuv-sheet--start", "nuv-sheet--lg", "mine");
    expect(ref.current).toBe(sheet().element());
  });

  test("the parts forward their refs and keep a className", async () => {
    const header = createRef<HTMLDivElement>();
    const main = createRef<HTMLDivElement>();
    const footer = createRef<HTMLDivElement>();
    await render(
      <Sheet defaultOpen>
        <SheetContent aria-describedby={undefined}>
          <SheetHeader ref={header} className="mine">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <SheetBody ref={main} className="mine">
            Text
          </SheetBody>
          <SheetFooter ref={footer} className="mine" />
        </SheetContent>
      </Sheet>,
    );

    await expect.element(sheet()).toBeVisible();
    expect(header.current?.className).toBe("nuv-sheet__header mine");
    expect(main.current?.className).toBe("nuv-sheet__body mine");
    expect(footer.current?.className).toBe("nuv-sheet__footer mine");
  });

  test("can be controlled", async () => {
    const onOpenChange = vi.fn();
    await render(<Example open onOpenChange={onOpenChange} />);

    await expect.element(sheet()).toBeVisible();
    await userEvent.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
    await expect.element(sheet()).toBeVisible();
  });
});

describe("close button", () => {
  test("closes the sheet and returns focus to the trigger", async () => {
    await render(<Example />);
    await trigger().click();

    await close().click();

    await expect.element(sheet()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveFocus();
  });

  test("takes a translated label", async () => {
    await render(<Example defaultOpen content={{ closeLabel: "Schließen" }} />);

    await expect
      .element(page.getByRole("button", { name: "Schließen" }))
      .toBeVisible();
  });

  test("can be left out", async () => {
    await render(<Example defaultOpen content={{ showCloseButton: false }} />);

    await expect.element(sheet()).toBeVisible();
    await expect.element(close()).not.toBeInTheDocument();
  });

  test("is 32px with a mouse, in the corner at the end of the title", async () => {
    await setViewport("desktop");
    const panel = await openWithoutMotion(<Example />);
    const button = rect(close().element());

    expect(button.width).toBe(32);
    expect(button.height).toBe(32);
    // 8px in from the panel's edge, inside its 1px border.
    expect(rect(panel).right - button.right).toBe(9);
  });
});

describe("keyboard", () => {
  test("Enter on the trigger opens it and moves focus inside", async () => {
    await render(<Example />);

    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");

    await expect.element(sheet()).toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Cancel" }))
      .toHaveFocus();
  });

  test("Tab stays inside the sheet and wraps around", async () => {
    await render(<Example defaultOpen />);
    await expect
      .element(page.getByRole("button", { name: "Cancel" }))
      .toHaveFocus();

    const visited: string[] = [];
    for (let press = 0; press < 4; press += 1) {
      await userEvent.keyboard("{Tab}");
      expect(sheet().element().contains(document.activeElement)).toBe(true);
      visited.push(document.activeElement?.textContent || "close");
    }

    expect(visited).toEqual(["Apply", "close", "Cancel", "Apply"]);
  });

  test("Escape closes it and returns focus to the trigger", async () => {
    await render(<Example />);
    await trigger().click();
    await expect.element(sheet()).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.element(sheet()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveFocus();
  });
});

describe("pointer", () => {
  test("a click on the overlay closes it", async () => {
    await setViewport("desktop");
    await openWithoutMotion(<Example />);
    const overlay = document.querySelector(".nuv-sheet__overlay");
    if (!overlay) throw new Error("no overlay rendered");

    await userEvent.click(overlay, { position: { x: 8, y: 8 } });

    await expect.element(sheet()).not.toBeInTheDocument();
  });

  test("the page behind can't be reached while it's open", async () => {
    await render(<Example defaultOpen />);

    await expect.element(sheet()).toBeVisible();
    expect(trigger().query()).toBeNull();
    expect(getComputedStyle(document.body).pointerEvents).toBe("none");
  });
});

describe("sides", () => {
  test("by default it's on the end edge, as tall as the screen", async () => {
    await setViewport("desktop");
    const panel = rect(await openWithoutMotion(<Example />));

    expect(panel.right).toBe(window.innerWidth);
    expect(panel.top).toBe(0);
    expect(panel.height).toBe(window.innerHeight);
    expect(panel.width).toBe(384);
  });

  test("start puts it on the other edge", async () => {
    await setViewport("desktop");
    const panel = rect(
      await openWithoutMotion(<Example content={{ side: "start" }} />),
    );

    expect(panel.left).toBe(0);
    expect(panel.height).toBe(window.innerHeight);
    expect(panel.width).toBe(384);
  });

  test("in a right-to-left page, start and end swap", async () => {
    document.documentElement.dir = "rtl";
    await setViewport("desktop");
    const first = await render(<Example content={{ side: "end" }} />);
    await emulateMedia({ reducedMotion: "reduce" });
    await trigger().click();
    await expect.element(sheet()).toBeVisible();
    expect(rect(sheet().element()).left).toBe(0);
    // The close button is at the end of the title, which is now the left.
    expect(rect(close().element()).left - rect(sheet().element()).left).toBe(9);
    await first.unmount();

    await render(<Example defaultOpen content={{ side: "start" }} />);
    await expect.element(sheet()).toBeVisible();
    expect(rect(sheet().element()).right).toBe(window.innerWidth);
  });

  test.each(["top", "bottom"] as const)(
    "%s is as wide as the screen and as tall as its content",
    async (side) => {
      await setViewport("desktop");
      const panel = rect(
        await openWithoutMotion(<Example content={{ side }} />),
      );

      expect(panel.left).toBe(0);
      expect(panel.width).toBe(window.innerWidth);
      expect(panel.height).toBeLessThan(400);
      if (side === "top") expect(panel.top).toBe(0);
      else expect(panel.bottom).toBe(window.innerHeight);
    },
  );

  test.each(["top", "bottom"] as const)(
    "a long one on the %s leaves some of the page showing, and scrolls",
    async (side) => {
      await setViewport("phone");
      const panel = await openWithoutMotion(
        <Example lines={80} content={{ side }} />,
      );

      // 48px of the page is left to tap on.
      expect(rect(panel).height).toBe(window.innerHeight - 48);
      expect(panel.scrollHeight).toBe(panel.clientHeight);
      expect(body().scrollHeight).toBeGreaterThan(body().clientHeight);
    },
  );
});

describe("sizes", () => {
  test.each([
    ["sm", 320],
    ["md", 384],
    ["lg", 640],
  ] as const)("size %s is %ipx wide on a desktop", async (size, width) => {
    await setViewport("desktop");
    const panel = await openWithoutMotion(<Example content={{ size }} />);

    expect(rect(panel).width).toBe(width);
  });

  test.each(["sm", "md", "lg"] as const)(
    "on a phone, size %s leaves a strip of the page to tap on",
    async (size) => {
      await setViewport("phone");
      const panel = rect(
        await openWithoutMotion(<Example content={{ size }} />),
      );

      expect(panel.width).toBeLessThanOrEqual(window.innerWidth - 48);
      expect(panel.right).toBe(window.innerWidth);
      expect(document.documentElement.scrollWidth).toBe(
        document.documentElement.clientWidth,
      );
    },
  );

  test("size doesn't change a sheet on the top edge", async () => {
    await setViewport("desktop");
    const panel = await openWithoutMotion(
      <Example content={{ side: "top", size: "sm" }} />,
    );

    expect(rect(panel).width).toBe(window.innerWidth);
  });

  test("component variables change the width and the padding", async () => {
    await setViewport("desktop");
    const root = document.documentElement.style;
    root.setProperty("--nuv-sheet-width", "30rem");
    root.setProperty("--nuv-sheet-padding", "40px");

    try {
      const panel = await openWithoutMotion(<Example />);
      expect(rect(panel).width).toBe(480);
      expect(getComputedStyle(panel).paddingInlineStart).toBe("40px");
      expect(getComputedStyle(panel).paddingBlockStart).toBe("40px");
    } finally {
      root.removeProperty("--nuv-sheet-width");
      root.removeProperty("--nuv-sheet-padding");
    }
  });
});

describe("header, body and footer", () => {
  test.each(["phone", "desktop"] as const)(
    "on a %s the body scrolls and the panel doesn't",
    async (viewport) => {
      await setViewport(viewport);
      const panel = await openWithoutMotion(<Example lines={80} />);

      expect(panel.scrollHeight).toBe(panel.clientHeight);
      expect(body().scrollHeight).toBeGreaterThan(body().clientHeight);
    },
  );

  test("the title and the buttons stay put while the body scrolls", async () => {
    await setViewport("desktop");
    await openWithoutMotion(<Example lines={80} />);
    const tops = () =>
      [
        page.getByRole("heading", { name: "Filters" }),
        page.getByRole("button", { name: "Apply" }),
      ].map((part) => rect(part.element()).top);
    const before = tops();

    body().scrollTop = body().scrollHeight;

    expect(body().scrollTop).toBeGreaterThan(0);
    expect(tops()).toEqual(before);
  });

  test("the footer sits at the bottom, however little the sheet holds", async () => {
    await setViewport("desktop");
    const panel = await openWithoutMotion(<Example lines={1} />);

    // The panel's edge, less its border and its padding.
    expect(
      rect(page.getByRole("button", { name: "Apply" }).element()).bottom,
    ).toBe(rect(panel).bottom - 25);
  });

  test("it's at the bottom without a body too", async () => {
    await setViewport("desktop");
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow down the list of orders.</SheetDescription>
          <SheetFooter>
            <Button>Apply</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>,
    );
    await expect.element(sheet()).toBeVisible();

    expect(
      rect(page.getByRole("button", { name: "Apply" }).element()).bottom,
    ).toBe(rect(sheet().element()).bottom - 25);
  });

  test("the scrollbar sits on the panel's edge, and the text lines up with the title", async () => {
    await setViewport("desktop");
    const panel = await openWithoutMotion(<Example lines={80} />);

    expect(rect(body()).width).toBe(panel.clientWidth);
    expect(rect(body().querySelector("p") as Element).left).toBe(
      rect(page.getByRole("heading", { name: "Filters" }).element()).left,
    );
  });

  test("on a phone the buttons are stacked, main action on top", async () => {
    await setViewport("phone");
    await openWithoutMotion(<Example />);
    const apply = rect(page.getByRole("button", { name: "Apply" }).element());
    const cancel = rect(page.getByRole("button", { name: "Cancel" }).element());

    expect(apply.bottom).toBeLessThanOrEqual(cancel.top);
    expect(apply.width).toBe(cancel.width);
  });
});

// Someone who doesn't use a mouse scrolls with the arrow keys, and those go
// to whatever has focus. A body with only text in it has nothing to focus.
describe("scrolling the body from the keyboard", () => {
  test("a body of text that scrolls becomes a tab stop with the sheet's name", async () => {
    await openWithoutMotion(<Example lines={80} />);

    await expect.poll(() => body().tabIndex).toBe(0);
    await expect
      .element(page.getByRole("group", { name: "Filters" }))
      .toBeInTheDocument();

    body().focus();
    await userEvent.keyboard("{PageDown}");
    await expect.poll(() => body().scrollTop).toBeGreaterThan(0);
  });

  test("a body that fits, or one with a control in it, is left alone", async () => {
    const first = await render(<Example defaultOpen />);
    await expect.element(sheet()).toBeVisible();
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(body().hasAttribute("tabindex")).toBe(false);
    await first.unmount();

    await render(<Example defaultOpen lines={80} field />);
    await expect.element(sheet()).toBeVisible();
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(body().scrollHeight).toBeGreaterThan(body().clientHeight);
    expect(body().hasAttribute("tabindex")).toBe(false);
  });
});

describe("motion", () => {
  test.each([
    ["end", "ltr", "nuv-sheet-right-in"],
    ["start", "ltr", "nuv-sheet-left-in"],
    ["end", "rtl", "nuv-sheet-left-in"],
    ["start", "rtl", "nuv-sheet-right-in"],
    ["top", "ltr", "nuv-sheet-top-in"],
    ["bottom", "ltr", "nuv-sheet-bottom-in"],
  ] as const)(
    "a sheet on the %s edge of a %s page slides in from that edge",
    async (side, dir, animation) => {
      document.documentElement.dir = dir;
      await emulateMedia({ reducedMotion: "no-preference" });
      await render(<Example defaultOpen content={{ side }} />);

      await expect.element(sheet()).toBeVisible();
      expect(getComputedStyle(sheet().element()).animationName).toBe(animation);
    },
  );

  test("still closes after its exit animation", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Example defaultOpen />);
    await expect.element(sheet()).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.element(sheet()).not.toBeInTheDocument();
  });

  test("doesn't animate when reduced motion is on", async () => {
    const panel = await openWithoutMotion(<Example />);
    const overlay = document.querySelector(".nuv-sheet__overlay");
    if (!overlay) throw new Error("no overlay rendered");

    expect(getComputedStyle(panel).animationName).toBe("none");
    expect(getComputedStyle(overlay).animationName).toBe("none");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("the open sheet passes axe", async () => {
    setPageTheme(theme);
    await openWithoutMotion(<Example />);

    const results = await axe(document.body);

    expect(results).toHaveNoViolations();
    const contrast = results.passes.find(
      (rule) => rule.id === "color-contrast",
    );
    // Title, description, the body's text and the two footer buttons.
    expect(contrast?.nodes.length).toBeGreaterThanOrEqual(5);
  });

  test("a sheet whose body scrolls passes axe", async () => {
    setPageTheme(theme);
    await openWithoutMotion(<Example lines={80} />);
    await expect.poll(() => body().tabIndex).toBe(0);

    expect(await axe(document.body)).toHaveNoViolations();
  });
});

// A sheet with a handle at its top, for dragging.
function Drawer({
  content,
  handle = true,
  ...props
}: SheetProps & {
  content?: SheetContentProps & RefAttributes<HTMLDivElement>;
  handle?: boolean | string;
}) {
  return (
    <Sheet {...props}>
      <SheetTrigger asChild>
        <Button>Filters</Button>
      </SheetTrigger>
      <SheetContent side="bottom" {...content}>
        {handle ? (
          <SheetHandle
            label={typeof handle === "string" ? handle : undefined}
          />
        ) : null}
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow down the list of orders.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <p>Line one</p>
          <p>Line two</p>
        </SheetBody>
        <SheetFooter>
          <Button>Apply</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

// What a finger sends, to the element it's on.
const touch = (
  target: Element,
  type: string,
  x: number,
  y: number,
  pointerType = "touch",
) =>
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      button: 0,
      pointerId: 7,
      pointerType,
      clientX: x,
      clientY: y,
    }),
  );

// Presses, drags by this much and holds still there, so that letting go
// isn't a flick. What's returned lets go.
async function dragBy(
  target: Element,
  dx: number,
  dy: number,
  pointerType = "touch",
) {
  const x = 100;
  const y = 100;
  touch(target, "pointerdown", x, y, pointerType);
  touch(target, "pointermove", x + dx / 2, y + dy / 2, pointerType);
  touch(target, "pointermove", x + dx, y + dy, pointerType);
  await wait(40);
  touch(target, "pointermove", x + dx, y + dy, pointerType);
  return (type = "pointerup") =>
    touch(target, type, x + dx, y + dy, pointerType);
}

const title = () => page.getByText("Filters", { exact: true }).last().element();
const handle = (name = "Change size") =>
  page.getByRole("button", { name, exact: true });
const height = (element: Element) => Math.round(rect(element).height);
const share = (stop: number) => Math.round(stop * window.innerHeight);

describe("swiping it away", () => {
  test("a sheet can't be dragged unless it's told it can", async () => {
    const panel = await openWithoutMotion(<Drawer handle={false} />);

    const letGo = await dragBy(title(), 0, 600);

    expect(panel.className).toBe("nuv-sheet nuv-sheet--bottom nuv-sheet--md");
    expect((panel as HTMLElement).style.transform).toBe("");
    letGo();
    await wait(50);
    await expect.element(sheet()).toBeVisible();
  });

  test("it follows the finger towards its edge, and comes back when let go of early", async () => {
    const panel = (await openWithoutMotion(
      <Drawer content={{ swipe: true }} />,
    )) as HTMLElement;
    expect(panel.classList.contains("nuv-sheet--swipe")).toBe(true);

    const letGo = await dragBy(title(), 0, 40);
    expect(panel.style.transform).toBe("translateY(40px)");
    expect(panel.hasAttribute("data-dragging")).toBe(true);

    letGo();
    expect(panel.hasAttribute("data-dragging")).toBe(false);
    await expect.poll(() => panel.style.transform).toBe("");
    await expect.element(sheet()).toBeVisible();
  });

  test("let go of past halfway, it closes", async () => {
    const onOpenChange = vi.fn();
    const panel = await openWithoutMotion(
      <Drawer content={{ swipe: true }} onOpenChange={onOpenChange} />,
    );
    onOpenChange.mockClear();

    const letGo = await dragBy(title(), 0, rect(panel).height * 0.7);
    letGo();

    await expect.element(sheet()).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("a flick closes it, though it didn't go far", async () => {
    await openWithoutMotion(<Drawer content={{ swipe: true }} />);
    const target = title();

    touch(target, "pointerdown", 100, 100);
    await wait(20);
    touch(target, "pointermove", 100, 130);
    await wait(10);
    touch(target, "pointermove", 100, 190);
    touch(target, "pointerup", 100, 190);

    await expect.element(sheet()).not.toBeInTheDocument();
  });

  test("it doesn't follow the finger away from its edge", async () => {
    const panel = (await openWithoutMotion(
      <Drawer content={{ swipe: true }} />,
    )) as HTMLElement;

    const letGo = await dragBy(title(), 0, -80);

    expect(panel.style.transform).toBe("translateY(0px)");
    letGo();
    await expect.element(sheet()).toBeVisible();
  });

  test("a drag across it isn't a drag of it", async () => {
    const panel = (await openWithoutMotion(
      <Drawer content={{ swipe: true }} />,
    )) as HTMLElement;

    const letGo = await dragBy(title(), 200, 30);

    expect(panel.style.transform).toBe("");
    expect(panel.hasAttribute("data-dragging")).toBe(false);
    letGo();
  });

  test("on the end edge a finger can start in the part that scrolls up and down", async () => {
    const panel = (await openWithoutMotion(
      <Drawer content={{ side: "end", swipe: true }} handle={false} />,
    )) as HTMLElement;

    const letGo = await dragBy(page.getByText("Line one").element(), 40, 0);

    expect(panel.style.transform).toBe("translateX(40px)");
    letGo();
  });

  test("a finger in the part that scrolls scrolls it, and one on a button presses it", async () => {
    const panel = (await openWithoutMotion(
      <Drawer content={{ swipe: true }} />,
    )) as HTMLElement;

    (await dragBy(page.getByText("Line one").element(), 0, 300))();
    expect(panel.style.transform).toBe("");
    (
      await dragBy(
        page.getByRole("button", { name: "Apply" }).element(),
        0,
        300,
      )
    )();
    expect(panel.style.transform).toBe("");
    await wait(50);
    await expect.element(sheet()).toBeVisible();
  });

  test("a mouse drags it by the handle, and not by anything else", async () => {
    const panel = (await openWithoutMotion(
      <Drawer content={{ swipe: true }} />,
    )) as HTMLElement;

    (await dragBy(title(), 0, 300, "mouse"))();
    expect(panel.style.transform).toBe("");

    const letGo = await dragBy(handle("Dismiss").element(), 0, 40, "mouse");
    expect(panel.style.transform).toBe("translateY(40px)");
    letGo();
    await expect.poll(() => panel.style.transform).toBe("");
  });

  test("a press that the browser takes back leaves it open", async () => {
    const panel = (await openWithoutMotion(
      <Drawer content={{ swipe: true }} />,
    )) as HTMLElement;

    const letGo = await dragBy(title(), 0, rect(panel).height * 0.9);
    letGo("pointercancel");

    await expect.poll(() => panel.style.transform).toBe("");
    await expect.element(sheet()).toBeVisible();
  });

  test("held open by its owner, it comes back", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Drawer open content={{ swipe: true }} />);
    await expect.element(sheet()).toBeVisible();
    const panel = sheet().element() as HTMLElement;

    const letGo = await dragBy(title(), 0, rect(panel).height * 0.9);
    letGo();

    await expect.poll(() => panel.style.transform).toBe("");
    await expect.element(sheet()).toBeVisible();
  });

  test("on the end edge it's dragged to the right, and to the left where text is read from the right", async () => {
    const panel = (await openWithoutMotion(
      <Drawer content={{ side: "end", swipe: true }} handle={false} />,
    )) as HTMLElement;

    const letGo = await dragBy(title(), 40, 0);
    expect(panel.style.transform).toBe("translateX(40px)");
    letGo();
    await expect.poll(() => panel.style.transform).toBe("");
    (await dragBy(title(), 300, 0))();
    await expect.element(sheet()).not.toBeInTheDocument();
  });

  test("where text is read from the right, the end edge is on the left", async () => {
    document.documentElement.setAttribute("dir", "rtl");
    const panel = (await openWithoutMotion(
      <Drawer content={{ side: "end", swipe: true }} handle={false} />,
    )) as HTMLElement;

    const letGo = await dragBy(title(), -40, 0);
    expect(panel.style.transform).toBe("translateX(-40px)");
    letGo();
    await expect.poll(() => panel.style.transform).toBe("");
    (await dragBy(title(), 40, 0))();
    await expect.element(sheet()).toBeVisible();
  });

  test("a sheet that's dragged up and down leaves scrolling sideways to nobody, and one dragged sideways leaves up and down to the browser", async () => {
    const first = await render(
      <Drawer defaultOpen content={{ swipe: true }} />,
    );
    expect(getComputedStyle(sheet().element()).touchAction).toBe("none");
    await first.unmount();

    await render(
      <Drawer
        defaultOpen
        content={{ side: "end", swipe: true }}
        handle={false}
      />,
    );
    expect(getComputedStyle(sheet().element()).touchAction).toBe("pan-y");
  });

  test("handlers of your own still run", async () => {
    const onPointerDown = vi.fn();
    await openWithoutMotion(
      <Drawer content={{ swipe: true, onPointerDown }} />,
    );

    (await dragBy(title(), 0, 20))();

    expect(onPointerDown).toHaveBeenCalledTimes(1);
  });
});

describe("stops", () => {
  const stops = [0.4, 0.9];

  test("it opens at the smallest stop, and can be dragged", async () => {
    const panel = await openWithoutMotion(<Drawer content={{ stops }} />);

    expect(panel.classList.contains("nuv-sheet--stops")).toBe(true);
    expect(panel.classList.contains("nuv-sheet--swipe")).toBe(true);
    expect(Math.abs(height(panel) - share(0.4))).toBeLessThanOrEqual(1);
  });

  test("the order they're written in doesn't matter", async () => {
    const panel = await openWithoutMotion(
      <Drawer content={{ stops: [0.9, 0.4] }} />,
    );

    expect(Math.abs(height(panel) - share(0.4))).toBeLessThanOrEqual(1);
  });

  test("it changes size under the finger, and settles on the nearest stop", async () => {
    const onStopChange = vi.fn();
    const panel = (await openWithoutMotion(
      <Drawer content={{ stops, onStopChange }} />,
    )) as HTMLElement;
    const start = height(panel);

    const letGo = await dragBy(title(), 0, -300);
    expect(height(panel)).toBe(start + 300);
    // It grows. It isn't moved.
    expect(panel.style.transform).toBe("");

    letGo();
    await expect.poll(() => onStopChange.mock.lastCall?.[0]).toBe(0.9);
    await expect
      .poll(() => Math.abs(height(panel) - share(0.9)))
      .toBeLessThanOrEqual(1);
    // What the drag wrote on the element is gone, and the stylesheet has
    // the size.
    await expect.poll(() => panel.style.blockSize).toBe("");
    expect(panel.style.getPropertyValue("--nuv-sheet-stop")).toBe("0.9");
  });

  test("it doesn't grow past the largest stop", async () => {
    const panel = await openWithoutMotion(
      <Drawer content={{ stops, defaultStop: 0.9 }} />,
    );

    const letGo = await dragBy(title(), 0, -200);

    expect(Math.abs(height(panel) - share(0.9))).toBeLessThanOrEqual(1);
    letGo();
  });

  test("a short drag goes back to the stop it was at, and reports nothing", async () => {
    const onStopChange = vi.fn();
    const panel = await openWithoutMotion(
      <Drawer content={{ stops, defaultStop: 0.9, onStopChange }} />,
    );

    (await dragBy(title(), 0, 100))();

    await expect
      .poll(() => Math.abs(height(panel) - share(0.9)))
      .toBeLessThanOrEqual(1);
    expect(onStopChange).not.toHaveBeenCalled();
  });

  test("dragged down from the largest, it stops at the smallest before it closes", async () => {
    const onStopChange = vi.fn();
    const panel = await openWithoutMotion(
      <Drawer content={{ stops, defaultStop: 0.9, onStopChange }} />,
    );

    (await dragBy(title(), 0, share(0.9) - share(0.4) - 20))();
    await expect.poll(() => onStopChange.mock.lastCall?.[0]).toBe(0.4);
    await expect.element(sheet()).toBeVisible();
    await expect
      .poll(() => Math.abs(height(panel) - share(0.4)))
      .toBeLessThanOrEqual(1);
  });

  test("dragged well under the smallest, it closes", async () => {
    await openWithoutMotion(<Drawer content={{ stops }} />);

    (await dragBy(title(), 0, share(0.4) * 0.7))();

    await expect.element(sheet()).not.toBeInTheDocument();
  });

  test("controlled, it's at the stop it's given, and asks for a change", async () => {
    const onStopChange = vi.fn();
    const panel = await openWithoutMotion(
      <Drawer content={{ stops, stop: 0.9, onStopChange }} />,
    );
    expect(Math.abs(height(panel) - share(0.9))).toBeLessThanOrEqual(1);

    (await dragBy(title(), 0, share(0.9) - share(0.4)))();

    await expect.poll(() => onStopChange.mock.lastCall?.[0]).toBe(0.4);
    // Not given the new one, it goes back.
    await expect
      .poll(() => Math.abs(height(panel) - share(0.9)))
      .toBeLessThanOrEqual(1);
  });

  test("on the end edge a stop is a share of the width", async () => {
    const panel = await openWithoutMotion(
      <Drawer content={{ side: "end", stops: [0.5, 1] }} handle={false} />,
    );

    expect(
      Math.abs(rect(panel).width - window.innerWidth * 0.5),
    ).toBeLessThanOrEqual(1);
  });

  test("it moves between stops, and not for someone who asked for less motion", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const first = await render(<Drawer defaultOpen content={{ stops }} />);
    await expect.element(sheet()).toBeVisible();
    expect(getComputedStyle(sheet().element()).transitionProperty).toContain(
      "block-size",
    );
    await first.unmount();

    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Drawer defaultOpen content={{ stops }} />);
    await expect.element(sheet()).toBeVisible();
    expect(
      getComputedStyle(sheet().element()).transitionProperty,
    ).not.toContain("block-size");
  });
});

describe("the handle", () => {
  test("is a button that says what pressing it does", async () => {
    const first = await render(
      <Drawer defaultOpen content={{ stops: [0.4, 0.9] }} />,
    );
    await expect.element(handle("Change size")).toBeVisible();
    expect(handle("Change size").element().className).toBe("nuv-sheet__handle");
    await first.unmount();

    await render(<Drawer defaultOpen content={{ swipe: true }} />);
    await expect.element(handle("Dismiss")).toBeVisible();
  });

  test("pressing it goes to the next stop, and round to the first", async () => {
    const onStopChange = vi.fn();
    const panel = await openWithoutMotion(
      <Drawer content={{ stops: [0.3, 0.6, 0.9], onStopChange }} />,
    );

    await handle().click();
    await expect.poll(() => height(panel)).toBe(share(0.6));
    await handle().click();
    await handle().click();

    expect(onStopChange.mock.calls.map(([stop]) => stop)).toEqual([
      0.6, 0.9, 0.3,
    ]);
  });

  test("the keyboard reaches it and presses it", async () => {
    const onStopChange = vi.fn();
    await openWithoutMotion(
      <Drawer content={{ stops: [0.4, 0.9], onStopChange }} />,
    );

    (handle().element() as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");

    await expect.poll(() => onStopChange.mock.lastCall?.[0]).toBe(0.9);
  });

  test("in a sheet with no stops, pressing it closes the sheet", async () => {
    await openWithoutMotion(<Drawer content={{ swipe: true }} />);

    await handle("Dismiss").click();

    await expect.element(sheet()).not.toBeInTheDocument();
  });

  test("it closes a sheet that has no close button too", async () => {
    await openWithoutMotion(
      <Drawer content={{ swipe: true, showCloseButton: false }} />,
    );
    // The one a swipe presses is hidden from everyone.
    expect(page.getByRole("button", { name: "Close" }).elements()).toHaveLength(
      0,
    );

    await handle("Dismiss").click();

    await expect.element(sheet()).not.toBeInTheDocument();
  });

  test("the click that ends a drag of it isn't a press of it", async () => {
    const onStopChange = vi.fn();
    await openWithoutMotion(
      <Drawer content={{ stops: [0.3, 0.6, 0.9], onStopChange }} />,
    );
    const element = handle().element();

    (await dragBy(element, 0, share(0.3) - share(0.6)))();
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await wait(50);

    // To the stop it was dragged to, and no further.
    expect(onStopChange.mock.calls.map(([stop]) => stop)).toEqual([0.6]);

    // The next press is a press again.
    await handle().click();
    await expect.poll(() => onStopChange.mock.lastCall?.[0]).toBe(0.9);
  });

  test("its name can be translated", async () => {
    await render(
      <Drawer
        defaultOpen
        content={{ stops: [0.4, 0.9] }}
        handle="Größe ändern"
      />,
    );

    await expect.element(handle("Größe ändern")).toBeVisible();
  });

  test("it's a bar drawn as a border, in the middle, and answers to a press around it", async () => {
    const panel = await openWithoutMotion(<Drawer content={{ swipe: true }} />);
    const element = handle("Dismiss").element();
    const box = rect(element);
    const around = getComputedStyle(element, "::after");

    expect(getComputedStyle(element).borderTopStyle).toBe("solid");
    expect(getComputedStyle(element).borderTopWidth).toBe("4px");
    expect(box.width).toBe(40);
    expect(
      Math.abs(
        box.left + box.width / 2 - (rect(panel).left + rect(panel).width / 2),
      ),
    ).toBeLessThanOrEqual(1);
    expect(around.content).toBe('""');
    expect(Number.parseFloat(around.height)).toBeGreaterThanOrEqual(44);
  });

  test("on the end edge it stands up, on the side that faces the page", async () => {
    const panel = await openWithoutMotion(
      <Drawer content={{ side: "end", swipe: true }} />,
    );
    const box = rect(handle("Dismiss").element());

    expect(box.height).toBe(40);
    expect(box.width).toBe(4);
    expect(box.left - rect(panel).left).toBeLessThan(16);
    expect(
      Math.abs(
        box.top + box.height / 2 - (rect(panel).top + rect(panel).height / 2),
      ),
    ).toBeLessThanOrEqual(1);
  });

  test("outside a sheet it says where it belongs", async () => {
    class Boundary extends Component<
      { children: ReactNode },
      { message: string }
    > {
      override state = { message: "" };
      static getDerivedStateFromError(error: Error) {
        return { message: error.message };
      }
      override render() {
        return this.state.message ? (
          <p role="alert">{this.state.message}</p>
        ) : (
          this.props.children
        );
      }
    }
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    await render(
      <Boundary>
        <SheetHandle />
      </Boundary>,
    );

    await expect
      .poll(() => page.getByRole("alert").element().textContent)
      .toBe("SheetHandle has to be inside a SheetContent.");
    quiet.mockRestore();
  });
});

describe.each(themes)("a sheet to drag, accessibility in %s", (theme) => {
  test("passes axe, and the handle reaches 3:1 against the sheet", async () => {
    setPageTheme(theme);
    const panel = await openWithoutMotion(
      <Drawer content={{ stops: [0.5, 0.9] }} />,
    );

    expect(await axe(document.body)).toHaveNoViolations();
    expect(
      ratio(
        getComputedStyle(handle().element()).borderTopColor,
        getComputedStyle(panel).backgroundColor,
      ),
    ).toBeGreaterThanOrEqual(3);
  });
});
