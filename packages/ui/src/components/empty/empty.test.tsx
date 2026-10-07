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
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyMedia,
  type EmptyProps,
  EmptyTitle,
} from "./empty";

function Example(props: EmptyProps) {
  return (
    <Empty data-testid="empty" {...props}>
      <EmptyMedia data-testid="media">
        <svg aria-hidden="true" width="24" height="24" />
      </EmptyMedia>
      <EmptyTitle>No invoices yet</EmptyTitle>
      <EmptyDescription>
        Invoices show up here once you send the first one to a customer.
      </EmptyDescription>
      <EmptyActions data-testid="actions">
        <Button>New invoice</Button>
        <Button intent="secondary">Import</Button>
      </EmptyActions>
    </Empty>
  );
}

const part = (id: string) => page.getByTestId(id).element();
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);
const center = (element: Element) =>
  rect(element).left + rect(element).width / 2;

describe("rendering", () => {
  test("the title is a heading, and the picture is hidden from screen readers", async () => {
    await render(<Example />);

    await expect
      .element(page.getByRole("heading", { name: "No invoices yet", level: 3 }))
      .toHaveClass("nuv-empty__title");
    expect(part("media").getAttribute("aria-hidden")).toBe("true");
  });

  test("asChild sets the heading level", async () => {
    await render(
      <Empty>
        <EmptyTitle asChild>
          <h2>No invoices yet</h2>
        </EmptyTitle>
      </Empty>,
    );

    await expect
      .element(page.getByRole("heading", { level: 2 }))
      .toHaveClass("nuv-empty__title");
  });

  test("every part forwards its ref and keeps a className", async () => {
    const refs = {
      empty: createRef<HTMLDivElement>(),
      media: createRef<HTMLDivElement>(),
      title: createRef<HTMLHeadingElement>(),
      description: createRef<HTMLParagraphElement>(),
      actions: createRef<HTMLDivElement>(),
    };
    await render(
      <Empty ref={refs.empty} className="mine">
        <EmptyMedia ref={refs.media} className="mine" />
        <EmptyTitle ref={refs.title} className="mine">
          Title
        </EmptyTitle>
        <EmptyDescription ref={refs.description} className="mine">
          Text
        </EmptyDescription>
        <EmptyActions ref={refs.actions} className="mine" />
      </Empty>,
    );

    expect(refs.empty.current?.className).toBe("nuv-empty mine");
    expect(refs.media.current?.className).toBe("nuv-empty__media mine");
    expect(refs.title.current?.className).toBe("nuv-empty__title mine");
    expect(refs.description.current?.className).toBe(
      "nuv-empty__description mine",
    );
    expect(refs.actions.current?.className).toBe("nuv-empty__actions mine");
  });
});

describe("layout", () => {
  test("everything is centered, in order from top to bottom", async () => {
    await render(<Example />);
    const parts = [
      part("media"),
      page.getByRole("heading").element(),
      page.getByText(/Invoices show up/).element(),
      part("actions"),
    ];
    const tops = parts.map((element) => rect(element).top);

    expect(tops).toEqual([...tops].sort((a, b) => a - b));
    for (const element of parts) {
      expect(Math.abs(center(element) - center(part("empty")))).toBeLessThan(1);
    }
    expect(style(part("empty")).textAlign).toBe("center");
  });

  test("the description keeps to a readable width in a wide box", async () => {
    await setViewport("desktop");
    await render(<Example />);

    expect(style(page.getByText(/Invoices show up/).element()).maxWidth).toBe(
      "448px",
    );
    expect(style(part("empty")).paddingTop).toBe("48px");
  });

  test("fits a phone, with less padding and nothing wider than the page", async () => {
    await setViewport("phone");
    await render(<Example />);

    expect(style(part("empty")).paddingTop).toBe("24px");
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });

  test("buttons that don't fit a row wrap", async () => {
    await render(
      <div style={{ width: 200 }}>
        <Example />
      </div>,
    );
    const first = rect(page.getByRole("button").first().element());
    const second = rect(page.getByRole("button").nth(1).element());

    expect(second.top).toBeGreaterThan(first.top);
    expect(rect(part("empty")).width).toBe(200);
  });

  test("a long word breaks instead of widening the box", async () => {
    await render(
      <div style={{ width: 200 }}>
        <Empty data-testid="empty">
          <EmptyTitle>{"a".repeat(80)}</EmptyTitle>
          <EmptyDescription>{"b".repeat(80)}</EmptyDescription>
        </Empty>
      </div>,
    );

    expect(part("empty").scrollWidth).toBeLessThanOrEqual(200);
  });
});

describe("styles", () => {
  test("has a dashed edge, and a filled box behind the picture", async () => {
    await render(<Example />);

    expect(style(part("empty")).borderTopStyle).toBe("dashed");
    expect(rect(part("media")).width).toBe(48);
    expect(rect(part("media")).height).toBe(48);
    expect(style(part("media")).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("component variables change the look", async () => {
    await render(
      <Example
        style={
          {
            "--nuv-empty-border": "rgb(40, 50, 60)",
            "--nuv-empty-radius": "2px",
            "--nuv-empty-padding": "10px",
            "--nuv-empty-gap": "6px",
            "--nuv-empty-fg": "rgb(200, 210, 220)",
            "--nuv-empty-muted-fg": "rgb(70, 80, 90)",
            "--nuv-empty-media-size": "64px",
            "--nuv-empty-media-bg": "rgb(10, 20, 30)",
            "--nuv-empty-media-fg": "rgb(1, 2, 3)",
            "--nuv-empty-title-size": "20px",
            "--nuv-empty-text-width": "120px",
          } as never
        }
      />,
    );
    const empty = style(part("empty"));
    const media = style(part("media"));
    const description = page.getByText(/Invoices show up/).element();

    expect(empty.borderTopColor).toBe("rgb(40, 50, 60)");
    expect(empty.borderTopLeftRadius).toBe("2px");
    expect(empty.paddingTop).toBe("10px");
    expect(empty.rowGap).toBe("6px");
    expect(empty.color).toBe("rgb(200, 210, 220)");
    expect(style(description).color).toBe("rgb(70, 80, 90)");
    expect(rect(description).width).toBe(120);
    expect(rect(part("media")).width).toBe(64);
    expect(media.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(media.color).toBe("rgb(1, 2, 3)");
    expect(style(page.getByRole("heading").element()).fontSize).toBe("20px");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe", async () => {
    const screen = await renderThemed(theme, <Example />);

    await expectNoViolations(screen.container);
  });
});
