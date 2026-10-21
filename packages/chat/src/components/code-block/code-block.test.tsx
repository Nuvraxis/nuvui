import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { CodeBlock, type CodeHighlighter } from ".";

const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);
const one = (selector: string) =>
  document.querySelector(selector) as HTMLElement;
const shown = () => one(".nuv-code-block__code").textContent;
const copy = () => page.getByRole("button", { name: "Copy code" });

const code = "const a = 1;\nconst b = 2;";

// Colors the first word of each line red, at once.
const red: CodeHighlighter = (text) =>
  text.split("\n").map((line) => {
    const space = line.indexOf(" ");
    return space === -1
      ? [{ content: line }]
      : [
          { content: line.slice(0, space), color: "rgb(200, 0, 0)" },
          { content: line.slice(space) },
        ];
  });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("rendering", () => {
  test("it's the code in a pre, with its language over it and a button that copies", async () => {
    await render(<CodeBlock code={code} language="ts" />);
    const block = one(".nuv-code-block");

    expect(block.dataset.language).toBe("ts");
    expect(one(".nuv-code-block__title").textContent).toBe("ts");
    expect(one(".nuv-code-block__pre").tagName).toBe("PRE");
    expect(one(".nuv-code-block__code").tagName).toBe("CODE");
    expect(shown()).toBe(code);
    expect(copy().element().getAttribute("type")).toBe("button");
    // Not colored, and it says so.
    expect(block.hasAttribute("data-highlighted")).toBe(false);
    expect(one(".nuv-code-block__code").children).toHaveLength(0);
  });

  test("title takes the language's place over the code", async () => {
    await render(<CodeBlock code={code} language="ts" title="invoices.ts" />);

    expect(one(".nuv-code-block__title").textContent).toBe("invoices.ts");
    expect(one(".nuv-code-block").dataset.language).toBe("ts");
  });

  test("with no language and no button there's no row over the code", async () => {
    const screen = await render(<CodeBlock code={code} copyable={false} />);
    expect(document.querySelector(".nuv-code-block__head")).toBeNull();
    expect(page.getByRole("button").elements()).toHaveLength(0);

    // With either one, there is.
    await screen.rerender(<CodeBlock code={code} />);
    expect(document.querySelector(".nuv-code-block__head")).not.toBeNull();
    await screen.rerender(
      <CodeBlock code={code} language="ts" copyable={false} />,
    );
    expect(one(".nuv-code-block__title").textContent).toBe("ts");
  });

  test("it takes a ref, a class and other attributes", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <CodeBlock ref={ref} code={code} className="mine" data-kind="a" />,
    );

    expect(ref.current?.className).toBe("nuv-code-block mine");
    expect(ref.current?.dataset.kind).toBe("a");
  });

  test("the box the code scrolls in is named and can take focus", async () => {
    await render(<CodeBlock code={code} label="Quelltext" />);
    const box = page.getByRole("group", { name: "Quelltext" }).element();

    expect(box.getAttribute("tabindex")).toBe("0");
    await userEvent.tab();
    await userEvent.tab();
    expect(document.activeElement).toBe(box);
    expect(style(box).outlineStyle).toBe("solid");
  });
});

describe("long code", () => {
  test("a long line isn't wrapped: it scrolls sideways inside the block, with its padding at both ends", async () => {
    await render(
      <div data-testid="box" style={{ width: 300 }}>
        <CodeBlock code={`const long = "${"x".repeat(200)}";\nshort`} />
      </div>,
    );
    const box = page.getByRole("group", { name: "Code" }).element();

    expect(rect(one(".nuv-code-block")).width).toBe(300);
    expect(box.scrollWidth).toBeGreaterThan(box.clientWidth);
    expect(style(one(".nuv-code-block__pre")).whiteSpace).toBe("pre");
    // The pre is as wide as the longest line and the padding around it.
    expect(
      Math.abs(rect(one(".nuv-code-block__pre")).width - box.scrollWidth),
    ).toBeLessThan(1);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      window.innerWidth,
    );
  });

  test("it's as tall as its lines, and scrolls down once a height is set", async () => {
    const lines = Array.from({ length: 40 }, (_, index) => `line ${index}`);
    const screen = await render(<CodeBlock code={lines.join("\n")} />);
    const box = page.getByRole("group", { name: "Code" }).element();
    expect(box.scrollHeight).toBe(box.clientHeight);

    await screen.rerender(
      <div style={{ "--nuv-code-block-max-height": "120px" } as never}>
        <CodeBlock code={lines.join("\n")} />
      </div>,
    );
    const limited = page.getByRole("group", { name: "Code" }).element();

    expect(rect(limited).height).toBe(120);
    expect(limited.scrollHeight).toBeGreaterThan(limited.clientHeight);
  });
});

