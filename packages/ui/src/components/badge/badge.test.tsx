import "../../styles/index.scss";
import { contrast } from "@nuvui/tooling/test/contrast";
import {
  expectNoViolations,
  renderThemed,
  themeAttributes,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Badge } from "./badge";

const intents = ["neutral", "primary", "success", "warning", "danger"] as const;
const variants = ["solid", "outline"] as const;
const style = (element: Element) => getComputedStyle(element);
const badge = (name: string) => page.getByText(name, { exact: true }).element();

describe("rendering", () => {
  test("is a span, neutral and solid by default", async () => {
    await render(<Badge>Draft</Badge>);

    expect(badge("Draft").tagName).toBe("SPAN");
    expect(badge("Draft").className).toBe("nuv-badge nuv-badge--neutral");
  });

  test.each(intents)("intent %s sets a class", async (intent) => {
    await render(<Badge intent={intent}>Label</Badge>);

    expect(badge("Label").classList.contains(`nuv-badge--${intent}`)).toBe(
      true,
    );
  });

  test("outline adds a class next to the intent's", async () => {
    await render(
      <Badge intent="danger" variant="outline">
        Failed
      </Badge>,
    );

    expect(badge("Failed").className).toBe(
      "nuv-badge nuv-badge--danger nuv-badge--outline",
    );
  });

  test("forwards its ref, a className and other props", async () => {
    const ref = createRef<HTMLSpanElement>();
    await render(
      <Badge ref={ref} className="mine" title="Three unread">
        3
      </Badge>,
    );

    expect(ref.current?.className).toBe("nuv-badge nuv-badge--neutral mine");
    expect(ref.current?.title).toBe("Three unread");
  });
});

describe("layout", () => {
  test("is a pill as tall as a line of small text, and stays on one line", async () => {
    await render(
      <div style={{ width: 60 }}>
        <Badge>Waiting for review</Badge>
      </div>,
    );
    const element = badge("Waiting for review");

    // 16px of text, 2px of padding and a 1px edge each side.
    expect(element.getBoundingClientRect().height).toBe(22);
    expect(style(element).whiteSpace).toBe("nowrap");
    expect(
      Number.parseFloat(style(element).borderTopLeftRadius),
    ).toBeGreaterThan(11);
  });

  test("an icon and the text are a row with a gap", async () => {
    await render(
      <Badge>
        <svg aria-hidden="true" width="12" height="12" data-testid="icon" />
        Live
      </Badge>,
    );

    expect(style(badge("Live")).display).toBe("inline-flex");
    expect(style(badge("Live")).columnGap).toBe("4px");
  });
});

describe("styles", () => {
  test("every solid intent has a fill of its own", async () => {
    await render(
      intents.map((intent) => (
        <Badge key={intent} intent={intent}>
          {intent}
        </Badge>
      )),
    );
    const fills = intents.map((intent) => style(badge(intent)).backgroundColor);

    expect(new Set(fills).size).toBe(intents.length);
  });

  test("an outlined badge has the surface as its fill and an edge in the intent's color", async () => {
    await render(
      <>
        <Badge intent="success">solid</Badge>
        <Badge intent="success" variant="outline">
          outline
        </Badge>
      </>,
    );

    expect(style(badge("outline")).borderTopColor).toBe(
      style(badge("solid")).backgroundColor,
    );
    expect(style(badge("outline")).backgroundColor).not.toBe(
      style(badge("solid")).backgroundColor,
    );
  });

  test("component variables change the look of any intent", async () => {
    await render(
      <Badge
        intent="danger"
        style={
          {
            "--nuv-badge-bg": "rgb(10, 20, 30)",
            "--nuv-badge-fg": "rgb(200, 210, 220)",
            "--nuv-badge-border": "rgb(40, 50, 60)",
            "--nuv-badge-radius": "2px",
            "--nuv-badge-padding-inline": "10px",
            "--nuv-badge-padding-block": "5px",
            "--nuv-badge-font-size": "14px",
            "--nuv-badge-gap": "9px",
          } as never
        }
      >
        Custom
      </Badge>,
    );
    const custom = style(badge("Custom"));

    expect(custom.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(custom.color).toBe("rgb(200, 210, 220)");
    expect(custom.borderTopColor).toBe("rgb(40, 50, 60)");
    expect(custom.borderTopLeftRadius).toBe("2px");
    expect(custom.paddingInlineStart).toBe("10px");
    expect(custom.paddingBlockStart).toBe("5px");
    expect(custom.fontSize).toBe("14px");
    expect(custom.columnGap).toBe("9px");
  });
});

// axe measures text against its background. This also measures the edge of
// an outlined badge, which is what says its intent.
describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, in every intent and variant", async () => {
    const screen = await renderThemed(
      theme,
      variants.flatMap((variant) =>
        intents.map((intent) => (
          <Badge key={variant + intent} intent={intent} variant={variant}>
            {`${variant} ${intent}`}
          </Badge>
        )),
      ),
    );

    await expectNoViolations(screen.container);
  });

  test("the text of every badge reaches 4.5:1", async () => {
    await render(
      <div {...themeAttributes(theme)}>
        {variants.flatMap((variant) =>
          intents.map((intent) => (
            <Badge key={variant + intent} intent={intent} variant={variant}>
              {`${variant} ${intent}`}
            </Badge>
          )),
        )}
      </div>,
    );

    for (const variant of variants) {
      for (const intent of intents) {
        const look = style(badge(`${variant} ${intent}`));
        expect(
          contrast(look.color, look.backgroundColor),
          `${variant} ${intent}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  test("an outlined badge's edge reaches 3:1 against its fill", async () => {
    await render(
      <div {...themeAttributes(theme)}>
        {intents.map((intent) => (
          <Badge key={intent} intent={intent} variant="outline">
            {intent}
          </Badge>
        ))}
      </div>,
    );

    for (const intent of intents) {
      const look = style(badge(intent));
      expect(
        contrast(look.borderTopColor, look.backgroundColor),
        intent,
      ).toBeGreaterThanOrEqual(3);
    }
  });
});
