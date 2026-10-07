import "../../styles/index.scss";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { contrast } from "../../../test/contrast";
import { setViewport } from "../../../test/media";
import {
  expectNoViolations,
  renderThemed,
  themeAttributes,
  themes,
} from "../../../test/themed";
import { Button } from "../button";
import {
  Alert,
  AlertActions,
  AlertDescription,
  type AlertProps,
  AlertTitle,
} from "./alert";

const intents = ["info", "success", "warning", "danger"] as const;

function Example(props: AlertProps) {
  return (
    <Alert data-testid="alert" {...props}>
      <AlertTitle>Payment failed</AlertTitle>
      <AlertDescription>The card was declined.</AlertDescription>
    </Alert>
  );
}

const alert = () => page.getByTestId("alert").element();
const icon = () => alert().querySelector(".nuv-alert__icon") as Element;
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);

describe("rendering", () => {
  test("is an info message by default, with the status role", async () => {
    await render(<Example />);

    expect(alert().className).toBe("nuv-alert nuv-alert--info");
    expect(alert().getAttribute("role")).toBe("status");
  });

  test.each([
    ["info", "status"],
    ["success", "status"],
    ["warning", "alert"],
    ["danger", "alert"],
  ] as const)("intent %s has the %s role", async (intent, role) => {
    await render(<Example intent={intent} />);

    expect(alert().getAttribute("role")).toBe(role);
    expect(alert().classList.contains(`nuv-alert--${intent}`)).toBe(true);
  });

  test("role can be set, for a message that was on the page from the start", async () => {
    await render(<Example intent="danger" role="note" />);

    expect(alert().getAttribute("role")).toBe("note");
  });

  test("each intent draws a different icon, hidden from screen readers", async () => {
    const drawings = new Set<string>();
    for (const intent of intents) {
      const screen = await render(<Example intent={intent} />);
      expect(icon().getAttribute("aria-hidden")).toBe("true");
      drawings.add(icon().innerHTML);
      await screen.unmount();
    }

    expect(drawings.size).toBe(intents.length);
  });

  test("icon replaces the drawing", async () => {
    await render(<Example icon={<span data-testid="mine">!</span>} />);

    expect(icon().querySelector("svg")).toBeNull();
    await expect.element(page.getByTestId("mine")).toBeVisible();
  });

  test.each([null, false])("icon={%s} leaves the icon out", async (icon) => {
    await render(<Example icon={icon} />);

    expect(alert().querySelector(".nuv-alert__icon")).toBeNull();
    expect(alert().children).toHaveLength(1);
  });

  test("asChild makes the title a heading", async () => {
    await render(
      <Alert>
        <AlertTitle asChild>
          <h2>Payment failed</h2>
        </AlertTitle>
      </Alert>,
    );

    await expect
      .element(page.getByRole("heading", { name: "Payment failed", level: 2 }))
      .toHaveClass("nuv-alert__title");
  });

  test("every part forwards its ref and keeps a className", async () => {
    const refs = {
      alert: createRef<HTMLDivElement>(),
      title: createRef<HTMLDivElement>(),
      description: createRef<HTMLDivElement>(),
      actions: createRef<HTMLDivElement>(),
    };
    await render(
      <Alert ref={refs.alert} className="mine">
        <AlertTitle ref={refs.title} className="mine">
          Title
        </AlertTitle>
        <AlertDescription ref={refs.description} className="mine">
          Text
        </AlertDescription>
        <AlertActions ref={refs.actions} className="mine" />
      </Alert>,
    );

    expect(refs.alert.current?.className).toBe(
      "nuv-alert nuv-alert--info mine",
    );
    expect(refs.title.current?.className).toBe("nuv-alert__title mine");
    expect(refs.description.current?.className).toBe(
      "nuv-alert__description mine",
    );
    expect(refs.actions.current?.className).toBe("nuv-alert__actions mine");
  });
});

