import "../../styles/index.scss";
import { emulateMedia } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { ImageZoom, type ImageZoomProps } from "./image-zoom";

// A block of color in place of a picture, so nothing is fetched. It's 400
// by 200, which makes a share of the box easy to say in pixels. The words
// under it are somewhere else for the mouse to go.
function Picture(props: Partial<ImageZoomProps>) {
  return (
    <div style={{ inlineSize: 400 }}>
      <ImageZoom {...props}>
        <div
          data-testid="picture"
          style={{ blockSize: 200, backgroundColor: "rgb(40, 40, 200)" }}
        />
      </ImageZoom>
      <p>Elsewhere</p>
    </div>
  );
}

const root = () => document.querySelector(".nuv-image-zoom") as HTMLElement;
const content = () =>
  document.querySelector(".nuv-image-zoom__content") as HTMLElement;
const picture = () => page.getByTestId("picture");
const button = () => page.getByRole("button", { name: "Zoom" });
const buttonEl = () => button().element() as HTMLElement;
const style = (element: Element) => getComputedStyle(element);
const rect = (element: Element) => element.getBoundingClientRect();
const leave = () => userEvent.hover(page.getByText("Elsewhere"));
const pressed = () => buttonEl().getAttribute("aria-pressed");
// Where the zoom is centred, as a percentage of the box each way.
const centre = (axis: "x" | "y") =>
  Number.parseFloat(
    content().style.getPropertyValue(`--nuv-image-zoom-${axis}`) || "50",
  );

// Skips every transition on the page to where it ends. A transition runs
// on the page's clock, which a busy machine can hold back for longer than
// a test waits. The tests below are about where the picture ends up. How
// long it takes is tested on its own, from the duration the stylesheet
// gives it.
function ended() {
  for (const animation of document.getAnimations()) animation.finish();
}

const scaled = () => {
  ended();
  return style(content()).scale;
};

// What a finger sends, at a point in the box given in pixels from its top
// left corner. The test browser has a mouse and no finger.
function finger(type: string, at: { x: number; y: number }) {
  const box = rect(root());
  const init = {
    bubbles: true,
    button: 0,
    clientX: box.left + at.x,
    clientY: box.top + at.y,
  };
  root().dispatchEvent(
    type === "click"
      ? new MouseEvent(type, init)
      : new PointerEvent(type, { ...init, pointerId: 7, pointerType: "touch" }),
  );
}

const tap = (at: { x: number; y: number }) => {
  finger("pointerdown", at);
  finger("pointerup", at);
  finger("click", at);
};

describe("rendering", () => {
  test("it's a box around the picture, with a button in its corner", async () => {
    await render(<Picture />);

    expect(root().tagName).toBe("DIV");
    expect(root().className).toBe("nuv-image-zoom");
    expect(root().hasAttribute("role")).toBe(false);
    expect(root().hasAttribute("tabindex")).toBe(false);
    expect(root().getAttribute("data-state")).toBe("idle");
    expect(content().parentElement).toBe(root());
    expect(picture().element().parentElement).toBe(content());
    await expect.element(button()).toBeVisible();
    expect(pressed()).toBe("false");
    expect(buttonEl().parentElement).toBe(root());
    // In the corner at the end of the line and the bottom.
    expect(rect(buttonEl()).right).toBeGreaterThan(rect(root()).right - 60);
    expect(rect(buttonEl()).bottom).toBeGreaterThan(rect(root()).bottom - 60);
  });

  test("the picture gives the box its size, and isn't zoomed at first", async () => {
    await render(<Picture />);

    expect(rect(root()).width).toBe(400);
    expect(rect(root()).height).toBe(200);
    expect(scaled()).toBe("none");
    expect(centre("x")).toBe(50);
    expect(centre("y")).toBe(50);
  });

  test("an img fills the box and is cropped to it", async () => {
    await render(
      <div style={{ inlineSize: 400 }}>
        <ImageZoom style={{ "--nuv-image-zoom-ratio": "2 / 1" } as never}>
          <img alt="A chair" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />
        </ImageZoom>
      </div>,
    );
    const image = page.getByAltText("A chair").element();

    expect(rect(image).width).toBe(400);
    expect(rect(image).height).toBe(200);
    expect(style(image).objectFit).toBe("cover");
    expect(style(image).display).toBe("block");
  });

  test("the button is 36px with a mouse", async () => {
    await render(<Picture />);

    expect(rect(buttonEl()).width).toBe(36);
    expect(rect(buttonEl()).height).toBe(36);
  });
});

