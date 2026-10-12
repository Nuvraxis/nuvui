import "../../styles/index.scss";
import { emulateMedia } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../button";
import { HoloCard } from "./holo-card";

const style = (element: Element) => getComputedStyle(element);
const card = () => document.querySelector(".nuv-holo-card") as HTMLElement;
const surface = () =>
  document.querySelector(".nuv-holo-card__surface") as HTMLElement;
const shine = () =>
  document.querySelector(".nuv-holo-card__shine") as HTMLElement | null;
const texture = () =>
  document.querySelector(".nuv-holo-card__texture") as HTMLElement | null;
const content = () =>
  document.querySelector(".nuv-holo-card__content") as HTMLElement;
// How far toward the viewer something has come, in pixels.
const raised = (element: Element) =>
  new DOMMatrixReadOnly(style(element).transform).m43;
const at = (name: "x" | "y") =>
  card().style.getPropertyValue(`--nuv-holo-card-pointer-${name}`);

const size = { inlineSize: 320, blockSize: 200 };

function Member(props: React.ComponentProps<typeof HoloCard>) {
  return (
    <div style={{ padding: 40 }}>
      <HoloCard style={size} {...props}>
        <p>Sajan</p>
        <button type="button">Show the number</button>
      </HoloCard>
      <button type="button">Elsewhere</button>
    </div>
  );
}

// A pointer of a chosen kind at a place in the card, from 0 to 1 each way.
// The browser's own mouse is used where a test is about a mouse. This is
// for a finger and a pen, which the test browser doesn't have.
function point(
  type: "pointermove" | "pointercancel",
  pointerType: "mouse" | "pen" | "touch",
  x = 0.5,
  y = 0.5,
) {
  const box = card().getBoundingClientRect();
  card().dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      pointerType,
      clientX: box.left + box.width * x,
      clientY: box.top + box.height * y,
    }),
  );
}

describe("rendering", () => {
  test("it's a box around a surface that holds what it's given", async () => {
    await render(<Member />);

    expect(card().tagName).toBe("DIV");
    expect(card().className).toBe("nuv-holo-card nuv-holo-card--lift");
    expect(surface().parentElement).toBe(card());
    expect(content().parentElement).toBe(surface());
    expect(content().textContent).toContain("Sajan");
    expect(card().hasAttribute("role")).toBe(false);
    expect(card().hasAttribute("tabindex")).toBe(false);
  });

  test("the shine is hidden from a screen reader, and can't be pressed", async () => {
    await render(<Member />);

    expect(shine()?.getAttribute("aria-hidden")).toBe("true");
    expect(style(shine() as HTMLElement).pointerEvents).toBe("none");
    expect(shine()?.parentElement).toBe(surface());
  });

  test("shine={false} draws none", async () => {
    await render(<Member shine={false} />);

    expect(shine()).toBeNull();
  });

  test("the texture is on the face, hidden from a screen reader, and can't be pressed", async () => {
    await render(<Member />);

    expect(texture()?.getAttribute("aria-hidden")).toBe("true");
    expect(texture()?.parentElement).toBe(surface());
    expect(style(texture() as HTMLElement).pointerEvents).toBe("none");
    expect(style(texture() as HTMLElement).backgroundImage).toContain(
      "repeating-linear-gradient",
    );
    // It's on the face: before the shine, which is drawn on top of it,
    // and both before the content, which is over them.
    expect(texture()?.nextElementSibling).toBe(shine());
    expect(shine()?.nextElementSibling).toBe(content());
  });

  test("texture={false} draws none, and leaves the shine", async () => {
    await render(<Member texture={false} />);

    expect(texture()).toBeNull();
    expect(shine()).not.toBeNull();
  });

  test("forwards its ref, a className and other props", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(<Member ref={ref} className="mine" id="pass" />);

    expect(ref.current).toBe(card());
    expect(card().className).toBe("nuv-holo-card nuv-holo-card--lift mine");
    expect(card().id).toBe("pass");
  });
});