describe("copying", () => {
  test("the button copies the code, shows a tick, says so, and goes back after two seconds", async () => {
    const written = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    const onCopy = vi.fn();
    await render(<CodeBlock code={code} language="ts" onCopy={onCopy} />);

    await copy().click();

    expect(written).toHaveBeenCalledWith(code);
    expect(onCopy).toHaveBeenCalledWith(code);
    const button = page.getByRole("button", { name: "Copied" });
    await expect.element(button).toBeVisible();
    expect(button.element().hasAttribute("data-copied")).toBe(true);
    expect(one(".nuv-code-block__status").textContent).toBe("Copied");
    expect(one(".nuv-code-block__status").getAttribute("role")).toBe("status");

    await expect.element(copy(), { timeout: 4000 }).toBeVisible();
    expect(one(".nuv-code-block__status").textContent).toBe("");
  });

  test("where the browser refuses, you're told and nothing is shown as copied", async () => {
    const refusal = new Error("no");
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(refusal);
    const onCopy = vi.fn();
    const onCopyError = vi.fn();
    await render(
      <CodeBlock code={code} onCopy={onCopy} onCopyError={onCopyError} />,
    );

    await copy().click();

    await expect.poll(() => onCopyError.mock.calls.length).toBe(1);
    expect(onCopyError).toHaveBeenCalledWith(refusal);
    expect(onCopy).not.toHaveBeenCalled();
    await expect.element(copy()).toBeVisible();
  });

  test("the button's names are yours, and it doesn't send a form it's in", async () => {
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const onSubmit = vi.fn((event: Event) => event.preventDefault());
    await render(
      <form onSubmit={onSubmit as never}>
        <CodeBlock code={code} copyLabel="Kopieren" copiedLabel="Kopiert" />
      </form>,
    );

    await page.getByRole("button", { name: "Kopieren" }).click();

    await expect
      .element(page.getByRole("button", { name: "Kopiert" }))
      .toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("it copies the code as it is now, when the code has changed", async () => {
    const written = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    const screen = await render(<CodeBlock code="one" />);

    await screen.rerender(<CodeBlock code="one two" />);
    await copy().click();

    expect(written).toHaveBeenCalledWith("one two");
  });
});

describe("colors", () => {
  test("a highlighter is given the code and the language, and its tokens are drawn in its colors", async () => {
    const highlighter = vi.fn(red);
    await render(
      <CodeBlock code={code} language="ts" highlighter={highlighter} />,
    );

    await expect
      .poll(() => one(".nuv-code-block").hasAttribute("data-highlighted"))
      .toBe(true);
    expect(highlighter).toHaveBeenCalledWith(code, "ts");
    // The same text, colored or not.
    expect(shown()).toBe(code);
    const first = one(".nuv-code-block__code span span");
    expect(first.textContent).toBe("const");
    expect(style(first).color).toBe("rgb(200, 0, 0)");
  });

  test("a token's weight, slant and line are drawn too", async () => {
    await render(
      <CodeBlock
        code="abc"
        highlighter={() => [
          [
            { content: "a", fontStyle: "italic" },
            { content: "b", fontWeight: "bold" },
            { content: "c", textDecoration: "underline" },
          ],
        ]}
      />,
    );

    await expect
      .poll(() => one(".nuv-code-block").hasAttribute("data-highlighted"))
      .toBe(true);
    const tokens = [
      ...document.querySelectorAll(".nuv-code-block__code span span"),
    ];
    expect(style(tokens[0] as Element).fontStyle).toBe("italic");
    expect(Number(style(tokens[1] as Element).fontWeight)).toBeGreaterThan(600);
    expect(style(tokens[2] as Element).textDecorationLine).toBe("underline");
  });

  test("one that answers later colors the code when it does, and until then it's in one color", async () => {
    let answer: (lines: ReturnType<typeof red>) => void = () => {};
    const later: CodeHighlighter = () =>
      new Promise((resolve) => {
        answer = resolve as typeof answer;
      });
    await render(<CodeBlock code={code} language="ts" highlighter={later} />);

    expect(shown()).toBe(code);
    expect(one(".nuv-code-block").hasAttribute("data-highlighted")).toBe(false);

    answer(red(code, "ts") as ReturnType<typeof red>);

    await expect
      .poll(() => one(".nuv-code-block").hasAttribute("data-highlighted"))
      .toBe(true);
    expect(shown()).toBe(code);
  });

  test("null, for a language it doesn't know, leaves the code in one color", async () => {
    const highlighter = vi.fn(() => null);
    await render(
      <CodeBlock code={code} language="brainfuck" highlighter={highlighter} />,
    );

    await expect.poll(() => highlighter.mock.calls.length).toBe(1);
    expect(shown()).toBe(code);
    expect(one(".nuv-code-block").hasAttribute("data-highlighted")).toBe(false);
  });

  test("one that fails, at once or later, leaves the code as it was", async () => {
    const screen = await render(
      <CodeBlock
        code={code}
        highlighter={() => {
          throw new Error("broken");
        }}
      />,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(shown()).toBe(code);

    await screen.rerender(
      <CodeBlock
        code={code}
        highlighter={() => Promise.reject(new Error("broken"))}
      />,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(shown()).toBe(code);
    expect(one(".nuv-code-block").hasAttribute("data-highlighted")).toBe(false);
  });

  test("while code is arriving, what's colored stays and what's new follows it, so the text is never behind", async () => {
    // Answers only when told to, with the colors for the code it was
    // asked about.
    const waiting: Array<() => void> = [];
    const slow: CodeHighlighter = (text, language) =>
      new Promise((resolve) => {
        waiting.push(() => resolve(red(text, language)));
      });
    const screen = await render(
      <CodeBlock code="const a" language="ts" highlighter={slow} />,
    );
    waiting.shift()?.();
    await expect
      .poll(() => one(".nuv-code-block").hasAttribute("data-highlighted"))
      .toBe(true);

    await screen.rerender(
      <CodeBlock
        code={"const a = 1;\nconst b"}
        language="ts"
        highlighter={slow}
      />,
    );

    // Not colored again yet: the old colors, and the rest after them.
    expect(shown()).toBe("const a = 1;\nconst b");
    expect(one(".nuv-code-block").hasAttribute("data-highlighted")).toBe(true);
    expect(
      document.querySelectorAll(".nuv-code-block__code span span"),
    ).toHaveLength(2);

    waiting.shift()?.();
    await expect
      .poll(
        () =>
          document.querySelectorAll(".nuv-code-block__code span span").length,
      )
      .toBe(4);
    expect(shown()).toBe("const a = 1;\nconst b");
  });

  test("an answer for code that has since changed to something else is dropped", async () => {
    const waiting: Array<() => void> = [];
    const slow: CodeHighlighter = (text, language) =>
      new Promise((resolve) => {
        waiting.push(() => resolve(red(text, language)));
      });
    const screen = await render(
      <CodeBlock code="first one" highlighter={slow} />,
    );

    await screen.rerender(<CodeBlock code="second" highlighter={slow} />);
    // The answer to the first question, after the second was asked.
    waiting.shift()?.();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(shown()).toBe("second");
    expect(one(".nuv-code-block").hasAttribute("data-highlighted")).toBe(false);
  });

  test("taking the highlighter away takes the colors away", async () => {
    const screen = await render(<CodeBlock code={code} highlighter={red} />);
    await expect
      .poll(() => one(".nuv-code-block").hasAttribute("data-highlighted"))
      .toBe(true);

    await screen.rerender(<CodeBlock code={code} />);

    await expect
      .poll(() => one(".nuv-code-block").hasAttribute("data-highlighted"))
      .toBe(false);
    expect(shown()).toBe(code);
  });
});

describe("styles", () => {
  test("it's set in the type code is set in, in a box with an edge", async () => {
    await render(<CodeBlock code={code} language="ts" />);

    expect(style(one(".nuv-code-block__pre")).fontFamily).toBe(
      style(one(".nuv-code-block__title")).fontFamily,
    );
    expect(style(one(".nuv-code-block__pre")).fontFamily).not.toBe(
      style(document.body).fontFamily,
    );
    expect(style(one(".nuv-code-block")).borderTopStyle).toBe("solid");
  });

  test("with a mouse the button is 28px, at the end of the row", async () => {
    await setViewport("desktop");
    await render(
      <div style={{ width: 300 }}>
        <CodeBlock code={code} language="ts" />
      </div>,
    );
    const button = rect(copy().element());
    const head = rect(one(".nuv-code-block__head"));

    expect(button.width).toBe(28);
    expect(button.height).toBe(28);
    expect(head.right - button.right).toBeLessThanOrEqual(8);
    expect(rect(one(".nuv-code-block__title")).left).toBeGreaterThan(head.left);
  });

  test("component variables change the box", async () => {
    await render(
      <div
        style={
          {
            "--nuv-code-block-bg": "rgb(1, 2, 3)",
            "--nuv-code-block-fg": "rgb(250, 250, 250)",
            "--nuv-code-block-border": "rgb(4, 5, 6)",
            "--nuv-code-block-radius": "3px",
            "--nuv-code-block-font-size": "18px",
            "--nuv-code-block-title-fg": "rgb(7, 8, 9)",
          } as never
        }
      >
        <CodeBlock code={code} language="ts" />
      </div>,
    );
    const block = one(".nuv-code-block");

    expect(style(block).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(style(one(".nuv-code-block__code")).color).toBe(
      "rgb(250, 250, 250)",
    );
    expect(style(block).borderTopColor).toBe("rgb(4, 5, 6)");
    expect(style(block).borderTopLeftRadius).toBe("3px");
    expect(style(one(".nuv-code-block__pre")).fontSize).toBe("18px");
    expect(style(one(".nuv-code-block__title")).color).toBe("rgb(7, 8, 9)");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe plain, colored and with a title", async () => {
    const { container } = await renderThemed(
      theme,
      <div style={{ display: "grid", gap: 16 }}>
        <CodeBlock code={code} language="ts" />
        <CodeBlock
          code={code}
          title="invoices.ts"
          label="Code in invoices.ts"
        />
      </div>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  test("the language and the button's icon can be seen", async () => {
    await renderThemed(theme, <CodeBlock code={code} language="ts" />);
    const ground = style(one(".nuv-code-block")).backgroundColor;

    expect(
      contrast(style(one(".nuv-code-block__title")).color, ground),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(style(copy().element()).color, ground),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrast(style(one(".nuv-code-block__code")).color, ground),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

describe("typing", () => {
  // What's drawn so far, and what's in the page but not drawn yet.
  const typedText = () => {
    const clone = one(".nuv-code-block__code").cloneNode(true) as HTMLElement;
    for (const rest of clone.querySelectorAll(".nuv-code-block__untyped")) {
      rest.remove();
    }
    return clone.textContent;
  };
  const untyped = () =>
    Array.from(document.querySelectorAll(".nuv-code-block__untyped"));
  const caret = () => document.querySelector(".nuv-code-block__caret");
  const phase = () => one(".nuv-code-block").dataset.typing;

  test("types the code out, a character at a time, with a cursor after it", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const onTyped = vi.fn();
    await render(
      <CodeBlock
        code={code}
        language="ts"
        typing
        typingDuration={600}
        onTyped={onTyped}
      />,
    );

    await expect.poll(() => phase()).toBe("typing");
    await expect.poll(() => typedText()?.length ?? 0).toBeGreaterThan(0);
    const part = typedText() ?? "";
    expect(code.startsWith(part)).toBe(true);
    expect(part.length).toBeLessThan(code.length);
    expect(caret()).not.toBeNull();
    expect(caret()?.getAttribute("aria-hidden")).toBe("true");
    expect(onTyped).not.toHaveBeenCalled();

    await expect.poll(() => phase(), { timeout: 3000 }).toBe("done");
    expect(shown()).toBe(code);
    expect(untyped()).toHaveLength(0);
    expect(caret()).toBeNull();
    expect(onTyped).toHaveBeenCalledTimes(1);
  });

  test("the whole code is in the page while it types, and the box has its full size from the start", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <div>
        <CodeBlock code={code} />
        <CodeBlock code={code} typing typingDuration={60_000} />
      </div>,
    );
    const [still, typing] = Array.from(
      document.querySelectorAll(".nuv-code-block"),
    ) as [HTMLElement, HTMLElement];

    await expect.poll(() => typing.dataset.typing).toBe("typing");
    // Every character, for a screen reader and for a copy.
    expect(typing.querySelector(".nuv-code-block__code")?.textContent).toBe(
      code,
    );
    expect(rect(typing).height).toBe(rect(still).height);
    expect(rect(typing).width).toBe(rect(still).width);
    for (const rest of untyped()) expect(style(rest).opacity).toBe("0");
  });

  test("the cursor takes no room, so the characters around it don't move", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<CodeBlock code="abc" typing typingDuration={60_000} />);
    await expect.poll(() => caret()).not.toBeNull();
    const cursor = caret() as HTMLElement;

    expect(rect(cursor).width).toBe(2);
    expect(Number.parseFloat(style(cursor).marginInlineEnd)).toBe(-2);
    expect(style(cursor).animationName).toBe("nuv-code-block-blink");
  });

  test("copying while it types copies the whole code", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    await render(<CodeBlock code={code} typing typingDuration={60_000} />);
    await expect.poll(() => phase()).toBe("typing");

    await userEvent.click(copy());

    expect(writeText).toHaveBeenCalledWith(code);
  });

  test("colors from a highlighter are kept as it types", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <CodeBlock code={code} highlighter={red} typing typingDuration={600} />,
    );

    await expect
      .poll(() => one(".nuv-code-block").hasAttribute("data-highlighted"))
      .toBe(true);
    const first = one(".nuv-code-block__code").querySelector(
      "span[style]",
    ) as HTMLElement;
    expect(style(first).color).toBe("rgb(200, 0, 0)");
    expect(first.textContent).toBe("const");

    await expect.poll(() => phase(), { timeout: 3000 }).toBe("done");
    expect(shown()).toBe(code);
  });

  test("typingDelay waits before it starts", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <CodeBlock code={code} typing typingDelay={400} typingDuration={300} />,
    );

    await expect.poll(() => phase()).toBe("waiting");
    expect(typedText()).toBe("");
    await expect.poll(() => phase(), { timeout: 3000 }).toBe("done");
  });

  test('typingTrigger="view": out of view it waits, and types once it\'s scrolled to', async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <div>
        <div style={{ blockSize: "300vh" }} />
        <CodeBlock
          code={code}
          typing
          typingTrigger="view"
          typingDuration={300}
        />
      </div>,
    );

    await expect.poll(() => phase()).toBe("waiting");
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(phase()).toBe("waiting");
    expect(typedText()).toBe("");

    one(".nuv-code-block").scrollIntoView({ block: "center" });

    await expect.poll(() => phase(), { timeout: 3000 }).toBe("done");
  });

  test("a long line scrolls the box to keep the cursor in view, and not the page", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <div style={{ inlineSize: 200 }}>
        <CodeBlock code={"x".repeat(200)} typing typingDuration={600} />
      </div>,
    );
    const scroller = one(".nuv-code-block__scroller");
    const top = window.scrollY;

    await expect.poll(() => scroller.scrollLeft).toBeGreaterThan(0);
    expect(window.scrollY).toBe(top);
  });

  test("for less motion the whole code is there at once, and onTyped is still called", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const onTyped = vi.fn();
    await render(<CodeBlock code={code} typing onTyped={onTyped} />);

    await expect.poll(() => phase()).toBe("done");
    expect(shown()).toBe(code);
    expect(caret()).toBeNull();
    expect(onTyped).toHaveBeenCalledTimes(1);
  });

  test("the page from the server has the whole code, and a fallback that shows it if the script never runs", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const html = renderToString(<CodeBlock code={code} typing />);

    expect(html).toContain('data-typing="pending"');
    expect(html).toContain("const a = 1;");
    expect(html).toContain("const b = 2;");

    const holder = document.createElement("div");
    holder.innerHTML = html;
    document.body.append(holder);
    const rest = holder.querySelector(".nuv-code-block__untyped") as Element;
    expect(style(rest).opacity).toBe("0");
    expect(style(rest).animationName).toBe("nuv-code-block-shown");
    for (const animation of rest.getAnimations()) animation.finish();
    expect(style(rest).opacity).toBe("1");
    holder.remove();
  });

  test("where the browser forces its own colors the whole code is there at once", async () => {
    await emulateMedia({
      forcedColors: "active",
      reducedMotion: "no-preference",
    });
    await render(<CodeBlock code={code} typing />);

    await expect.poll(() => phase()).toBe("done");
    expect(shown()).toBe(code);
  });

  test("without typing nothing changes", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<CodeBlock code={code} />);

    expect(one(".nuv-code-block").hasAttribute("data-typing")).toBe(false);
    expect(one(".nuv-code-block__code").children).toHaveLength(0);
  });

  test("passes axe while it types", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const { container } = await render(
      <CodeBlock code={code} language="ts" typing typingDuration={60_000} />,
    );
    await expect.poll(() => phase()).toBe("typing");

    expect(await axe(container)).toHaveNoViolations();
  });
});