describe("a mouse", () => {
  test("zooms in where it rests, and out when it leaves", async () => {
    const onZoomedChange = vi.fn();
    await render(<Picture onZoomedChange={onZoomedChange} />);

    await userEvent.hover(picture(), { position: { x: 300, y: 50 } });
    expect(onZoomedChange).toHaveBeenLastCalledWith(true);
    expect(pressed()).toBe("true");
    expect(root().getAttribute("data-state")).toBe("zoomed");
    expect(root().classList.contains("nuv-image-zoom--zoomed")).toBe(true);
    expect(scaled()).toBe("2");
    expect(centre("x")).toBeCloseTo(75, 0);
    expect(centre("y")).toBeCloseTo(25, 0);

    await leave();
    expect(onZoomedChange).toHaveBeenLastCalledWith(false);
    expect(pressed()).toBe("false");
    expect(scaled()).toBe("none");
  });

  test("what's in view follows it as it moves", async () => {
    await render(<Picture />);

    await userEvent.hover(picture(), { position: { x: 40, y: 180 } });
    expect(centre("x")).toBeCloseTo(10, 0);
    expect(centre("y")).toBeCloseTo(90, 0);

    await userEvent.hover(picture(), { position: { x: 200, y: 100 } });
    expect(centre("x")).toBeCloseTo(50, 0);
    expect(centre("y")).toBeCloseTo(50, 0);
  });

  test("the point under it stays under it", async () => {
    await render(<Picture />);

    await userEvent.hover(picture(), { position: { x: 300, y: 50 } });
    ended();
    const box = rect(root());
    // A quarter of the way down and three across is still where the mouse
    // is: the picture grows from there.
    const drawn = rect(picture().element());
    expect(drawn.width).toBeCloseTo(800, 0);
    expect(drawn.left + drawn.width * 0.75).toBeCloseTo(box.left + 300, 0);
    expect(drawn.top + drawn.height * 0.25).toBeCloseTo(box.top + 50, 0);
  });

  test("a click zooms out while it rests there, and in again", async () => {
    await render(<Picture />);

    await userEvent.hover(picture(), { position: { x: 100, y: 100 } });
    expect(pressed()).toBe("true");
    await userEvent.click(picture(), { position: { x: 100, y: 100 } });
    expect(pressed()).toBe("false");
    await userEvent.click(picture(), { position: { x: 100, y: 100 } });
    expect(pressed()).toBe("true");
  });

  test("zoomed out by a click, moving about doesn't zoom it in again until the mouse has left", async () => {
    await render(<Picture />);

    await userEvent.hover(picture(), { position: { x: 100, y: 100 } });
    await userEvent.click(picture(), { position: { x: 100, y: 100 } });
    expect(pressed()).toBe("false");
    await userEvent.hover(picture(), { position: { x: 300, y: 150 } });
    expect(pressed()).toBe("false");

    await leave();
    await userEvent.hover(picture(), { position: { x: 300, y: 150 } });
    expect(pressed()).toBe("true");
  });

  test("resting on the button doesn't zoom, and a click on it does", async () => {
    await render(<Picture />);

    await userEvent.hover(button());
    expect(pressed()).toBe("false");
    await userEvent.click(button());
    expect(pressed()).toBe("true");
    await userEvent.click(button());
    expect(pressed()).toBe("false");
    // Off the button and onto the picture, it stays as it was asked to.
    await userEvent.hover(picture(), { position: { x: 100, y: 100 } });
    expect(pressed()).toBe("false");
  });

  test("the cursor says which a click does", async () => {
    await render(<Picture hover={false} />);

    expect(style(root()).cursor).toBe("zoom-in");
    await userEvent.click(picture());
    expect(style(root()).cursor).toBe("zoom-out");
  });

  test("hover={false}: resting doesn't zoom, and a click zooms in where it is", async () => {
    await render(<Picture hover={false} />);

    await userEvent.hover(picture(), { position: { x: 100, y: 150 } });
    expect(pressed()).toBe("false");

    await userEvent.click(picture(), { position: { x: 100, y: 150 } });
    expect(pressed()).toBe("true");
    expect(centre("x")).toBeCloseTo(25, 0);
    expect(centre("y")).toBeCloseTo(75, 0);
  });

  test("hover={false}: zoomed in, it stays zoomed when the mouse leaves", async () => {
    await render(<Picture hover={false} />);

    await userEvent.click(picture());
    await leave();
    expect(pressed()).toBe("true");
    await userEvent.click(picture());
    expect(pressed()).toBe("false");
  });

  test("a click on the button isn't also a click on the picture", async () => {
    const onZoomedChange = vi.fn();
    await render(<Picture hover={false} onZoomedChange={onZoomedChange} />);

    await userEvent.click(button());
    expect(onZoomedChange).toHaveBeenCalledTimes(1);
    expect(pressed()).toBe("true");
  });

  test("a picture can't be picked up and dragged out of the box", async () => {
    await render(
      <ImageZoom>
        <img alt="A chair" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />
      </ImageZoom>,
    );
    const event = new DragEvent("dragstart", {
      bubbles: true,
      cancelable: true,
    });
    page.getByAltText("A chair").element().dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});

describe("a finger", () => {
  test("resting on it isn't hovering", async () => {
    await render(<Picture />);
    const box = rect(root());

    // React hears an enter from the over it sends.
    root().dispatchEvent(
      new PointerEvent("pointerover", {
        bubbles: true,
        pointerType: "touch",
        clientX: box.left + 100,
        clientY: box.top + 100,
      }),
    );
    expect(pressed()).toBe("false");
  });

  test("a tap zooms in where it is, and another zooms out", async () => {
    await render(<Picture />);

    tap({ x: 100, y: 50 });
    await expect.poll(pressed).toBe("true");
    expect(centre("x")).toBeCloseTo(25, 0);
    expect(centre("y")).toBeCloseTo(25, 0);

    tap({ x: 300, y: 150 });
    await expect.poll(pressed).toBe("false");
  });

  test("zoomed in, a drag moves the picture with the finger, and doesn't zoom out", async () => {
    await render(<Picture defaultZoomed />);

    finger("pointerdown", { x: 200, y: 100 });
    finger("pointermove", { x: 220, y: 100 });
    finger("pointermove", { x: 240, y: 120 });
    finger("pointerup", { x: 240, y: 120 });
    finger("click", { x: 240, y: 120 });

    // Forty pixels right of 400, at twice the size, is ten percent the
    // other way. Twenty down of 200 is ten percent up.
    expect(centre("x")).toBeCloseTo(40, 1);
    expect(centre("y")).toBeCloseTo(40, 1);
    expect(pressed()).toBe("true");
  });

  test("a drag stops at the edges of the picture", async () => {
    await render(<Picture defaultZoomed />);

    finger("pointerdown", { x: 200, y: 100 });
    finger("pointermove", { x: 600, y: -300 });
    finger("pointerup", { x: 600, y: -300 });

    expect(centre("x")).toBe(0);
    expect(centre("y")).toBe(100);
  });

  test("a finger that moves a little has still tapped", async () => {
    await render(<Picture defaultZoomed />);

    finger("pointerdown", { x: 200, y: 100 });
    finger("pointermove", { x: 203, y: 102 });
    finger("pointerup", { x: 203, y: 102 });
    finger("click", { x: 203, y: 102 });

    await expect.poll(pressed).toBe("false");
    expect(centre("x")).toBe(50);
  });

  test("the page scrolls across it until it's zoomed in, and then a drag is the picture's", async () => {
    await render(<Picture />);
    expect(style(root()).touchAction).toBe("manipulation");

    tap({ x: 200, y: 100 });
    await expect.poll(() => style(root()).touchAction).toBe("none");
  });
});

describe("the keyboard", () => {
  test("Tab reaches the button, and Enter and Space zoom in and out", async () => {
    await render(<Picture />);

    await userEvent.tab();
    await expect.element(button()).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(pressed()).toBe("true");
    expect(scaled()).toBe("2");
    await userEvent.keyboard(" ");
    expect(pressed()).toBe("false");
  });

  test("zoomed in, the arrows move what's in view the way they point", async () => {
    await render(<Picture defaultZoomed />);
    buttonEl().focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(centre("x")).toBe(60);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(centre("y")).toBe(70);
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(centre("x")).toBe(40);
    await userEvent.keyboard("{ArrowUp}");
    expect(centre("y")).toBe(60);
  });

  test("they stop at the edges", async () => {
    await render(<Picture defaultZoomed />);
    buttonEl().focus();

    await userEvent.keyboard(
      "{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}",
    );
    expect(centre("x")).toBe(0);
  });

  test("step sets how far a key moves it", async () => {
    await render(<Picture defaultZoomed step={25} />);
    buttonEl().focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(centre("x")).toBe(75);
  });

  test("on a right-to-left page the arrows still point where they point", async () => {
    await render(
      <div dir="rtl">
        <Picture defaultZoomed />
      </div>,
    );
    buttonEl().focus();

    await userEvent.keyboard("{ArrowLeft}");
    expect(centre("x")).toBe(40);
    // And the button is in the corner at the end of the line, the left.
    expect(rect(buttonEl()).left).toBeLessThan(rect(root()).left + 60);
  });

  test("Escape zooms out", async () => {
    await render(<Picture defaultZoomed />);
    buttonEl().focus();

    await userEvent.keyboard("{Escape}");
    expect(pressed()).toBe("false");
  });

  test("zoomed out, the arrows and Escape are left to the page", async () => {
    await render(<Picture />);
    buttonEl().focus();
    const seen = vi.fn();
    buttonEl().addEventListener("keydown", (event) =>
      seen(event.key, event.defaultPrevented),
    );

    await userEvent.keyboard("{ArrowRight}");
    expect(seen).toHaveBeenLastCalledWith("ArrowRight", false);
    await userEvent.keyboard("{Escape}");
    expect(seen).toHaveBeenLastCalledWith("Escape", false);
    expect(centre("x")).toBe(50);
  });

  test("the button has a ring when it has keyboard focus", async () => {
    await render(<Picture />);
    await userEvent.tab();

    expect(style(buttonEl()).outlineStyle).toBe("solid");
  });
});

describe("controlled", () => {
  test("follows zoomed, and asks for a change rather than making it", async () => {
    const onZoomedChange = vi.fn();
    await render(
      <Picture hover={false} zoomed onZoomedChange={onZoomedChange} />,
    );

    await userEvent.click(button());
    expect(onZoomedChange).toHaveBeenCalledWith(false);
    expect(pressed()).toBe("true");
  });

  test("zooms when what it's given does", async () => {
    function Controlled() {
      const [zoomed, setZoomed] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setZoomed(true)}>
            Look closer
          </button>
          <Picture zoomed={zoomed} onZoomedChange={setZoomed} />
        </>
      );
    }
    await render(<Controlled />);

    await userEvent.click(page.getByRole("button", { name: "Look closer" }));
    expect(pressed()).toBe("true");
    expect(scaled()).toBe("2");
  });
});