describe("under a mouse", () => {
  test("it lies flat until the pointer is on it", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Member />);

    expect(card().hasAttribute("data-active")).toBe(false);
    expect(at("x")).toBe("");
    expect(style(shine() as HTMLElement).opacity).toBe("0");
    // Turned by nothing, which is no turn at all.
    expect(new DOMMatrixReadOnly(style(surface()).transform).isIdentity).toBe(
      true,
    );
  });

  test("it's told where the pointer is, tilts, and shines", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Member />);

    await userEvent.hover(card(), { position: { x: 80, y: 50 } });

    await expect.poll(() => card().hasAttribute("data-active")).toBe(true);
    expect(Number(at("x"))).toBeCloseTo(0.25, 1);
    expect(Number(at("y"))).toBeCloseTo(0.25, 1);
    await expect
      .poll(() => new DOMMatrixReadOnly(style(surface()).transform).is2D)
      .toBe(false);
    await expect.poll(() => style(shine() as HTMLElement).opacity).toBe("0.7");
  });

  test("it goes flat again when the pointer leaves", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Member />);
    await userEvent.hover(card(), { position: { x: 80, y: 50 } });
    await expect.poll(() => card().hasAttribute("data-active")).toBe(true);

    await userEvent.hover(page.getByRole("button", { name: "Elsewhere" }));

    await expect.poll(() => card().hasAttribute("data-active")).toBe(false);
    expect(at("x")).toBe("");
    expect(at("y")).toBe("");
    await expect
      .poll(() => new DOMMatrixReadOnly(style(surface()).transform).isIdentity)
      .toBe(true);
    await expect.poll(() => style(shine() as HTMLElement).opacity).toBe("0");
  });

  test("the corners are the ends of the range, and no further", async () => {
    await render(<Member />);

    point("pointermove", "mouse", 0, 0);
    expect(at("x")).toBe("0.000");
    expect(at("y")).toBe("0.000");

    point("pointermove", "mouse", 1.4, 1.4);
    expect(at("x")).toBe("1.000");
    expect(at("y")).toBe("1.000");
  });

  test("what's in it can still be pressed, through the shine", async () => {
    const onClick = vi.fn();
    await render(
      <HoloCard style={size}>
        <button type="button" onClick={onClick}>
          Show the number
        </button>
      </HoloCard>,
    );

    await page.getByRole("button", { name: "Show the number" }).click();

    expect(onClick).toHaveBeenCalledOnce();
  });

  test("handlers of your own are called as well", async () => {
    const onPointerMove = vi.fn();
    const onPointerLeave = vi.fn();
    await render(
      <Member onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} />,
    );

    await userEvent.hover(card(), { position: { x: 80, y: 50 } });
    await expect.poll(() => onPointerMove.mock.calls.length).toBeGreaterThan(0);
    await userEvent.hover(page.getByRole("button", { name: "Elsewhere" }));

    await expect.poll(() => onPointerLeave.mock.calls.length).toBe(1);
  });
});

describe("the content", () => {
  test("it lies on the face at rest, and rises off it under the pointer", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Member />);
    expect(raised(content())).toBe(0);
    expect(style(content()).filter).toBe("none");

    await userEvent.hover(card(), { position: { x: 80, y: 50 } });

    // A rem and a half.
    await expect.poll(() => raised(content())).toBe(24);
    await expect.poll(() => style(content()).filter).toContain("drop-shadow");

    await userEvent.hover(page.getByRole("button", { name: "Elsewhere" }));
    await expect.poll(() => raised(content())).toBe(0);
  });

  test("the face keeps the depth of what's on it, and cuts nothing off", async () => {
    await render(<Member />);

    expect(style(surface()).transformStyle).toBe("preserve-3d");
    expect(style(surface()).overflow).toBe("visible");
  });

  test("lift={false} leaves it on the face", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Member lift={false} />);
    expect(card().className).toBe("nuv-holo-card");

    await userEvent.hover(card(), { position: { x: 80, y: 50 } });
    await expect.poll(() => card().hasAttribute("data-active")).toBe(true);

    expect(raised(content())).toBe(0);
    expect(style(content()).filter).toBe("none");
  });

  test("a variable says how far it rises", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <Member style={{ ...size, "--nuv-holo-card-lift": "40px" } as never} />,
    );

    await userEvent.hover(card(), { position: { x: 80, y: 50 } });

    await expect.poll(() => raised(content())).toBe(40);
  });

  test("with less motion, and when it's disabled, it stays on the face", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const screen = await render(<Member />);
    await userEvent.hover(card(), { position: { x: 80, y: 50 } });
    await expect.poll(() => card().hasAttribute("data-active")).toBe(true);
    expect(style(content()).transform).toBe("none");

    await emulateMedia({ reducedMotion: "no-preference" });
    await screen.rerender(<Member disabled />);
    point("pointermove", "mouse", 0.25, 0.25);
    expect(raised(content())).toBe(0);
  });

  test("the face has the colors the card is given, under the content", async () => {
    await render(
      <Member
        style={
          {
            ...size,
            "--nuv-holo-card-bg": "rgb(10, 20, 30)",
            "--nuv-holo-card-fg": "rgb(200, 210, 220)",
          } as never
        }
      />,
    );

    expect(style(surface()).backgroundColor).toBe("rgb(10, 20, 30)");
    expect(style(page.getByText("Sajan").element()).color).toBe(
      "rgb(200, 210, 220)",
    );
    expect(style(content()).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  });
});

