import "../../styles/index.scss";
import { contrast } from "@nuvui/tooling/test/contrast";
import {
  expectNoViolations,
  renderThemed,
  themeAttributes,
  themes,
} from "@nuvui/tooling/test/themed";
import { Component, createRef, type ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  type StepperProps,
  StepperTitle,
} from "./stepper";

const titles = ["Account", "Team", "Billing", "Review"];

function Example(props: Partial<StepperProps>) {
  return (
    <Stepper value={2} aria-label="Setting up" data-testid="stepper" {...props}>
      {titles.map((title, index) => (
        <StepperItem key={title} step={index + 1} data-testid={title}>
          <StepperIndicator data-testid={`${title}-indicator`} />
          <StepperContent data-testid={`${title}-content`}>
            <StepperTitle data-testid={`${title}-title`}>{title}</StepperTitle>
            <StepperDescription>
              About {title.toLowerCase()}.
            </StepperDescription>
          </StepperContent>
        </StepperItem>
      ))}
    </Stepper>
  );
}

const part = (id: string) => page.getByTestId(id).element();
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);
const line = (id: string) => getComputedStyle(part(id), "::after");
const states = () => titles.map((title) => part(title).dataset.state);

describe("rendering", () => {
  test("is a named list with one item for each step", async () => {
    await render(<Example />);

    await expect
      .element(page.getByRole("list", { name: "Setting up" }))
      .toHaveClass("nuv-stepper");
    expect(part("stepper").tagName).toBe("OL");
    expect(part("stepper").dataset.orientation).toBe("horizontal");
    expect(page.getByRole("listitem").elements()).toHaveLength(4);
  });

  test("steps before the value are done, the one at it is current, the rest are to come", async () => {
    await render(<Example value={3} />);

    expect(states()).toEqual(["complete", "complete", "current", "upcoming"]);
  });

  test("only the current step says it's the current one", async () => {
    await render(<Example value={3} />);

    expect(
      titles.map((title) => part(title).getAttribute("aria-current")),
    ).toEqual([null, null, "step", null]);
  });

  test("a value past the last step means all of them are done", async () => {
    await render(<Example value={5} />);

    expect(states()).toEqual(["complete", "complete", "complete", "complete"]);
    expect(
      page
        .getByRole("listitem")
        .elements()
        .map((item) => item.getAttribute("aria-current")),
    ).toEqual([null, null, null, null]);
  });

  test("the states follow the value when it changes", async () => {
    const screen = await render(<Example value={1} />);
    expect(states()).toEqual(["current", "upcoming", "upcoming", "upcoming"]);

    await screen.rerender(<Example value={4} />);
    expect(states()).toEqual(["complete", "complete", "complete", "current"]);
  });

  test("the circle shows the step's number, then a tick, and is hidden from screen readers", async () => {
    await render(<Example value={2} />);

    expect(part("Account-indicator").querySelector("svg")).not.toBeNull();
    expect(part("Account-indicator").textContent).toBe("");
    expect(part("Team-indicator").textContent).toBe("2");
    expect(part("Billing-indicator").textContent).toBe("3");
    for (const title of titles) {
      expect(part(`${title}-indicator`).getAttribute("aria-hidden")).toBe(
        "true",
      );
    }
  });

  test("a step that's done says so after its title, in words that aren't drawn", async () => {
    await render(<Example value={2} />);
    const status = part("Account-title").querySelector(".nuv-stepper__status");

    expect(part("Account-title").textContent).toBe("Account Completed");
    expect(rect(status as Element).width).toBeLessThanOrEqual(1);
    expect(part("Team-title").textContent).toBe("Team");
    expect(part("Billing-title").textContent).toBe("Billing");
  });

  test("the word can be translated, or left out", async () => {
    const screen = await render(
      <Example value={2} completedLabel="Abgeschlossen" />,
    );
    expect(part("Account-title").textContent).toBe("Account Abgeschlossen");

    await screen.rerender(<Example value={2} completedLabel="" />);
    expect(part("Account-title").textContent).toBe("Account");
  });

  test("children of the indicator replace the number and the tick", async () => {
    await render(
      <Stepper value={2} aria-label="Setting up">
        <StepperItem step={1}>
          <StepperIndicator data-testid="done">A</StepperIndicator>
          <StepperContent>
            <StepperTitle>Account</StepperTitle>
          </StepperContent>
        </StepperItem>
        <StepperItem step={2}>
          <StepperIndicator data-testid="now">B</StepperIndicator>
          <StepperContent>
            <StepperTitle>Team</StepperTitle>
          </StepperContent>
        </StepperItem>
      </Stepper>,
    );

    expect(part("done").textContent).toBe("A");
    expect(part("done").querySelector("svg")).toBeNull();
    expect(part("now").textContent).toBe("B");
  });

  test("dots have nothing in them", async () => {
    await render(<Example variant="dot" value={3} />);

    expect(part("stepper").className).toBe("nuv-stepper nuv-stepper--dot");
    for (const title of titles) {
      expect(part(`${title}-indicator`).childNodes).toHaveLength(0);
    }
  });

  test("every part forwards its ref, a className and other props", async () => {
    const refs = {
      stepper: createRef<HTMLOListElement>(),
      item: createRef<HTMLLIElement>(),
      indicator: createRef<HTMLSpanElement>(),
      content: createRef<HTMLDivElement>(),
      title: createRef<HTMLDivElement>(),
      description: createRef<HTMLParagraphElement>(),
    };
    await render(
      <Stepper ref={refs.stepper} value={1} className="mine" id="stepper">
        <StepperItem ref={refs.item} step={1} className="mine" id="item">
          <StepperIndicator
            ref={refs.indicator}
            className="mine"
            id="indicator"
          />
          <StepperContent ref={refs.content} className="mine" id="content">
            <StepperTitle ref={refs.title} className="mine" id="title" />
            <StepperDescription
              ref={refs.description}
              className="mine"
              id="description"
            />
          </StepperContent>
        </StepperItem>
      </Stepper>,
    );

    for (const [name, ref] of Object.entries(refs)) {
      expect(ref.current?.id, name).toBe(name);
      expect(ref.current?.classList.contains("mine"), name).toBe(true);
    }
  });

  test("a part outside its place says where it belongs", async () => {
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
      <>
        <Boundary>
          <StepperItem step={1} />
        </Boundary>
        <Boundary>
          <Stepper value={1}>
            <StepperTitle>Lost</StepperTitle>
          </Stepper>
        </Boundary>
      </>,
    );

    // One element for each message. Side by side as bare text they'd be one
    // run of text, which neither message matches alone.
    await expect
      .poll(() =>
        page
          .getByRole("alert")
          .elements()
          .map((alert) => alert.textContent),
      )
      .toEqual([
        "StepperItem has to be inside a Stepper.",
        "StepperTitle has to be inside a StepperItem.",
      ]);
    quiet.mockRestore();
  });
});