describe("options", () => {
  test("scale sets how much larger it's drawn", async () => {
    await render(<Picture defaultZoomed scale={3} />);

    expect(scaled()).toBe("3");
    expect(rect(picture().element()).width).toBeCloseTo(1200, 0);
  });

  test("disabled: no button, and nothing zooms it", async () => {
    const onZoomedChange = vi.fn();
    await render(<Picture disabled onZoomedChange={onZoomedChange} />);

    expect(page.getByRole("button").elements()).toHaveLength(0);
    expect(root().getAttribute("data-disabled")).toBe("");
    expect(style(root()).cursor).toBe("auto");
    await userEvent.hover(picture());
    await userEvent.click(picture());
    tap({ x: 100, y: 100 });
    expect(onZoomedChange).not.toHaveBeenCalled();
    expect(scaled()).toBe("none");
  });

  test("disabled wins over zoomed", async () => {
    await render(<Picture disabled zoomed />);

    expect(root().getAttribute("data-state")).toBe("idle");
    expect(scaled()).toBe("none");
  });

  test("zoomLabel names the button", async () => {
    await render(<Picture zoomLabel="Vergrößern" />);

    await expect
      .element(page.getByRole("button", { name: "Vergrößern" }))
      .toBeVisible();
  });
});

describe("motion", () => {
  test("the size eases in and out, unless less motion was asked for", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Picture />);
    expect(style(content()).transitionProperty).toBe("scale");
    expect(style(content()).transitionDuration).not.toBe("0s");

    await emulateMedia({ reducedMotion: "reduce" });
    expect(style(content()).transitionDuration).toBe("0s");
  });
});