describe("the texture", () => {
  test("it's faint at rest, and shows more under the pointer", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Member />);
    expect(style(texture() as HTMLElement).opacity).toBe("0.2");

    await userEvent.hover(card(), { position: { x: 80, y: 50 } });
    await expect
      .poll(() => style(texture() as HTMLElement).opacity)
      .toBe("0.5");

    await userEvent.hover(page.getByRole("button", { name: "Elsewhere" }));
    await expect
      .poll(() => style(texture() as HTMLElement).opacity)
      .toBe("0.2");
  });

  test("with less motion it's there and doesn't change", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Member />);

    await userEvent.hover(card(), { position: { x: 80, y: 50 } });
    await expect.poll(() => card().hasAttribute("data-active")).toBe(true);

    expect(style(texture() as HTMLElement).display).not.toBe("none");
    expect(style(texture() as HTMLElement).opacity).toBe("0.2");
  });

  test("a disabled card keeps its texture, at rest", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Member disabled />);

    await userEvent.hover(card(), { position: { x: 80, y: 50 } });

    expect(style(texture() as HTMLElement).opacity).toBe("0.2");
  });

  test("variables change the pattern and how strong it is", async () => {
    await render(
      <div
        style={
          {
            "--nuv-holo-card-texture":
              "linear-gradient(rgb(1, 2, 3), rgb(4, 5, 6))",
            "--nuv-holo-card-texture-opacity": "0.1",
          } as never
        }
      >
        <Member />
      </div>,
    );

    expect(style(texture() as HTMLElement).backgroundImage).toContain(
      "rgb(1, 2, 3)",
    );
    expect(style(texture() as HTMLElement).opacity).toBe("0.1");
  });
});

describe("under other pointers", () => {
  test("a pen moves it as a mouse does", async () => {
    await render(<Member />);

    point("pointermove", "pen", 0.75, 0.5);

    expect(at("x")).toBe("0.750");
    expect(card().hasAttribute("data-active")).toBe(true);
  });

  test("a finger doesn't, since it's on its way to scroll the page", async () => {
    await render(<Member />);

    point("pointermove", "touch", 0.75, 0.5);

    expect(at("x")).toBe("");
    expect(card().hasAttribute("data-active")).toBe(false);
  });

  test("a pointer that's taken away by the browser leaves it flat", async () => {
    await render(<Member />);
    point("pointermove", "pen", 0.75, 0.5);

    point("pointercancel", "pen");

    expect(at("x")).toBe("");
    expect(card().hasAttribute("data-active")).toBe(false);
  });
});

describe("disabled", () => {
  test("it says so, and doesn't follow the pointer", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Member disabled />);

    await userEvent.hover(card(), { position: { x: 80, y: 50 } });
    point("pointermove", "mouse", 0.25, 0.25);

    expect(card().hasAttribute("data-disabled")).toBe(true);
    expect(card().hasAttribute("data-active")).toBe(false);
    expect(at("x")).toBe("");
    expect(style(shine() as HTMLElement).opacity).toBe("0");
  });

  test("turned off while the pointer is on it, it goes flat where it is", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const screen = await render(<Member />);
    await userEvent.hover(card(), { position: { x: 80, y: 50 } });
    await expect.poll(() => card().hasAttribute("data-active")).toBe(true);

    await screen.rerender(<Member disabled />);

    await expect
      .poll(() => new DOMMatrixReadOnly(style(surface()).transform).isIdentity)
      .toBe(true);
    await expect.poll(() => style(shine() as HTMLElement).opacity).toBe("0");
  });
});