describe("across", () => {
  test("the steps are a row, with each step's text under its circle", async () => {
    await render(
      <div style={{ width: 800 }}>
        <Example />
      </div>,
    );
    const tops = titles.map((title) => rect(part(`${title}-indicator`)).top);

    expect(new Set(tops).size).toBe(1);
    expect(rect(part("Team-indicator")).left).toBeGreaterThan(
      rect(part("Account-indicator")).right,
    );
    expect(rect(part("Account-content")).top).toBeGreaterThanOrEqual(
      rect(part("Account-indicator")).bottom,
    );
    expect(rect(part("Account-content")).left).toBe(
      rect(part("Account-indicator")).left,
    );
  });

  test("every step but the last takes an equal share, and the last only what it needs", async () => {
    await render(
      <div style={{ width: 800 }}>
        <Example />
      </div>,
    );
    const widths = titles.map((title) => Math.round(rect(part(title)).width));

    expect(new Set(widths.slice(0, 3)).size).toBe(1);
    expect(widths[3]).toBeLessThan(widths[0] as number);
    expect(Math.round(rect(part("Review")).right)).toBeLessThanOrEqual(
      Math.round(rect(part("stepper")).right),
    );
  });

  test("a line runs from beside each circle to the next, level with their middles", async () => {
    await render(
      <div style={{ width: 800 }}>
        <Example />
      </div>,
    );
    const circle = rect(part("Account-indicator"));
    const item = rect(part("Account"));

    expect(line("Account").content).toBe('""');
    expect(line("Account").borderTopStyle).toBe("solid");
    expect(line("Account").borderTopWidth).toBe("2px");
    // Level with the middle of the circle.
    expect(Number.parseFloat(line("Account").top)).toBe(circle.height / 2 - 1);
    // It starts after the circle and stops short of the next one.
    expect(Number.parseFloat(line("Account").left)).toBeGreaterThan(
      circle.width,
    );
    expect(
      Number.parseFloat(line("Account").left) +
        Number.parseFloat(line("Account").width),
    ).toBeLessThan(item.width);
    expect(line("Review").content).toBe("none");
  });

  test("the circle is 32 pixels, and a dot is 14", async () => {
    const screen = await render(<Example />);
    expect(rect(part("Account-indicator")).width).toBe(32);
    expect(rect(part("Account-indicator")).height).toBe(32);

    await screen.rerender(<Example variant="dot" />);
    expect(rect(part("Account-indicator")).width).toBe(14);
    expect(rect(part("Account-indicator")).height).toBe(14);
  });

  test("long titles wrap inside their share", async () => {
    await render(
      <div style={{ width: 320 }}>
        <Stepper value={1} aria-label="Setting up" data-testid="stepper">
          {["Tellusaboutyourcompany", "Inviteyourwholeteam", "Pay"].map(
            (title, index) => (
              <StepperItem key={title} step={index + 1}>
                <StepperIndicator />
                <StepperContent>
                  <StepperTitle>{title}</StepperTitle>
                </StepperContent>
              </StepperItem>
            ),
          )}
        </Stepper>
      </div>,
    );

    expect(part("stepper").scrollWidth).toBeLessThanOrEqual(
      part("stepper").clientWidth,
    );
  });
});