describe("the element", () => {
  test("passes the ref, class and other props to the root", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <ImageZoom ref={ref} className="mine" id="chair">
        Chair
      </ImageZoom>,
    );

    expect(ref.current).toBe(root());
    expect(root().className).toBe("nuv-image-zoom mine");
    expect(root().id).toBe("chair");
  });

  test("its own onClick is called, and can stop the zoom", async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    await render(<Picture hover={false} onClick={onClick} />);

    await userEvent.click(picture());
    expect(onClick).toHaveBeenCalled();
    expect(pressed()).toBe("false");
  });

  test("component variables change the look", async () => {
    await render(
      <Picture
        style={
          {
            "--nuv-image-zoom-radius": "0px",
            "--nuv-image-zoom-ratio": "4 / 1",
            "--nuv-image-zoom-button-bg": "rgb(1, 2, 3)",
            "--nuv-image-zoom-button-fg": "rgb(250, 240, 230)",
            "--nuv-image-zoom-button-inset": "0px",
          } as never
        }
      />,
    );

    expect(style(root()).borderRadius).toBe("0px");
    expect(rect(root()).height).toBe(100);
    expect(style(buttonEl()).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(style(buttonEl()).color).toBe("rgb(250, 240, 230)");
    expect(rect(buttonEl()).right).toBe(rect(root()).right);
  });

  test("the page from the server has the picture and the button, not zoomed", () => {
    const html = renderToString(
      <ImageZoom defaultZoomed={false}>
        <img src="/chair.jpg" alt="A chair in oak" />
      </ImageZoom>,
    );

    expect(html).toContain("A chair in oak");
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('aria-label="Zoom"');
    expect(html).not.toContain("style=");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, zoomed in and out", async () => {
    const screen = await renderThemed(
      theme,
      <>
        <ImageZoom>
          <img alt="A chair" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />
        </ImageZoom>
        <ImageZoom defaultZoomed zoomLabel="Zoom the table">
          <img alt="A table" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />
        </ImageZoom>
      </>,
    );

    await expectNoViolations(screen.container);
  });
});
