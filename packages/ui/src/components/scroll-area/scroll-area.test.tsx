import "../../styles/index.scss";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { contrast } from "../../../test/contrast";
import { emulateMedia } from "../../../test/media";
import {
  expectNoViolations,
  renderThemed,
  themeAttributes,
  themes,
} from "../../../test/themed";
import { Button } from "../button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../dialog";
import { ScrollArea, type ScrollAreaProps } from "./scroll-area";

const rows = Array.from({ length: 40 }, (_, index) => `Release ${index + 1}`);

function Example(props: ScrollAreaProps) {
  return (
    <ScrollArea
      data-testid="area"
      aria-label="Releases"
      style={{ height: 200, width: 240 }}
      {...props}
    >
      {rows.map((row) => (
        <p key={row} style={{ margin: 0 }}>
          {row}
        </p>
      ))}
    </ScrollArea>
  );
}

const area = () => page.getByTestId("area").element();
const viewport = () =>
  area().querySelector(".nuv-scroll-area__viewport") as HTMLElement;
const scrollbars = () => area().querySelectorAll(".nuv-scroll-area__scrollbar");
const scrollbar = (orientation: "vertical" | "horizontal") =>
  area().querySelector(
    `.nuv-scroll-area__scrollbar[data-orientation="${orientation}"]`,
  ) as HTMLElement;
const thumb = () => area().querySelector(".nuv-scroll-area__thumb") as Element;
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);
// The scrollbar, and then its thumb, are drawn once Radix has measured the
// content.
const drawn = () => expect.poll(() => thumb()).not.toBeNull();

describe("rendering", () => {
  test("content taller than the box scrolls, with a scrollbar on the end edge", async () => {
    await render(<Example />);
    await drawn();

    expect(area().className).toBe("nuv-scroll-area");
    expect(viewport().scrollHeight).toBeGreaterThan(viewport().clientHeight);
    expect(scrollbars()).toHaveLength(1);
    expect(rect(scrollbar("vertical")).right).toBe(rect(area()).right);
    expect(rect(scrollbar("vertical")).height).toBe(200);
    expect(rect(scrollbar("vertical")).width).toBe(10);
  });

  test("the browser's own scrollbar is hidden", async () => {
    await render(<Example />);
    await drawn();

    // With it hidden, the content is as wide as the box.
    expect(viewport().clientWidth).toBe(240);
  });

  test("content that fits has no scrollbar", async () => {
    await render(
      <ScrollArea data-testid="area" style={{ height: 200 }}>
        <p>One line.</p>
      </ScrollArea>,
    );
    // Long enough for Radix to have measured and found nothing to scroll.
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(scrollbars()).toHaveLength(0);
  });

  test('type="always" draws the scrollbar even then', async () => {
    await render(
      <ScrollArea data-testid="area" type="always" style={{ height: 200 }}>
        <p>One line.</p>
      </ScrollArea>,
    );

    // The bar, with no thumb in it, because there's nothing to scroll.
    await expect.poll(() => scrollbars().length).toBe(1);
  });

  test("the thumb's length is the visible share of the content, and it moves as the content scrolls", async () => {
    await render(<Example />);
    await drawn();
    const share = viewport().clientHeight / viewport().scrollHeight;
    const before = rect(thumb()).top;

    // The bar is 200px with 2px of padding at each end.
    expect(rect(thumb()).height).toBeCloseTo(196 * share, 0);

    viewport().scrollTop = 300;

    await expect.poll(() => rect(thumb()).top).toBeGreaterThan(before);
  });

  test("a drag on the thumb scrolls the content", async () => {
    await render(<Example />);
    await drawn();

    // From the thumb, which starts at the top, to near the bottom of the bar.
    await userEvent.dragAndDrop(
      page.elementLocator(thumb()),
      page.elementLocator(scrollbar("vertical")),
      { targetPosition: { x: 5, y: 180 } },
    );

    await expect.poll(() => viewport().scrollTop).toBeGreaterThan(100);
  });

  test("viewportRef gives the element that scrolls", async () => {
    const ref = createRef<HTMLDivElement>();
    const viewportRef = createRef<HTMLDivElement>();
    await render(
      <ScrollArea
        ref={ref}
        viewportRef={viewportRef}
        className="mine"
        data-testid="area"
        style={{ height: 200 }}
      >
        <div style={{ height: 800 }}>Tall content</div>
      </ScrollArea>,
    );
    await drawn();

    expect(ref.current?.className).toBe("nuv-scroll-area mine");
    expect(viewportRef.current).toBe(viewport());

    viewportRef.current?.scrollTo({ top: 120 });
    expect(viewport().scrollTop).toBe(120);
  });

  test("nonce goes on the style element that hides the browser's scrollbar", async () => {
    await render(<Example nonce="abc123" />);
    const sheet = [...document.querySelectorAll("style")].find((element) =>
      element.textContent?.includes("data-radix-scroll-area-viewport"),
    );

    expect(sheet?.nonce).toBe("abc123");
  });
});