describe("with less motion", () => {
  test("it doesn't tilt and has no shine, wherever the pointer is", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Member />);

    await userEvent.hover(card(), { position: { x: 80, y: 50 } });
    await expect.poll(() => card().hasAttribute("data-active")).toBe(true);

    expect(style(surface()).transform).toBe("none");
    expect(style(shine() as HTMLElement).display).toBe("none");
  });
});

describe("styles", () => {
  test("the face has the card's corners, and keeps the shine to itself", async () => {
    await render(<Member />);

    expect(style(card()).borderTopLeftRadius).not.toBe("0px");
    expect(style(surface()).borderTopLeftRadius).toBe(
      style(card()).borderTopLeftRadius,
    );
    expect(style(shine() as HTMLElement).borderTopLeftRadius).toBe(
      style(card()).borderTopLeftRadius,
    );
    // A layer of its own, which is what the shine blends within.
    expect(style(surface()).zIndex).toBe("0");
    expect(style(card()).perspective).toBe("800px");
  });

  test("the surface is as tall as the card", async () => {
    await render(<Member />);

    expect(surface().getBoundingClientRect().height).toBe(200);
    expect(surface().getBoundingClientRect().width).toBe(320);
    expect(content().getBoundingClientRect().height).toBe(200);
  });

  test("component variables change the corners, the depth, the speed and the shine", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <div
        style={
          {
            "--nuv-holo-card-radius": "4px",
            "--nuv-holo-card-perspective": "300px",
            "--nuv-holo-card-duration": "900ms",
            "--nuv-holo-card-shine-opacity": "0.3",
            "--nuv-holo-card-glare": "rgb(10, 20, 30)",
            "--nuv-holo-card-foil":
              "linear-gradient(rgb(1, 2, 3), rgb(4, 5, 6))",
          } as never
        }
      >
        <Member />
      </div>,
    );

    expect(style(card()).borderTopLeftRadius).toBe("4px");
    expect(style(card()).perspective).toBe("300px");
    expect(style(surface()).transitionDuration).toBe("0.9s");
    expect(style(shine() as HTMLElement).backgroundImage).toContain(
      "rgb(1, 2, 3)",
    );

    await userEvent.hover(card(), { position: { x: 80, y: 50 } });
    await expect.poll(() => style(shine() as HTMLElement).opacity).toBe("0.3");
  });

  test("a larger tilt turns it further", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const turn = () => {
      const matrix = new DOMMatrixReadOnly(style(surface()).transform);
      // How far the surface's own x axis has left the screen's.
      return Math.abs(matrix.m13);
    };
    const screen = await render(<Member />);
    surface().style.transition = "none";
    point("pointermove", "mouse", 1, 0.5);
    const small = turn();

    await screen.rerender(
      <Member style={{ ...size, "--nuv-holo-card-tilt": "30deg" } as never} />,
    );
    surface().style.transition = "none";
    point("pointermove", "mouse", 1, 0.5);

    expect(small).toBeGreaterThan(0);
    expect(turn()).toBeGreaterThan(small);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe at rest", async () => {
    const screen = await renderThemed(
      theme,
      <HoloCard
        style={
          {
            ...size,
            "--nuv-holo-card-bg": "var(--color-surface)",
            "--nuv-holo-card-fg": "var(--color-surface-foreground)",
          } as never
        }
      >
        <div style={{ padding: 16 }}>
          <p>Sajan</p>
          {/* The library's button, in the theme's colors. A bare one is
              drawn in the browser's own, which in Safari's dark mode
              don't pass. */}
          <Button intent="secondary">Show the number</Button>
        </div>
      </HoloCard>,
    );

    await expectNoViolations(screen.container);
  });
});
