import "../../styles/index.scss";
import { setViewport } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  type CardProps,
  CardTitle,
} from "./card";

function Example(props: CardProps) {
  return (
    <Card data-testid="card" {...props}>
      <CardHeader data-testid="header">
        <CardTitle>Team plan</CardTitle>
        <CardDescription>Billed once a year.</CardDescription>
        <CardAction data-testid="action">
          <Button intent="ghost" size="sm">
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent data-testid="content">
        Twelve seats, four in use.
      </CardContent>
      <CardFooter data-testid="footer">
        <Button intent="secondary">Cancel plan</Button>
        <Button>Add seats</Button>
      </CardFooter>
    </Card>
  );
}

const part = (id: string) => page.getByTestId(id).element();
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);

describe("rendering", () => {
  test("the title is a heading, and the description a paragraph", async () => {
    await render(<Example />);

    const title = page.getByRole("heading", { name: "Team plan", level: 3 });
    await expect.element(title).toHaveClass("nuv-card__title");
    expect(page.getByText("Billed once a year.").element().tagName).toBe("P");
  });

  test("asChild sets the heading level", async () => {
    await render(
      <Card>
        <CardHeader>
          <CardTitle asChild>
            <h2>Team plan</h2>
          </CardTitle>
        </CardHeader>
      </Card>,
    );

    await expect
      .element(page.getByRole("heading", { name: "Team plan", level: 2 }))
      .toHaveClass("nuv-card__title");
  });

  test("every part forwards its ref and keeps a className", async () => {
    const refs = {
      card: createRef<HTMLDivElement>(),
      header: createRef<HTMLDivElement>(),
      title: createRef<HTMLHeadingElement>(),
      description: createRef<HTMLParagraphElement>(),
      action: createRef<HTMLDivElement>(),
      content: createRef<HTMLDivElement>(),
      footer: createRef<HTMLDivElement>(),
    };
    await render(
      <Card ref={refs.card} className="mine">
        <CardHeader ref={refs.header} className="mine">
          <CardTitle ref={refs.title} className="mine">
            Title
          </CardTitle>
          <CardDescription ref={refs.description} className="mine">
            Text
          </CardDescription>
          <CardAction ref={refs.action} className="mine" />
        </CardHeader>
        <CardContent ref={refs.content} className="mine" />
        <CardFooter ref={refs.footer} className="mine" />
      </Card>,
    );

    expect(refs.card.current?.className).toBe("nuv-card mine");
    expect(refs.header.current?.className).toBe("nuv-card__header mine");
    expect(refs.title.current?.className).toBe("nuv-card__title mine");
    expect(refs.description.current?.className).toBe(
      "nuv-card__description mine",
    );
    expect(refs.action.current?.className).toBe("nuv-card__action mine");
    expect(refs.content.current?.className).toBe("nuv-card__content mine");
    expect(refs.footer.current?.className).toBe("nuv-card__footer mine");
  });
});

