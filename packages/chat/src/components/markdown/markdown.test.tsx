import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { CodeHighlighter } from "../code-block";
import { Message, MessageContent } from "../message";
import { Markdown } from ".";

const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);
const root = () => document.querySelector(".nuv-markdown") as HTMLElement;
const one = (selector: string) => root().querySelector(selector) as HTMLElement;
const all = (selector: string) => [...root().querySelectorAll(selector)];

const reply = `# Overdue

Two invoices are **late**, and one is ~~paid~~ *disputed*. See the [terms](https://example.com/terms).

- First
- Second

1. One
2. Two

> A quote

---

| Invoice | Amount |
| :-- | --: |
| INV-1042 | 4,200 |

Use \`daysLate\` to sort.

\`\`\`ts
const late = true;
\`\`\`
`;

describe("what it draws", () => {
  test("headings, emphasis, links, lists, a quote, a rule and code in a line are their own elements", async () => {
    await render(<Markdown>{reply}</Markdown>);

    expect(one("h1").textContent).toBe("Overdue");
    expect(one("strong").textContent).toBe("late");
    expect(one("del").textContent).toBe("paid");
    expect(one("em").textContent).toBe("disputed");
    expect(one("a").getAttribute("href")).toBe("https://example.com/terms");
    expect(all("ul > li")).toHaveLength(2);
    expect(all("ol > li")).toHaveLength(2);
    expect(one("blockquote").textContent?.trim()).toBe("A quote");
    expect(one("hr")).not.toBeNull();
    expect(one("p code").textContent).toBe("daysLate");
  });

  test("a fenced block is a CodeBlock with its language, and without the line break before the fence", async () => {
    await render(<Markdown>{reply}</Markdown>);
    const block = one(".nuv-code-block");

    expect(block.dataset.language).toBe("ts");
    expect(one(".nuv-code-block__code").textContent).toBe("const late = true;");
    await expect
      .element(page.getByRole("button", { name: "Copy code" }))
      .toBeVisible();
    // Not a pre inside a pre.
    expect(all("pre")).toHaveLength(1);
  });

  test("a block with no language has none, and one indented by four spaces is code too", async () => {
    await render(<Markdown>{"```\nplain\n```\n\n    indented"}</Markdown>);
    const blocks = all(".nuv-code-block") as HTMLElement[];

    expect(blocks).toHaveLength(2);
    expect(blocks[0]?.hasAttribute("data-language")).toBe(false);
    expect(blocks[0]?.querySelector("code")?.textContent).toBe("plain");
    expect(blocks[1]?.querySelector("code")?.textContent).toBe("indented");
  });

  test("a table is a real table in a box that scrolls, named and reachable", async () => {
    await render(
      <div style={{ width: 240 }}>
        <Markdown>
          {
            "| Invoice number | Customer name | Amount owed | Days late |\n| - | - | -: | -: |\n| INV-1042 | Contoso Limited | 4,200 | 12 |"
          }
        </Markdown>
      </div>,
    );
    const box = page.getByRole("group", { name: "Table" }).element();

    expect(box.className).toBe("nuv-markdown__table");
    expect(box.getAttribute("tabindex")).toBe("0");
    expect(page.getByRole("columnheader").elements()).toHaveLength(4);
    expect(one("th").getAttribute("scope")).toBe("col");
    expect(page.getByRole("cell").elements()).toHaveLength(4);
    expect(box.scrollWidth).toBeGreaterThan(box.clientWidth);
    expect(rect(box).width).toBe(240);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      window.innerWidth,
    );
    // The side a column was given.
    expect(
      style(page.getByRole("cell").elements()[2] as Element).textAlign,
    ).toBe("right");
  });

  test("a task list's boxes say which they are, and can't be ticked", async () => {
    await render(<Markdown>{"- [x] Sent\n- [ ] Paid"}</Markdown>);
    const done = page.getByRole("checkbox", { name: "Done" }).element();
    const todo = page.getByRole("checkbox", { name: "To do" }).element();

    expect((done as HTMLInputElement).checked).toBe(true);
    expect((todo as HTMLInputElement).checked).toBe(false);
    expect((done as HTMLInputElement).disabled).toBe(true);
    expect(style(one("ul")).listStyleType).toBe("none");
  });

  test("an address written out becomes a link by itself", async () => {
    await render(<Markdown>See https://example.com/help for more.</Markdown>);

    expect(one("a").getAttribute("href")).toBe("https://example.com/help");
  });

  test("it takes a ref, a class and other attributes, and the words it says are yours", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <Markdown
        ref={ref}
        className="mine"
        data-kind="a"
        tableLabel="Tabelle"
        doneLabel="Erledigt"
        todoLabel="Offen"
        copyLabel="Kopieren"
        codeLabel="Quelltext"
      >
        {"| a |\n| - |\n| b |\n\n- [x] one\n- [ ] two\n\n```\ncode\n```"}
      </Markdown>,
    );

    expect(ref.current?.className).toBe("nuv-markdown mine");
    expect(ref.current?.dataset.kind).toBe("a");
    await expect
      .element(page.getByRole("group", { name: "Tabelle" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("checkbox", { name: "Erledigt" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("checkbox", { name: "Offen" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Kopieren" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("group", { name: "Quelltext" }))
      .toBeVisible();
  });
});

describe("text that isn't trusted", () => {
  test("HTML in the text is shown as text, and never becomes an element", async () => {
    const ran = vi.fn();
    (window as unknown as { ran: () => void }).ran = ran;
    await render(
      <Markdown>
        {
          'Before <img src="x" onerror="ran()"> <script>ran()</script> <b>bold</b>\n\n<iframe src="https://example.com"></iframe>'
        }
      </Markdown>,
    );
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(all("img, script, iframe, b")).toHaveLength(0);
    expect(ran).not.toHaveBeenCalled();
    expect(root().textContent).toContain('<img src="x" onerror="ran()">');
    expect(root().textContent).toContain("<script>");
  });

  test("a link to something that runs loses its address", async () => {
    await render(
      <Markdown>
        {
          "[a](javascript:alert(1)) [b](vbscript:x) [c](data:text/html,x) [d](https://example.com) [e](mailto:a@example.com) [f](/local)"
        }
      </Markdown>,
    );
    const addresses = all("a").map((link) => link.getAttribute("href"));

    expect(addresses).toEqual([
      "",
      "",
      "",
      "https://example.com",
      "mailto:a@example.com",
      "/local",
    ]);
  });

  test("a picture isn't loaded: it's a link with its description as the text", async () => {
    await render(
      <Markdown>
        {
          "![A chart of revenue](https://example.com/chart.png) and ![](https://example.com/none.png)"
        }
      </Markdown>,
    );
    const links = all("a");

    expect(all("img")).toHaveLength(0);
    expect(links[0]?.textContent).toBe("A chart of revenue");
    expect(links[0]?.getAttribute("href")).toBe(
      "https://example.com/chart.png",
    );
    // With no description, its address is the text.
    expect(links[1]?.textContent).toBe("https://example.com/none.png");
  });

  test("a picture whose address would run something is its description and no link", async () => {
    await render(<Markdown>{"![Described](javascript:alert(1))"}</Markdown>);

    expect(all("img, a")).toHaveLength(0);
    expect(root().textContent).toContain("Described");
  });

  test("with allowImages a picture is an img, with its description, and no wider than the text", async () => {
    // An address on this page's own server, so nothing leaves the test.
    await render(
      <Markdown allowImages>{'![A chart](/chart.png "Revenue")'}</Markdown>,
    );
    const image = one("img") as HTMLImageElement;

    expect(image.getAttribute("src")).toBe("/chart.png");
    expect(image.alt).toBe("A chart");
    expect(image.title).toBe("Revenue");
    expect(style(image).maxWidth).toBe("100%");
    expect(all("a")).toHaveLength(0);
  });

  test("with allowImages an address that would run something is still dropped", async () => {
    await render(
      <Markdown allowImages>{"![Described](javascript:alert(1))"}</Markdown>,
    );

    // React leaves an empty address off the element altogether.
    expect(one("img").getAttribute("src") ?? "").toBe("");
    expect(one("img").getAttribute("alt")).toBe("Described");
  });
});

describe("text that's still arriving", () => {
  test("with streaming, a block of code that hasn't closed is a block of code, and bold is bold", async () => {
    const screen = await render(
      <Markdown streaming>{"Some **bold\n\n```ts\nconst a"}</Markdown>,
    );
    expect(one(".nuv-code-block__code").textContent).toBe("const a");
    expect(one(".nuv-code-block").dataset.language).toBe("ts");

    await screen.rerender(<Markdown streaming>{"Some **bold"}</Markdown>);
    expect(one("strong").textContent).toBe("bold");
    expect(root().textContent).not.toContain("*");
  });

  test("a link whose address is still arriving is its text", async () => {
    await render(
      <Markdown streaming>{"See [the terms](https://exa"}</Markdown>,
    );

    expect(all("a")).toHaveLength(0);
    expect(root().textContent).toBe("See the terms");
  });

  test("without streaming the text is drawn as it was written", async () => {
    await render(<Markdown>{"Some **bold"}</Markdown>);

    expect(all("strong")).toHaveLength(0);
    expect(root().textContent).toBe("Some **bold");
  });

  test("a block of code keeps its place as the text grows, and isn't made anew", async () => {
    const screen = await render(
      <Markdown streaming>{"```ts\nconst a"}</Markdown>,
    );
    const before = one(".nuv-code-block");

    await screen.rerender(
      <Markdown streaming>{"```ts\nconst a = 1;\nconst b"}</Markdown>,
    );

    expect(one(".nuv-code-block")).toBe(before);
    expect(one(".nuv-code-block__code").textContent).toBe(
      "const a = 1;\nconst b",
    );
  });
});

describe("colored code", () => {
  const red: CodeHighlighter = (text) =>
    text
      .split("\n")
      .map((line) => [{ content: line, color: "rgb(200, 0, 0)" }]);

  test("the highlighter is handed each block's code and language", async () => {
    const highlighter = vi.fn(red);
    await render(
      <Markdown highlighter={highlighter}>
        {"```ts\nconst a = 1;\n```\n\n```py\nb = 2\n```"}
      </Markdown>,
    );

    await expect
      .poll(() => all(".nuv-code-block[data-highlighted]").length)
      .toBe(2);
    expect(highlighter).toHaveBeenCalledWith("const a = 1;", "ts");
    expect(highlighter).toHaveBeenCalledWith("b = 2", "py");
    expect(style(one(".nuv-code-block__code span span")).color).toBe(
      "rgb(200, 0, 0)",
    );
  });

  test("code in a line isn't handed to it", async () => {
    const highlighter = vi.fn(red);
    await render(
      <Markdown highlighter={highlighter}>{"Use `daysLate`."}</Markdown>,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(highlighter).not.toHaveBeenCalled();
  });
});

describe("headings and your own elements", () => {
  test("headingOffset moves every heading down, and none past h6", async () => {
    await render(
      <Markdown headingOffset={2}>{"# One\n\n## Two\n\n###### Six"}</Markdown>,
    );

    expect(one("h3").textContent).toBe("One");
    expect(one("h4").textContent).toBe("Two");
    expect(one("h6").textContent).toBe("Six");
    expect(all("h1, h2")).toHaveLength(0);
  });

  test("components puts an element of yours in place of one", async () => {
    await render(
      <Markdown
        components={{
          a: ({ node: _node, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer" data-mine="" />
          ),
        }}
      >
        {"[terms](https://example.com/terms)"}
      </Markdown>,
    );
    const link = one("a") as HTMLAnchorElement;

    expect(link.target).toBe("_blank");
    expect(link.rel).toBe("noreferrer");
    expect(link.hasAttribute("data-mine")).toBe(true);
    expect(link.getAttribute("href")).toBe("https://example.com/terms");
  });
});

describe("styles", () => {
  test("its parts have the same space between them, and none before the first or after the last", async () => {
    await render(
      <div data-testid="box" style={{ width: 400 }}>
        <Markdown>{"One\n\nTwo\n\n- a\n- b\n\nThree"}</Markdown>
      </div>,
    );
    const parts = [...root().children].map(rect);
    const box = rect(root());

    const space = (index: number) =>
      Math.round((parts[index + 1]?.top ?? 0) - (parts[index]?.bottom ?? 0));

    expect(parts).toHaveLength(4);
    expect(Math.round((parts[0]?.top ?? 0) - box.top)).toBe(0);
    expect(Math.round(box.bottom - (parts.at(-1)?.bottom ?? 0))).toBe(0);
    expect([space(0), space(1), space(2)]).toEqual([12, 12, 12]);
  });

  test("in a message, the line breaks between its parts add no lines of their own", async () => {
    await render(
      <div style={{ width: 400 }}>
        <Message from="assistant">
          <MessageContent>
            <Markdown>{"One\n\nTwo"}</Markdown>
          </MessageContent>
        </Message>
      </div>,
    );
    const [first, second] = all("p").map(rect);

    expect(style(root()).whiteSpace).toBe("normal");
    expect(Math.round((second?.top ?? 0) - (first?.bottom ?? 0))).toBe(12);
  });

  test("a link is underlined, and shows a ring from the keyboard", async () => {
    await render(<Markdown>{"[terms](https://example.com/terms)"}</Markdown>);
    const link = one("a");

    expect(style(link).textDecorationLine).toBe("underline");
    await userEvent.tab();
    // Safari leaves links out of the Tab order until its owner turns that
    // on. Where Tab reaches the link, it shows a ring.
    if (document.activeElement === link) {
      expect(style(link).outlineStyle).toBe("solid");
    }
  });

  test("code in a line has a background and the code's type, and a block's code doesn't get it", async () => {
    await render(<Markdown>{"Use `daysLate`.\n\n```\nblock\n```"}</Markdown>);
    const inline = one("p code");
    const block = one(".nuv-code-block__code");

    expect(style(inline).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(style(inline).fontFamily).toBe(style(block).fontFamily);
    expect(style(block).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(style(block).paddingLeft).toBe("0px");
  });

  test("a long word breaks and doesn't push the text wider", async () => {
    await render(
      <div data-testid="box" style={{ width: 200 }}>
        <Markdown>{`A ${"long".repeat(60)} word and \`${"code".repeat(40)}\``}</Markdown>
      </div>,
    );

    expect(root().scrollWidth).toBeLessThanOrEqual(200);
    expect(rect(one("p")).width).toBeLessThanOrEqual(200);
  });

  test("a rule of yours with one class wins over the block's", async () => {
    const sheet = document.createElement("style");
    sheet.textContent = ".mine-heading { font-size: 40px; }";
    document.head.append(sheet);
    await render(
      <Markdown
        components={{
          h1: ({ node: _node, ...props }) => (
            <h1 {...props} className="mine-heading" />
          ),
        }}
      >
        {"# Big"}
      </Markdown>,
    );

    expect(style(one("h1")).fontSize).toBe("40px");
    sheet.remove();
  });

  test("component variables change the space, the link, the lines and the code", async () => {
    await render(
      <div
        style={
          {
            "--nuv-markdown-gap": "20px",
            "--nuv-markdown-link-fg": "rgb(1, 2, 3)",
            "--nuv-markdown-border": "rgb(4, 5, 6)",
            "--nuv-markdown-code-bg": "rgb(7, 8, 9)",
            "--nuv-markdown-code-fg": "rgb(250, 250, 250)",
            "--nuv-markdown-quote-fg": "rgb(10, 11, 12)",
            "--nuv-markdown-table-head-bg": "rgb(13, 14, 15)",
          } as never
        }
      >
        <Markdown>
          {"[a](https://example.com) and `b`\n\n> c\n\n| d |\n| - |\n| e |"}
        </Markdown>
      </div>,
    );

    expect(style(root()).rowGap).toBe("20px");
    expect(style(one("a")).color).toBe("rgb(1, 2, 3)");
    expect(style(one(".nuv-markdown__table")).borderTopColor).toBe(
      "rgb(4, 5, 6)",
    );
    expect(style(one("p code")).backgroundColor).toBe("rgb(7, 8, 9)");
    expect(style(one("p code")).color).toBe("rgb(250, 250, 250)");
    expect(style(one("blockquote")).color).toBe("rgb(10, 11, 12)");
    expect(style(one("th")).backgroundColor).toBe("rgb(13, 14, 15)");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe with everything it draws", async () => {
    const { container } = await renderThemed(
      theme,
      <Markdown
        headingOffset={1}
      >{`${reply}\n- [x] Sent\n- [ ] Paid`}</Markdown>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  test("a quote, code in a line and a table's heading can be read", async () => {
    const { container } = await renderThemed(
      theme,
      <Markdown>{reply}</Markdown>,
    );
    const ground = style(
      container.querySelector("main") as Element,
    ).backgroundColor;
    const inline = style(one("p code"));
    const head = style(one("th"));

    expect(
      contrast(style(one("blockquote")).color, ground),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(inline.color, inline.backgroundColor),
    ).toBeGreaterThanOrEqual(4.5);
    expect(contrast(head.color, head.backgroundColor)).toBeGreaterThanOrEqual(
      4.5,
    );
  });
});