describe("down", () => {
  test("the steps are a column, with each step's text beside its circle", async () => {
    await render(<Example orientation="vertical" />);
    const lefts = titles.map((title) => rect(part(`${title}-indicator`)).left);

    expect(part("stepper").className).toBe("nuv-stepper nuv-stepper--vertical");
    expect(part("stepper").dataset.orientation).toBe("vertical");
    expect(new Set(lefts).size).toBe(1);
    expect(rect(part("Team")).top).toBeGreaterThanOrEqual(
      rect(part("Account")).bottom,
    );
    expect(rect(part("Account-content")).left).toBeGreaterThan(
      rect(part("Account-indicator")).right,
    );
  });

  test("the first line of text is level with the middle of the circle", async () => {
    await render(<Example orientation="vertical" />);
    const circle = rect(part("Account-indicator"));
    const title = rect(part("Account-title"));

    expect(
      Math.abs(circle.top + circle.height / 2 - (title.top + title.height / 2)),
    ).toBeLessThanOrEqual(1);
  });

  test("a line runs down from under each circle, under its middle", async () => {
    await render(<Example orientation="vertical" />);
    const circle = rect(part("Account-indicator"));

    expect(line("Account").borderLeftStyle).toBe("solid");
    expect(line("Account").borderLeftWidth).toBe("2px");
    expect(line("Account").borderTopWidth).toBe("0px");
    expect(Number.parseFloat(line("Account").left)).toBe(circle.width / 2 - 1);
    expect(Number.parseFloat(line("Account").top)).toBeGreaterThan(
      circle.height,
    );
    expect(line("Review").content).toBe("none");
  });

  test("there's room under each step but the last", async () => {
    await render(<Example orientation="vertical" />);

    expect(style(part("Account")).paddingBottom).toBe("24px");
    expect(style(part("Review")).paddingBottom).toBe("0px");
  });
});