describe("layout", () => {
  test("the parts are stacked in order, with the same space on both sides", async () => {
    await render(<Example />);
    const card = rect(part("card"));
    const tops = ["header", "content", "footer"].map(
      (id) => rect(part(id)).top,
    );

    expect(tops).toEqual([...tops].sort((a, b) => a - b));
    for (const id of ["header", "content", "footer"]) {
      const inner = style(part(id));
      expect(inner.paddingInlineStart).toBe("16px");
      expect(inner.paddingInlineEnd).toBe("16px");
      expect(rect(part(id)).width).toBe(card.width - 2);
    }
  });

  test("the action sits at the end of the header, level with the title", async () => {
    await render(<Example />);
    const action = rect(part("action"));
    const title = rect(page.getByRole("heading").element());
    const header = rect(part("header"));

    expect(action.left).toBeGreaterThan(title.right);
    expect(Math.abs(action.right - (header.right - 16))).toBeLessThan(1);
    expect(action.top).toBe(title.top);
  });

  test("a header with no action gives the text the whole width", async () => {
    await render(
      <Card>
        <CardHeader data-testid="header">
          <CardTitle>Team plan</CardTitle>
        </CardHeader>
      </Card>,
    );

    expect(rect(page.getByRole("heading").element()).width).toBe(
      rect(part("header")).width - 32,
    );
  });

  test("anything else in the header is stacked in the first column too", async () => {
    await render(
      <Card>
        <CardHeader data-testid="header">
          <div data-testid="first" style={{ height: 10 }} />
          <div data-testid="second" style={{ height: 10 }} />
          <CardAction data-testid="action">
            <Button size="sm">Edit</Button>
          </CardAction>
        </CardHeader>
      </Card>,
    );
    const first = rect(part("first"));
    const second = rect(part("second"));

    expect(second.top).toBeGreaterThan(first.bottom);
    expect(second.left).toBe(first.left);
    expect(second.width).toBe(first.width);
    expect(rect(part("action")).left).toBeGreaterThan(first.right);
  });

  test("the footer's buttons stack on a phone, with the main one on top", async () => {
    await setViewport("phone");
    await render(<Example />);
    const main = rect(
      page.getByRole("button", { name: "Add seats" }).element(),
    );
    const other = rect(
      page.getByRole("button", { name: "Cancel plan" }).element(),
    );

    expect(main.bottom).toBeLessThanOrEqual(other.top);
    expect(main.width).toBe(other.width);
  });

  test("on a wider screen they sit in a row at the end, and the padding grows", async () => {
    await setViewport("desktop");
    await render(<Example />);
    const main = rect(
      page.getByRole("button", { name: "Add seats" }).element(),
    );
    const other = rect(
      page.getByRole("button", { name: "Cancel plan" }).element(),
    );

    expect(main.top).toBe(other.top);
    expect(main.left).toBeGreaterThan(other.right);
    expect(
      Math.abs(main.right - (rect(part("footer")).right - 24)),
    ).toBeLessThan(1);
    expect(style(part("card")).paddingBlockStart).toBe("24px");
  });

  test("an element placed straight inside reaches the card's edges", async () => {
    await render(
      <Card data-testid="card">
        <div data-testid="bleed" style={{ height: 40 }} />
      </Card>,
    );

    expect(rect(part("bleed")).width).toBe(rect(part("card")).width - 2);
  });

  test("a long word breaks instead of widening the card", async () => {
    await setViewport("phone");
    await render(
      <div style={{ width: 240 }}>
        <Card data-testid="card">
          <CardHeader>
            <CardTitle>{"a".repeat(80)}</CardTitle>
            <CardDescription>{"b".repeat(80)}</CardDescription>
          </CardHeader>
        </Card>
      </div>,
    );

    expect(rect(part("card")).width).toBe(240);
    expect(part("card").scrollWidth).toBeLessThanOrEqual(240);
  });
});

describe("styles", () => {
  test("has an edge, a surface and round corners", async () => {
    await render(<Example />);
    const card = style(part("card"));

    expect(card.borderTopWidth).toBe("1px");
    expect(card.borderTopStyle).toBe("solid");
    expect(card.borderTopLeftRadius).toBe("8px");
    expect(card.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("the description is paler than the title", async () => {
    await render(<Example />);

    expect(
      style(page.getByText("Billed once a year.").element()).color,
    ).not.toBe(style(page.getByRole("heading").element()).color);
  });

  test("component variables change the look", async () => {
    await render(
      <Example
        style={
          {
            "--nuv-card-bg": "rgb(10, 20, 30)",
            "--nuv-card-fg": "rgb(200, 210, 220)",
            "--nuv-card-border": "rgb(40, 50, 60)",
            "--nuv-card-radius": "2px",
            "--nuv-card-padding": "10px",
            "--nuv-card-gap": "6px",
            "--nuv-card-shadow": "none",
            "--nuv-card-muted-fg": "rgb(70, 80, 90)",
            "--nuv-card-title-size": "20px",
          } as never
        }
      />,
    );
    const card = style(part("card"));

    expect(card.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(card.color).toBe("rgb(200, 210, 220)");
    expect(card.borderTopColor).toBe("rgb(40, 50, 60)");
    expect(card.borderTopLeftRadius).toBe("2px");
    expect(card.paddingBlockStart).toBe("10px");
    expect(card.rowGap).toBe("6px");
    expect(card.boxShadow).toBe("none");
    expect(style(part("content")).paddingInlineStart).toBe("10px");
    expect(style(page.getByText("Billed once a year.").element()).color).toBe(
      "rgb(70, 80, 90)",
    );
    expect(style(page.getByRole("heading").element()).fontSize).toBe("20px");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe", async () => {
    const screen = await renderThemed(theme, <Example />);

    await expectNoViolations(screen.container);
  });
});