describe("orientation", () => {
  test("vertical wraps long lines and never scrolls sideways", async () => {
    await render(
      <ScrollArea data-testid="area" style={{ height: 100, width: 200 }}>
        <p>{"A sentence that is longer than the box is wide. ".repeat(10)}</p>
      </ScrollArea>,
    );
    await drawn();

    expect(viewport().scrollWidth).toBe(viewport().clientWidth);
    expect(scrollbars()).toHaveLength(1);
  });

  test("horizontal scrolls sideways, with the scrollbar along the bottom", async () => {
    await render(
      <ScrollArea
        data-testid="area"
        orientation="horizontal"
        style={{ width: 200 }}
      >
        <div style={{ width: 800, height: 60 }}>Wide content</div>
      </ScrollArea>,
    );
    await drawn();

    expect(scrollbars()).toHaveLength(1);
    expect(viewport().scrollWidth).toBe(800);
    expect(rect(scrollbar("horizontal")).bottom).toBe(rect(area()).bottom);
    expect(rect(scrollbar("horizontal")).width).toBe(200);
    expect(rect(scrollbar("horizontal")).height).toBe(10);
  });

  test("both scrolls each way, and the bars leave the corner free", async () => {
    await render(
      <ScrollArea
        data-testid="area"
        orientation="both"
        style={{ width: 200, height: 100 }}
      >
        <div style={{ width: 800, height: 600 }}>Big content</div>
      </ScrollArea>,
    );
    await expect.poll(() => scrollbars().length).toBe(2);

    await expect
      .poll(() => rect(scrollbar("vertical")).height)
      .toBeLessThan(100);
    expect(rect(scrollbar("horizontal")).width).toBeLessThan(200);
    expect(area().querySelector(".nuv-scroll-area__corner")).not.toBeNull();
  });

  test("the scrollbar is on the left in a right-to-left layout", async () => {
    await render(<Example dir="rtl" />);
    await drawn();

    expect(rect(scrollbar("vertical")).left).toBe(rect(area()).left);
  });
});

describe("height", () => {
  test("a maximum height lets short content stay short and tall content scroll", async () => {
    const short = await render(
      <ScrollArea data-testid="area" style={{ maxHeight: 120 }}>
        <p style={{ margin: 0, height: 40 }}>Short</p>
      </ScrollArea>,
    );
    expect(rect(area()).height).toBe(40);
    await short.unmount();

    await render(
      <ScrollArea data-testid="area" style={{ maxHeight: 120 }}>
        <p style={{ margin: 0, height: 400 }}>Tall</p>
      </ScrollArea>,
    );
    await drawn();

    expect(rect(area()).height).toBe(120);
    expect(viewport().scrollHeight).toBe(400);
  });

  test("component variables set the height and the maximum", async () => {
    await render(
      <ScrollArea
        data-testid="area"
        style={{ "--nuv-scroll-area-height": "150px" } as never}
      >
        <p style={{ margin: 0, height: 400 }}>Tall</p>
      </ScrollArea>,
    );

    expect(rect(area()).height).toBe(150);
  });
});