describe("layout", () => {
  test("the icon sits before the text, level with the title", async () => {
    await render(<Example />);
    const title = rect(page.getByText("Payment failed").element());
    const description = rect(
      page.getByText("The card was declined.").element(),
    );

    expect(rect(icon()).right).toBeLessThan(title.left);
    expect(rect(icon()).top).toBe(title.top);
    expect(rect(icon()).height).toBe(title.height);
    expect(description.top).toBeGreaterThan(title.bottom);
    expect(description.left).toBe(title.left);
  });

  test("the icon is on the right in a right-to-left layout", async () => {
    await render(
      <div dir="rtl">
        <Example />
      </div>,
    );

    expect(rect(icon()).left).toBeGreaterThan(
      rect(page.getByText("Payment failed").element()).right,
    );
  });

  test("the actions sit in a row under the text, and wrap", async () => {
    await render(
      <div style={{ width: 260 }}>
        <Alert data-testid="alert">
          <AlertTitle>Payment failed</AlertTitle>
          <AlertActions data-testid="actions">
            <Button size="sm">Update the card</Button>
            <Button size="sm" intent="secondary">
              Contact support
            </Button>
          </AlertActions>
        </Alert>
      </div>,
    );
    const first = rect(page.getByRole("button").first().element());
    const second = rect(page.getByRole("button").nth(1).element());

    expect(first.top).toBeGreaterThan(
      rect(page.getByText("Payment failed").element()).bottom,
    );
    expect(second.top).toBeGreaterThan(first.top);
    expect(rect(alert()).width).toBe(260);
  });

  test("a long word breaks instead of widening the page", async () => {
    await setViewport("phone");
    await render(
      <Alert>
        <AlertTitle>{"a".repeat(120)}</AlertTitle>
        <AlertDescription>{"b".repeat(120)}</AlertDescription>
      </Alert>,
    );

    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });
});

describe("styles", () => {
  test("each intent has an edge and an icon in a color of its own", async () => {
    const edges = new Set<string>();
    for (const intent of intents) {
      const screen = await render(<Example intent={intent} />);
      expect(style(icon()).color).toBe(style(alert()).borderTopColor);
      edges.add(style(alert()).borderTopColor);
      await screen.unmount();
    }

    expect(edges.size).toBe(intents.length);
  });

  test("the text keeps the surface's color whatever the intent", async () => {
    const screen = await render(<Example intent="info" />);
    const color = style(page.getByText("Payment failed").element()).color;
    await screen.unmount();
    await render(<Example intent="danger" />);

    expect(style(page.getByText("Payment failed").element()).color).toBe(color);
  });

  test("component variables change the look of any intent", async () => {
    await render(
      <Example
        intent="warning"
        style={
          {
            "--nuv-alert-bg": "rgb(10, 20, 30)",
            "--nuv-alert-fg": "rgb(200, 210, 220)",
            "--nuv-alert-border": "rgb(40, 50, 60)",
            "--nuv-alert-icon": "rgb(1, 2, 3)",
            "--nuv-alert-muted-fg": "rgb(70, 80, 90)",
            "--nuv-alert-radius": "2px",
            "--nuv-alert-padding": "10px",
            "--nuv-alert-gap": "6px",
          } as never
        }
      />,
    );
    const look = style(alert());

    expect(look.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(look.color).toBe("rgb(200, 210, 220)");
    expect(look.borderTopColor).toBe("rgb(40, 50, 60)");
    expect(look.borderTopLeftRadius).toBe("2px");
    expect(look.paddingTop).toBe("10px");
    expect(look.columnGap).toBe("6px");
    expect(style(icon()).color).toBe("rgb(1, 2, 3)");
    expect(
      style(page.getByText("The card was declined.").element()).color,
    ).toBe("rgb(70, 80, 90)");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, in every intent", async () => {
    const screen = await renderThemed(
      theme,
      intents.map((intent) => (
        <Alert key={intent} intent={intent}>
          <AlertTitle>{intent}</AlertTitle>
          <AlertDescription>What happened, in a sentence.</AlertDescription>
        </Alert>
      )),
    );

    await expectNoViolations(screen.container);
  });

  test("every intent's icon and edge reach 3:1 against the alert", async () => {
    await render(
      <div {...themeAttributes(theme)}>
        {intents.map((intent) => (
          <Alert key={intent} intent={intent} data-testid={intent}>
            <AlertTitle>{intent}</AlertTitle>
          </Alert>
        ))}
      </div>,
    );

    for (const intent of intents) {
      const element = page.getByTestId(intent).element();
      const look = style(element);
      const drawing = style(
        element.querySelector(".nuv-alert__icon") as Element,
      );
      expect(
        contrast(drawing.color, look.backgroundColor),
        intent,
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrast(look.borderTopColor, look.backgroundColor),
        intent,
      ).toBeGreaterThanOrEqual(3);
    }
  });
});