describe("styles", () => {
  test("the three states have circles that differ", async () => {
    await render(<Example value={2} />);
    const done = style(part("Account-indicator"));
    const now = style(part("Team-indicator"));
    const later = style(part("Billing-indicator"));

    // Done is filled with the color the current one has as its ring.
    expect(done.backgroundColor).toBe(now.borderTopColor);
    expect(now.backgroundColor).not.toBe(done.backgroundColor);
    expect(later.borderTopColor).not.toBe(now.borderTopColor);
    expect(later.backgroundColor).toBe(now.backgroundColor);
  });

  test("the line after a step that's done is in the done color", async () => {
    await render(<Example value={2} />);

    expect(line("Account").borderTopColor).toBe(
      style(part("Account-indicator")).backgroundColor,
    );
    expect(line("Team").borderTopColor).not.toBe(
      line("Account").borderTopColor,
    );
  });

  test("the title of a step still to come is quieter", async () => {
    await render(<Example value={2} />);

    expect(style(part("Billing-title")).color).not.toBe(
      style(part("Team-title")).color,
    );
    expect(style(part("Account-title")).color).toBe(
      style(part("Team-title")).color,
    );
  });

  test("component variables change the look", async () => {
    await render(
      <div
        style={
          {
            "--nuv-stepper-fg": "rgb(1, 2, 3)",
            "--nuv-stepper-muted-fg": "rgb(150, 160, 170)",
            "--nuv-stepper-indicator-size": "40px",
            "--nuv-stepper-indicator-bg": "rgb(10, 20, 30)",
            "--nuv-stepper-indicator-fg": "rgb(200, 210, 220)",
            "--nuv-stepper-indicator-border": "rgb(40, 50, 60)",
            "--nuv-stepper-indicator-radius": "3px",
            "--nuv-stepper-line": "rgb(70, 80, 90)",
            "--nuv-stepper-line-complete": "rgb(100, 110, 120)",
            "--nuv-stepper-line-width": "4px",
            "--nuv-stepper-gap": "30px",
            "--nuv-stepper-space": "50px",
            width: 900,
          } as never
        }
      >
        <Example value={2} />
      </div>,
    );
    const circle = style(part("Team-indicator"));

    expect(style(part("stepper")).color).toBe("rgb(1, 2, 3)");
    expect(style(part("Billing-title")).color).toBe("rgb(150, 160, 170)");
    expect(rect(part("Team-indicator")).width).toBe(40);
    expect(circle.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(circle.color).toBe("rgb(200, 210, 220)");
    expect(circle.borderTopColor).toBe("rgb(40, 50, 60)");
    expect(circle.borderTopWidth).toBe("4px");
    expect(circle.borderTopLeftRadius).toBe("3px");
    expect(line("Team").borderTopColor).toBe("rgb(70, 80, 90)");
    expect(line("Account").borderTopColor).toBe("rgb(100, 110, 120)");
    expect(line("Team").borderTopWidth).toBe("4px");
    expect(style(part("Team")).rowGap).toBe("30px");
    expect(style(part("Team")).paddingRight).toBe("50px");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, across and down, with numbers and with dots", async () => {
    const screen = await renderThemed(
      theme,
      <>
        <Example value={2} />
        <Example value={3} orientation="vertical" aria-label="Order" />
        <Example value={2} variant="dot" aria-label="Article" />
      </>,
    );

    await expectNoViolations(screen.container);
  });

  test("each state's circle has an edge at 3:1 against the page, and what's in it against the circle", async () => {
    await render(
      <div
        data-testid="page"
        {...themeAttributes(theme)}
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <Example value={2} />
      </div>,
    );
    const background = style(part("page")).backgroundColor;

    for (const title of ["Account", "Team", "Billing"]) {
      const circle = style(part(`${title}-indicator`));
      expect(
        contrast(circle.borderTopColor, background),
        `${title} edge`,
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrast(circle.color, circle.backgroundColor),
        `${title} content`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
