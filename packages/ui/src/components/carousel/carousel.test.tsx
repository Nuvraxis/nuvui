import "../../styles/index.scss";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import {
  Component,
  type CSSProperties,
  createRef,
  type ReactNode,
  useState,
} from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../button/button";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPlayPause,
  CarouselPrevious,
  type CarouselProps,
  CarouselThumbnail,
  CarouselThumbnails,
} from "./carousel";

const names = ["One", "Two", "Three"];

// Three slides in a box 300 wide, each with a button in it, and under them
// the buttons to go back and on and a dot for each.
function Tour({
  box,
  ...props
}: Partial<CarouselProps> & { box?: CSSProperties }) {
  const vertical = props.orientation === "vertical";
  return (
    <div data-testid="box" style={{ width: 300, ...box }}>
      <Carousel aria-label="Tour" {...props}>
        <CarouselPlayPause />
        <CarouselContent style={vertical ? { height: 120 } : undefined}>
          {names.map((name) => (
            <CarouselItem key={name}>
              <div
                data-testid={name}
                style={{ height: vertical ? "100%" : 100 }}
              >
                {/* The library's button. The browser's own is too
                    faint for axe in a dark theme in WebKit. */}
                <Button size="sm">Open {name}</Button>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
        <CarouselDots />
      </Carousel>
    </div>
  );
}

const carousel = () => page.getByRole("region", { name: "Tour" });
const root = () => carousel().element() as HTMLElement;
const previous = () => page.getByRole("button", { name: "Previous slide" });
const next = () => page.getByRole("button", { name: "Next slide" });
const slides = () =>
  Array.from(root().querySelectorAll<HTMLElement>(".nuv-carousel__item"));
const dots = () =>
  Array.from(root().querySelectorAll<HTMLElement>(".nuv-carousel__dot"));
// The number of the dot the carousel is at, counted from 1, or 0 for none.
const at = () =>
  dots().findIndex((dot) => dot.getAttribute("aria-current") === "true") + 1;
// Which slides are within reach: "o" for one that is, "x" for one that isn't.
const reach = () =>
  slides()
    .map((slide) => (slide.hasAttribute("inert") ? "x" : "o"))
    .join("");
const said = () => root().querySelector(".nuv-carousel__status")?.textContent;
const style = (element: Element) => getComputedStyle(element);
const rect = (element: Element) => element.getBoundingClientRect();
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// The engine starts a moment after the carousel is drawn. The dots are
// there once it has.
const ready = () => expect.poll(() => dots().length).toBe(3);

describe("rendering", () => {
  test("is a region called a carousel, with slides that say which of how many they are", async () => {
    await render(<Tour />);
    await ready();

    expect(root().getAttribute("aria-roledescription")).toBe("carousel");
    expect(
      slides().map(
        (slide) =>
          `${slide.getAttribute("role")} ${slide.getAttribute("aria-roledescription")} ${slide.getAttribute("aria-label")}`,
      ),
    ).toEqual([
      "group slide 1 of 3",
      "group slide 2 of 3",
      "group slide 3 of 3",
    ]);
  });

  test("a slide with a name of yours keeps it, and the rest are named your way", async () => {
    await render(
      <Carousel
        aria-label="Tour"
        getSlideLabel={(index, count) => `Bild ${index + 1} von ${count}`}
      >
        <CarouselContent>
          <CarouselItem aria-label="Welcome">One</CarouselItem>
          <CarouselItem>Two</CarouselItem>
        </CarouselContent>
      </Carousel>,
    );

    await expect
      .poll(() => slides().map((slide) => slide.getAttribute("aria-label")))
      .toEqual(["Welcome", "Bild 2 von 2"]);
  });

  test("forwards refs, class names and other props to each part", async () => {
    const refs = {
      root: createRef<HTMLDivElement>(),
      content: createRef<HTMLDivElement>(),
      item: createRef<HTMLDivElement>(),
      previous: createRef<HTMLButtonElement>(),
      next: createRef<HTMLButtonElement>(),
      dots: createRef<HTMLDivElement>(),
      thumbnails: createRef<HTMLDivElement>(),
      thumbnail: createRef<HTMLButtonElement>(),
    };
    await render(
      <Carousel ref={refs.root} aria-label="Tour" className="a" data-kind="a">
        <CarouselContent ref={refs.content} className="b" data-kind="b">
          <CarouselItem ref={refs.item} className="c" data-kind="c">
            One
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious ref={refs.previous} className="d" data-kind="d" />
        <CarouselNext ref={refs.next} className="e" data-kind="e" />
        <CarouselDots ref={refs.dots} className="f" data-kind="f" />
        <CarouselThumbnails ref={refs.thumbnails} className="g" data-kind="g">
          <CarouselThumbnail
            ref={refs.thumbnail}
            index={0}
            aria-label="One"
            className="h"
            data-kind="h"
          />
        </CarouselThumbnails>
      </Carousel>,
    );

    expect(refs.root.current?.className).toBe("nuv-carousel a");
    // The row of slides, inside the window they're seen through.
    expect(refs.content.current?.className).toBe("nuv-carousel__content b");
    expect(refs.content.current?.parentElement?.className).toBe(
      "nuv-carousel__viewport",
    );
    expect(refs.item.current?.className).toBe("nuv-carousel__item c");
    expect(refs.previous.current?.className).toBe(
      "nuv-carousel__button nuv-carousel__button--previous d",
    );
    expect(refs.next.current?.className).toBe(
      "nuv-carousel__button nuv-carousel__button--next e",
    );
    expect(refs.dots.current?.className).toBe("nuv-carousel__dots f");
    expect(refs.thumbnails.current?.className).toBe(
      "nuv-carousel__thumbnails g",
    );
    expect(refs.thumbnail.current?.className).toBe("nuv-carousel__thumbnail h");
    for (const [name, ref] of Object.entries(refs)) {
      expect(ref.current?.dataset.kind, name).toBe(
        ref.current?.className.at(-1),
      );
    }
  });

  test("a part outside a carousel says what's wrong", async () => {
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
        <CarouselNext />
      </Boundary>,
    );

    await expect
      .poll(() => page.getByRole("alert").element().textContent)
      .toBe("CarouselNext has to be inside a Carousel.");
    quiet.mockRestore();
  });
});

describe("going back and on", () => {
  test("the button goes on a slide, and at the ends the one with nowhere to go is disabled", async () => {
    await render(<Tour />);
    await ready();
    expect(at()).toBe(1);
    expect((previous().element() as HTMLButtonElement).disabled).toBe(true);
    expect((next().element() as HTMLButtonElement).disabled).toBe(false);

    await next().click();
    await expect.poll(at).toBe(2);
    expect((previous().element() as HTMLButtonElement).disabled).toBe(false);

    await next().click();
    await expect.poll(at).toBe(3);
    await expect
      .poll(() => (next().element() as HTMLButtonElement).disabled)
      .toBe(true);

    await previous().click();
    await expect.poll(at).toBe(2);
  });

  test("with loop neither is disabled, and on from the last is the first", async () => {
    await render(<Tour loop defaultIndex={2} />);
    await ready();
    await expect.poll(at).toBe(3);
    expect((next().element() as HTMLButtonElement).disabled).toBe(false);
    expect((previous().element() as HTMLButtonElement).disabled).toBe(false);

    await next().click();

    await expect.poll(at).toBe(1);
  });

  test("the buttons say what they move", async () => {
    await render(<Tour />);
    await ready();
    const content = root().querySelector(".nuv-carousel__content");

    expect(content?.id).toBeTruthy();
    expect(next().element().getAttribute("aria-controls")).toBe(content?.id);
    expect(previous().element().getAttribute("aria-controls")).toBe(
      content?.id,
    );
  });

  test("something of yours in a button replaces the arrow, and names it", async () => {
    await render(
      <Carousel aria-label="Tour">
        <CarouselContent>
          <CarouselItem>One</CarouselItem>
          <CarouselItem>Two</CarouselItem>
        </CarouselContent>
        <CarouselNext>Further</CarouselNext>
      </Carousel>,
    );
    const button = page.getByRole("button", { name: "Further" });

    await expect.element(button).toBeVisible();
    expect(button.element().hasAttribute("aria-label")).toBe(false);
    expect(button.element().querySelector("svg")).toBe(null);
  });

  test("a press you handle yourself moves nothing", async () => {
    await render(
      <Carousel aria-label="Tour">
        <CarouselContent>
          <CarouselItem>One</CarouselItem>
          <CarouselItem>Two</CarouselItem>
        </CarouselContent>
        <CarouselNext onClick={(event) => event.preventDefault()} />
        <CarouselDots />
      </Carousel>,
    );
    await expect.poll(() => dots().length).toBe(2);

    await next().click();
    await wait(200);

    expect(at()).toBe(1);
  });
});

describe("which slide it's at", () => {
  test("onIndexChange is called with the stop it moved to", async () => {
    const onIndexChange = vi.fn();
    await render(<Tour onIndexChange={onIndexChange} />);
    await ready();

    await next().click();
    await expect.poll(at).toBe(2);

    expect(onIndexChange.mock.calls).toEqual([[1]]);
  });

  test("defaultIndex is where it starts", async () => {
    await render(<Tour defaultIndex={1} />);
    await ready();

    await expect.poll(at).toBe(2);
    await expect.poll(reach).toBe("xox");
  });

  test("you can keep it yourself, and move it from outside", async () => {
    function Kept() {
      const [index, setIndex] = useState(0);
      return (
        <>
          <button type="button" onClick={() => setIndex(2)}>
            To the end
          </button>
          <Tour index={index} onIndexChange={setIndex} />
        </>
      );
    }
    await render(<Kept />);
    await ready();

    await page.getByRole("button", { name: "To the end" }).click();
    await expect.poll(at).toBe(3);

    await previous().click();
    await expect.poll(at).toBe(2);
  });

  test("onApi gives the engine once it's running", async () => {
    let api: CarouselApi | undefined;
    await render(
      <Tour
        onApi={(engine) => {
          api = engine;
        }}
      />,
    );
    await ready();

    expect(api?.scrollSnapList().length).toBe(3);
    api?.scrollTo(2, true);
    await expect.poll(at).toBe(3);
  });
});

describe("the dots", () => {
  test("there's one for each stop, named, in a group that's named", async () => {
    await render(<Tour />);
    await ready();
    const group = dots()[0]?.parentElement;

    expect(group?.getAttribute("role")).toBe("group");
    expect(group?.getAttribute("aria-label")).toBe("Choose a slide");
    expect(dots().map((dot) => dot.getAttribute("aria-label"))).toEqual([
      "Go to slide 1",
      "Go to slide 2",
      "Go to slide 3",
    ]);
    expect(dots().map((dot) => dot.getAttribute("aria-current"))).toEqual([
      "true",
      null,
      null,
    ]);
  });

  test("a press goes straight to its slide", async () => {
    await render(<Tour />);
    await ready();

    await page.getByRole("button", { name: "Go to slide 3" }).click();

    await expect.poll(at).toBe(3);
    await expect.poll(reach).toBe("xxo");
  });

  test("they're named your way", async () => {
    await render(
      <Carousel aria-label="Tour">
        <CarouselContent>
          <CarouselItem>One</CarouselItem>
          <CarouselItem>Two</CarouselItem>
        </CarouselContent>
        <CarouselDots
          aria-label="Bild wählen"
          getDotLabel={(index, count) => `Bild ${index + 1} von ${count}`}
        />
      </Carousel>,
    );
    await expect.poll(() => dots().length).toBe(2);

    expect(dots().map((dot) => dot.getAttribute("aria-label"))).toEqual([
      "Bild 1 von 2",
      "Bild 2 von 2",
    ]);
    expect(dots()[0]?.parentElement?.getAttribute("aria-label")).toBe(
      "Bild wählen",
    );
  });

  test("with several slides in view there are fewer stops than slides", async () => {
    await render(
      <Tour
        options={{ align: "start" }}
        style={{ "--nuv-carousel-slide-size": "50%" } as CSSProperties}
      />,
    );

    // Three slides, two at a time: the first two, and then the last two.
    await expect.poll(() => dots().length).toBe(2);
    await expect.poll(reach).toBe("oox");

    await next().click();
    await expect.poll(reach).toBe("xoo");
  });
});

describe("thumbnails", () => {
  test("a press goes to its slide, and the one the carousel is at is marked", async () => {
    await render(
      <div style={{ width: 300 }}>
        <Carousel aria-label="Tour">
          <CarouselContent>
            {names.map((name) => (
              <CarouselItem key={name}>{name}</CarouselItem>
            ))}
          </CarouselContent>
          <CarouselThumbnails>
            {names.map((name, index) => (
              <CarouselThumbnail key={name} index={index} aria-label={name} />
            ))}
          </CarouselThumbnails>
        </Carousel>
      </div>,
    );
    const thumbnail = (name: string) => page.getByRole("button", { name });
    await expect
      .element(thumbnail("One"))
      .toHaveAttribute("aria-current", "true");
    const row = thumbnail("One").element().parentElement;
    expect(row?.getAttribute("role")).toBe("group");
    expect(row?.getAttribute("aria-label")).toBe("Choose a slide");

    await thumbnail("Three").click();

    await expect
      .element(thumbnail("Three"))
      .toHaveAttribute("aria-current", "true");
    expect(thumbnail("One").element().hasAttribute("aria-current")).toBe(false);
    await expect.poll(reach).toBe("xxo");
  });
});

describe("what's out of sight", () => {
  test("is out of reach, and comes within it when the carousel gets there", async () => {
    await render(<Tour />);
    await ready();
    await expect.poll(reach).toBe("oxx");

    await next().click();

    await expect.poll(reach).toBe("xox");
  });

  test("so Tab goes from the slide that shows to the buttons, past the rest", async () => {
    await render(<Tour />);
    await ready();
    await expect.poll(reach).toBe("oxx");

    await userEvent.tab();
    expect(document.activeElement?.textContent).toBe("Open One");
    await userEvent.tab();
    // Back is disabled at the first slide, so it's on that's next.
    expect(document.activeElement).toBe(next().element());
  });
});

describe("what a screen reader is told", () => {
  test("nothing when it's drawn, and which slide when a button moves it", async () => {
    await render(<Tour />);
    await ready();
    const status = root().querySelector(".nuv-carousel__status");

    expect(status?.getAttribute("role")).toBe("status");
    expect(said()).toBe("");

    await next().click();
    await expect.poll(said).toBe("Slide 2 of 3");
  });

  test("the words are in the page and drawn for nobody", async () => {
    await render(<Tour />);
    await ready();
    const status = root().querySelector(".nuv-carousel__status") as Element;

    expect(rect(status).width).toBe(1);
    expect(style(status).position).toBe("absolute");
  });
});

describe("dragging", () => {
  test("a drag across the slides moves on to the next", async () => {
    await render(<Tour />);
    await ready();

    await userEvent.dragAndDrop(
      page.getByTestId("One"),
      page.getByTestId("box"),
      // From near the end of the slide to near its start, well past
      // the button that's in it.
      {
        sourcePosition: { x: 280, y: 60 },
        targetPosition: { x: 20, y: 60 },
        steps: 10,
      },
    );

    await expect.poll(at).toBe(2);
    await expect.poll(reach).toBe("xox");
  });
});

describe("up and down", () => {
  test("the slides are one above another, and on is down", async () => {
    await render(<Tour orientation="vertical" />);
    await ready();
    const top = (name: string) => rect(page.getByTestId(name).element()).top;

    expect(root().dataset.orientation).toBe("vertical");
    expect(top("Two")).toBeGreaterThan(top("One"));
    expect(
      Math.abs(
        rect(page.getByTestId("Two").element()).left -
          rect(page.getByTestId("One").element()).left,
      ),
    ).toBeLessThan(1);
    await expect.poll(reach).toBe("oxx");

    await next().click();

    await expect.poll(at).toBe(2);
    await expect.poll(reach).toBe("xox");
  });

  test("the arrows point up and down", async () => {
    await render(<Tour orientation="vertical" />);
    await ready();
    const turn = (button: Element) =>
      style(button.querySelector(".nuv-carousel__arrow") as Element).transform;

    // A quarter turn each, opposite ways.
    expect(turn(next().element())).toBe("matrix(0, 1, -1, 0, 0, 0)");
    expect(turn(previous().element())).toBe("matrix(0, -1, 1, 0, 0, 0)");
  });
});

describe("right to left", () => {
  test("the slides run the other way, and on still goes on", async () => {
    await render(
      <div dir="rtl">
        <Tour />
      </div>,
    );
    await ready();
    const left = (name: string) => rect(page.getByTestId(name).element()).left;

    expect(left("Two")).toBeLessThan(left("One"));
    await expect.poll(reach).toBe("oxx");

    await next().click();

    await expect.poll(at).toBe(2);
    await expect.poll(reach).toBe("xox");
  });

  test("the arrows are turned round", async () => {
    await render(
      <div dir="rtl">
        <Tour />
      </div>,
    );
    await ready();
    const turn = (button: Element) =>
      style(button.querySelector(".nuv-carousel__arrow") as Element).transform;

    expect(turn(next().element())).toBe("matrix(-1, 0, 0, 1, 0, 0)");
    expect(turn(previous().element())).toBe("none");
  });
});

describe("moving by itself", () => {
  const stop = () =>
    page.getByRole("button", { name: "Stop the slides moving" });
  const start = () =>
    page.getByRole("button", { name: "Start the slides moving" });
  // Somewhere to put the pointer that isn't the carousel.
  const elsewhere = (
    <button type="button" style={{ marginBlockStart: 40 }}>
      Elsewhere
    </button>
  );
  const away = () =>
    userEvent.hover(page.getByRole("button", { name: "Elsewhere" }));

  test("without autoplay there's no button to stop it, and it stays where it is", async () => {
    await render(<Tour />);
    await ready();

    expect(root().querySelector("[data-playing]")).toBe(null);
    expect(document.querySelectorAll(".nuv-carousel__button").length).toBe(2);
    await wait(400);
    expect(at()).toBe(1);
  });

  test("it goes on a slide every so often, and round to the first", async () => {
    await render(
      <>
        <Tour autoplay={150} />
        {elsewhere}
      </>,
    );
    await ready();
    await away();

    await expect.poll(at, { timeout: 3000 }).toBe(2);
    await expect.poll(at, { timeout: 3000 }).toBe(3);
    await expect.poll(at, { timeout: 3000 }).toBe(1);
    // And a screen reader isn't told each time.
    expect(said()).toBe("");
  });

  test("the button stops it and starts it, and says which it would do", async () => {
    await render(
      <>
        <Tour autoplay={150} />
        {elsewhere}
      </>,
    );
    await ready();
    await expect.element(stop()).toHaveAttribute("data-playing", "");

    await stop().click();
    await expect.element(start()).toBeVisible();
    expect(start().element().hasAttribute("data-playing")).toBe(false);
    const stayed = at();
    await away();
    await wait(500);
    expect(at()).toBe(stayed);

    await start().click();
    await away();
    await expect.poll(at, { timeout: 3000 }).not.toBe(stayed);
  });

  test("it waits while the pointer is over it, and goes on when the pointer leaves", async () => {
    await render(
      <>
        <Tour autoplay={150} />
        {elsewhere}
      </>,
    );
    await ready();

    await userEvent.hover(page.getByTestId("box"));
    await wait(100);
    const held = at();
    await wait(500);
    expect(at()).toBe(held);

    await away();
    await expect.poll(at, { timeout: 3000 }).not.toBe(held);
  });

  test("it stops when the keyboard reaches it, and stays stopped", async () => {
    await render(
      <>
        <Tour autoplay={150} />
        {elsewhere}
      </>,
    );
    await ready();
    await away();

    await userEvent.tab();

    // The button to stop it is first, and now it's the one to start it.
    await expect.element(start()).toHaveFocus();
    const stayed = at();
    await wait(500);
    expect(at()).toBe(stayed);

    // Going on through it with Tab doesn't start it or stop it again.
    await userEvent.keyboard("{Enter}");
    await expect.element(stop()).toBeVisible();
    await userEvent.tab();
    await expect.element(stop()).toHaveAttribute("data-playing", "");
  });

  test("it doesn't start for someone who has asked for less motion", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Tour autoplay={150} />);
    await ready();

    await expect.element(start()).toBeVisible();
    await wait(500);
    expect(at()).toBe(1);
  });

  test("the button is named your way", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <Carousel aria-label="Tour" autoplay={150}>
        <CarouselPlayPause getLabel={(playing) => (playing ? "Halt" : "Los")} />
        <CarouselContent>
          <CarouselItem>One</CarouselItem>
          <CarouselItem>Two</CarouselItem>
        </CarouselContent>
      </Carousel>,
    );

    await expect
      .element(page.getByRole("button", { name: "Los" }))
      .toBeVisible();
  });
});

