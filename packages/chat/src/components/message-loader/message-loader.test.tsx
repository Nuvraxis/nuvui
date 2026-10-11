import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MessageLoader } from ".";

const loader = () =>
  document.querySelector(".nuv-message-loader") as HTMLElement;
const dots = () =>
  Array.from(
    loader().querySelectorAll<HTMLElement>(".nuv-message-loader__dot"),
  );
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);

describe("rendering", () => {
  test("it's three dots that a screen reader doesn't see, and words that only it does", async () => {
    await render(<MessageLoader />);
    const label = loader().querySelector(
      ".nuv-message-loader__label",
    ) as HTMLElement;

    expect(dots().length).toBe(3);
    expect(dots()[0]?.parentElement?.getAttribute("aria-hidden")).toBe("true");
    expect(loader().textContent).toBe("Writing a reply");
    expect(rect(label).width).toBe(1);
    expect(rect(label).height).toBe(1);
  });

  test("the words are yours", async () => {
    await render(<MessageLoader label="Antwort wird geschrieben" />);

    expect(loader().textContent).toBe("Antwort wird geschrieben");
  });

  test("text inside it is shown beside the dots, in place of the hidden words", async () => {
    await render(<MessageLoader>Searching the invoices</MessageLoader>);
    const text = page.getByText("Searching the invoices").element();

    expect(loader().textContent).toBe("Searching the invoices");
    expect(loader().querySelector(".nuv-message-loader__label")).toBe(null);
    expect(rect(text).width).toBeGreaterThan(100);
    expect(rect(text).left).toBeGreaterThan(rect(dots()[2] as Element).right);
  });

  test("it's as tall as a line of a message, so the reply starts where it was", async () => {
    await render(<MessageLoader />);

    expect(rect(loader()).height).toBe(24);
  });

  test("it takes a ref, a class and other attributes, a role among them", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <MessageLoader
        ref={ref}
        className="mine"
        data-kind="wait"
        role="status"
      />,
    );

    expect(ref.current).toBe(loader());
    expect(loader().className).toBe("nuv-message-loader mine");
    expect(loader().dataset.kind).toBe("wait");
    await expect
      .element(page.getByRole("status"))
      .toHaveTextContent("Writing a reply");
  });
});

describe("styles", () => {
  test("the dots are 6px and round, in the color of the text", async () => {
    await render(<MessageLoader />);
    const dot = dots()[0] as HTMLElement;

    expect(rect(dot).width).toBe(6);
    expect(rect(dot).height).toBe(6);
    expect(Number.parseFloat(style(dot).borderTopLeftRadius)).toBeGreaterThan(
      2,
    );
    expect(style(dot).backgroundColor).toBe(style(loader()).color);
  });

  test("they fade one after the other when motion is fine, and are still when it isn't", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<MessageLoader />);

    expect(style(dots()[0] as Element).animationName).toBe(
      "nuv-message-loader-pulse",
    );
    expect(style(dots()[0] as Element).animationDelay).toBe("0s");
    expect(style(dots()[1] as Element).animationDelay).toBe("0.15s");
    expect(style(dots()[2] as Element).animationDelay).toBe("0.3s");

    await emulateMedia({ reducedMotion: "reduce" });
    await expect
      .poll(() => style(dots()[0] as Element).animationName)
      .toBe("none");
  });

  test("component variables change the color and the size of the dots", async () => {
    await render(
      <div
        style={
          {
            "--nuv-message-loader-fg": "rgb(1, 2, 3)",
            "--nuv-message-loader-dot-size": "10px",
          } as never
        }
      >
        <MessageLoader />
      </div>,
    );

    expect(style(dots()[0] as Element).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(rect(dots()[0] as Element).width).toBe(10);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, and the dots can be seen", async () => {
    const { container } = await renderThemed(
      theme,
      <>
        <MessageLoader />
        <MessageLoader>Searching the invoices</MessageLoader>
      </>,
    );
    const ground = style(
      container.querySelector("main") as Element,
    ).backgroundColor;

    expect(await axe(container)).toHaveNoViolations();
    expect(
      contrast(style(dots()[0] as Element).backgroundColor, ground),
    ).toBeGreaterThanOrEqual(3);
  });
});