describe("keyboard", () => {
  test("a box that scrolls and holds nothing to focus is a tab stop with a name", async () => {
    await render(
      <>
        <Example />
        <Button>After</Button>
      </>,
    );
    await expect.poll(() => viewport().tabIndex).toBe(0);

    expect(viewport().getAttribute("role")).toBe("group");
    expect(viewport().getAttribute("aria-label")).toBe("Releases");
    // The name is on the element with the role and nowhere else.
    expect(area().getAttribute("aria-label")).toBeNull();

    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(viewport());

    await userEvent.keyboard("{Tab}");
    await expect
      .element(page.getByRole("button", { name: "After" }))
      .toHaveFocus();
  });

  test("the arrow keys scroll it once it has focus", async () => {
    await render(<Example />);
    await expect.poll(() => viewport().tabIndex).toBe(0);

    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");

    await expect.poll(() => viewport().scrollTop).toBeGreaterThan(0);
  });

  test("it has a focus ring, drawn inside the box", async () => {
    await render(<Example />);
    await expect.poll(() => viewport().tabIndex).toBe(0);

    await userEvent.keyboard("{Tab}");

    expect(style(viewport()).outlineStyle).toBe("solid");
    expect(style(viewport()).outlineOffset).toBe("-2px");
    expect(
      contrast(style(viewport()).outlineColor, "white"),
    ).toBeGreaterThanOrEqual(3);
  });

  test("aria-labelledby is passed on the same way", async () => {
    await render(
      <>
        <h2 id="heading">Releases</h2>
        <Example aria-label={undefined} aria-labelledby="heading" />
      </>,
    );
    await expect.poll(() => viewport().tabIndex).toBe(0);

    expect(viewport().getAttribute("aria-labelledby")).toBe("heading");
  });

  test("inside a dialog, with no name of its own, it takes the dialog's", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Release notes</DialogTitle>
          <DialogDescription>Everything since version 2.</DialogDescription>
          <ScrollArea data-testid="area" style={{ height: 100 }}>
            <div style={{ height: 400 }}>Tall content</div>
          </ScrollArea>
        </DialogContent>
      </Dialog>,
    );
    const inDialog = () =>
      document.querySelector(".nuv-scroll-area__viewport") as HTMLElement;
    await expect.poll(() => inDialog().tabIndex).toBe(0);

    expect(inDialog().getAttribute("aria-labelledby")).toBe(
      page.getByRole("dialog").element().getAttribute("aria-labelledby"),
    );
  });

  test("a name given to it wins over the dialog's", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Release notes</DialogTitle>
          <DialogDescription>Everything since version 2.</DialogDescription>
          <ScrollArea aria-label="Changes" style={{ height: 100 }}>
            <div style={{ height: 400 }}>Tall content</div>
          </ScrollArea>
        </DialogContent>
      </Dialog>,
    );
    const inDialog = () =>
      document.querySelector(".nuv-scroll-area__viewport") as HTMLElement;
    await expect.poll(() => inDialog().tabIndex).toBe(0);

    expect(inDialog().getAttribute("aria-label")).toBe("Changes");
    expect(inDialog().hasAttribute("aria-labelledby")).toBe(false);
  });

  test("with a button inside, the box isn't a tab stop: the button is", async () => {
    await render(
      <ScrollArea
        data-testid="area"
        aria-label="Releases"
        style={{ height: 100 }}
      >
        <div style={{ height: 400 }}>
          <Button>Inside</Button>
        </div>
      </ScrollArea>,
    );
    await drawn();

    expect(viewport().hasAttribute("tabindex")).toBe(false);
    expect(viewport().hasAttribute("role")).toBe(false);
    expect(viewport().hasAttribute("aria-label")).toBe(false);

    await userEvent.keyboard("{Tab}");
    // Firefox stops at any box that scrolls, with or without a tabindex,
    // before it goes on to what's inside.
    if (document.activeElement === viewport()) {
      await userEvent.keyboard("{Tab}");
    }
    await expect
      .element(page.getByRole("button", { name: "Inside" }))
      .toHaveFocus();
  });

  test("content that fits isn't a tab stop", async () => {
    await render(
      <ScrollArea
        data-testid="area"
        aria-label="Releases"
        style={{ height: 200 }}
      >
        <p>One line.</p>
      </ScrollArea>,
    );
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(viewport().hasAttribute("tabindex")).toBe(false);
  });
});

describe("styles", () => {
  test("the thumb is round and fills the bar's width inside its padding", async () => {
    await render(<Example />);
    await drawn();

    expect(rect(thumb()).width).toBe(6);
    expect(
      Number.parseFloat(style(thumb()).borderTopLeftRadius),
    ).toBeGreaterThan(3);
  });

  test("the thumb darkens under the pointer", async () => {
    await render(<Example />);
    await drawn();
    const resting = style(thumb()).backgroundColor;

    await userEvent.hover(thumb());

    await expect.poll(() => style(thumb()).backgroundColor).not.toBe(resting);
  });

  test("component variables change the look", async () => {
    await render(
      <Example
        style={
          {
            height: 200,
            "--nuv-scroll-area-radius": "8px",
            "--nuv-scroll-area-scrollbar-size": "16px",
            "--nuv-scroll-area-scrollbar-padding": "4px",
            "--nuv-scroll-area-thumb": "rgb(10, 20, 30)",
            "--nuv-scroll-area-thumb-hover": "rgb(40, 50, 60)",
          } as never
        }
      />,
    );
    await drawn();

    expect(style(area()).borderTopLeftRadius).toBe("8px");
    expect(rect(scrollbar("vertical")).width).toBe(16);
    expect(rect(thumb()).width).toBe(8);
    expect(style(thumb()).backgroundColor).toBe("rgb(10, 20, 30)");

    await userEvent.hover(thumb());
    await expect
      .poll(() => style(thumb()).backgroundColor)
      .toBe("rgb(40, 50, 60)");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe", async () => {
    const screen = await renderThemed(theme, <Example />);
    await drawn();
    await expect.poll(() => viewport().tabIndex).toBe(0);

    await expectNoViolations(screen.container);
  });

  test("the thumb reaches 3:1 against the page", async () => {
    await render(
      <div
        {...themeAttributes(theme)}
        data-testid="page"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <Example />
      </div>,
    );
    await drawn();

    expect(
      contrast(
        style(thumb()).backgroundColor,
        style(page.getByTestId("page").element()).backgroundColor,
      ),
    ).toBeGreaterThanOrEqual(3);
  });
});