describe("layout", () => {
  test("a slide is as wide as the carousel, with the gap taken out of it", async () => {
    await render(<Tour />);
    await ready();
    const viewport = root().querySelector(".nuv-carousel__viewport") as Element;

    expect(rect(viewport).width).toBe(300);
    expect(rect(page.getByTestId("One").element()).width).toBe(300);
    // The next slide starts a gap past the edge.
    expect(
      rect(page.getByTestId("Two").element()).left -
        rect(page.getByTestId("One").element()).right,
    ).toBe(16);
    expect(style(viewport).overflowX).toBe("hidden");
  });

  test("the buttons are 36px with a mouse, and round", async () => {
    await setViewport("desktop");
    await render(<Tour />);
    await ready();
    const button = next().element();

    expect(rect(button).width).toBe(36);
    expect(rect(button).height).toBe(36);
    expect(
      Number.parseFloat(style(button).borderTopLeftRadius),
    ).toBeGreaterThan(17);
  });

  test("a dot is 8px, and the one the carousel is at is longer", async () => {
    await render(<Tour />);
    await ready();
    const drawn = (dot: Element | undefined) =>
      getComputedStyle(dot as Element, "::before");

    expect(drawn(dots()[1]).width).toBe("8px");
    expect(drawn(dots()[1]).height).toBe("8px");
    expect(drawn(dots()[0]).width).toBe("20px");
    expect(drawn(dots()[0]).height).toBe("8px");
    // Its fill is what marks it, with its length.
    expect(drawn(dots()[0]).backgroundColor).not.toBe(
      drawn(dots()[1]).backgroundColor,
    );
  });

  test("each dot's button is its own to press: none covers another", async () => {
    await render(<Tour />);
    await ready();

    for (const dot of dots()) {
      const box = rect(dot);
      expect(
        document.elementFromPoint(
          box.left + box.width / 2,
          box.top + box.height / 2,
        ),
      ).toBe(dot);
    }
    const boxes = dots().map(rect);
    expect(boxes[1]?.left).toBeGreaterThanOrEqual(boxes[0]?.right ?? 0);
  });

  test("the buttons and a dot show a ring when they have focus from the keyboard", async () => {
    await render(<Tour />);
    await ready();
    await expect.poll(reach).toBe("oxx");

    await userEvent.tab();
    await userEvent.tab();
    expect(document.activeElement).toBe(next().element());
    expect(style(next().element()).outlineStyle).toBe("solid");

    await userEvent.tab();
    expect(document.activeElement).toBe(dots()[0]);
    expect(style(dots()[0] as Element).outlineStyle).toBe("solid");
  });
});

describe("theming", () => {
  test("its variables change its look", async () => {
    await setViewport("desktop");
    await render(
      <div
        style={
          {
            "--nuv-carousel-gap": "30px",
            "--nuv-carousel-controls-gap": "7px",
            "--nuv-carousel-button-size": "50px",
            "--nuv-carousel-button-bg": "rgb(10, 20, 30)",
            "--nuv-carousel-button-fg": "rgb(200, 210, 220)",
            "--nuv-carousel-button-border": "rgb(40, 50, 60)",
            "--nuv-carousel-dot-size": "12px",
            "--nuv-carousel-dot-border": "rgb(70, 80, 90)",
            "--nuv-carousel-dot-bg": "rgb(1, 2, 3)",
            "--nuv-carousel-dot-current": "rgb(4, 5, 6)",
          } as never
        }
      >
        <Tour />
      </div>,
    );
    await ready();
    const button = next().element();
    const drawn = (dot: Element | undefined) =>
      getComputedStyle(dot as Element, "::before");

    expect(
      rect(page.getByTestId("Two").element()).left -
        rect(page.getByTestId("One").element()).right,
    ).toBe(30);
    expect(style(root()).rowGap).toBe("7px");
    expect(rect(button).width).toBe(50);
    expect(style(button).backgroundColor).toBe("rgb(10, 20, 30)");
    expect(style(button).color).toBe("rgb(200, 210, 220)");
    expect(style(button).borderTopColor).toBe("rgb(40, 50, 60)");
    expect(drawn(dots()[1]).width).toBe("12px");
    expect(drawn(dots()[1]).borderTopColor).toBe("rgb(70, 80, 90)");
    expect(drawn(dots()[1]).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(drawn(dots()[0]).backgroundColor).toBe("rgb(4, 5, 6)");
  });

  test("a slide can be a share of the carousel", async () => {
    await render(
      <Tour
        options={{ align: "start" }}
        style={{ "--nuv-carousel-slide-size": "50%" } as CSSProperties}
      />,
    );
    await expect.poll(() => dots().length).toBe(2);

    // Half the row each, less the gap.
    expect(rect(page.getByTestId("One").element()).width).toBe(142);
  });

  test("a thumbnail's variables change its look", async () => {
    await render(
      <div
        style={
          {
            "--nuv-carousel-thumbnail-size": "40px",
            "--nuv-carousel-thumbnail-radius": "3px",
            "--nuv-carousel-thumbnail-opacity": "0.5",
            "--nuv-carousel-thumbnail-current": "rgb(1, 2, 3)",
          } as never
        }
      >
        <Carousel aria-label="Tour">
          <CarouselContent>
            <CarouselItem>One</CarouselItem>
            <CarouselItem>Two</CarouselItem>
          </CarouselContent>
          <CarouselThumbnails>
            <CarouselThumbnail index={0} aria-label="One" />
            <CarouselThumbnail index={1} aria-label="Two" />
          </CarouselThumbnails>
        </Carousel>
      </div>,
    );
    const one = page.getByRole("button", { name: "One" });
    const two = page.getByRole("button", { name: "Two" }).element();
    await expect.element(one).toHaveAttribute("aria-current", "true");

    expect(rect(two).width).toBe(40);
    expect(style(two).borderTopLeftRadius).toBe("3px");
    expect(style(two).opacity).toBe("0.5");
    expect(style(one.element()).opacity).toBe("1");
    expect(style(one.element()).outlineColor).toBe("rgb(1, 2, 3)");
    expect(style(one.element()).outlineStyle).toBe("solid");
  });

  test.each(themes)(
    "the dots and the arrows can be seen in %s",
    async (theme) => {
      const screen = await renderThemed(theme, <Tour />);
      await ready();
      const ground = style(
        screen.container.querySelector("main") as Element,
      ).backgroundColor;
      const drawn = (dot: Element | undefined) =>
        getComputedStyle(dot as Element, "::before");

      expect(
        contrast(drawn(dots()[1]).borderTopColor, ground),
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrast(drawn(dots()[0]).backgroundColor, ground),
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrast(
          style(next().element()).color,
          style(next().element()).backgroundColor,
        ),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe with buttons, dots and thumbnails, at a slide in the middle", async () => {
    const screen = await renderThemed(
      theme,
      <>
        <Tour defaultIndex={1} />
        <div style={{ width: 300 }}>
          <Carousel aria-label="Photographs" autoplay={60000}>
            <CarouselPlayPause />
            <CarouselContent>
              <CarouselItem>Front</CarouselItem>
              <CarouselItem>Back</CarouselItem>
            </CarouselContent>
            <CarouselThumbnails>
              <CarouselThumbnail index={0} aria-label="Front" />
              <CarouselThumbnail index={1} aria-label="Back" />
            </CarouselThumbnails>
          </Carousel>
        </div>
      </>,
    );
    await ready();
    await expect.poll(reach).toBe("xox");

    await expectNoViolations(screen.container);
  });
});
