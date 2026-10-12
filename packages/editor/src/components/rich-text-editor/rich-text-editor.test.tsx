import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { Button } from "@nuvui/react/button";
import { ToolbarSeparator } from "@nuvui/react/toolbar";
import { axe, behindOpenList } from "@nuvui/tooling/test/axe";
import { setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef, useState } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  RichTextEditor,
  RichTextEditorActions,
  type RichTextEditorChange,
  RichTextEditorContent,
  RichTextEditorCount,
  RichTextEditorFormats,
  type RichTextEditorHandle,
  RichTextEditorLink,
  RichTextEditorToolbar,
} from ".";

const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);
const one = (selector: string) =>
  document.querySelector(selector) as HTMLElement;

const box = () => page.getByRole("textbox", { name: "Notes" });
const text = () => box().element() as HTMLElement;
const button = (name: string) =>
  page.getByRole("toolbar", { name: "Formatting" }).getByRole("button", {
    name,
    exact: true,
  });
const pressed = (name: string) =>
  button(name).element().getAttribute("aria-pressed");

type EditorProps = Partial<ComponentProps<typeof RichTextEditor>>;

// The editor is made once the page has drawn, so a test waits for the
// text to be there before it does anything to it.
async function mount(props: EditorProps = {}) {
  const result = await render(<RichTextEditor aria-label="Notes" {...props} />);
  await expect.element(box()).toBeInTheDocument();
  return result;
}

async function write(keys: string) {
  await userEvent.click(text());
  await userEvent.keyboard(keys);
}

const selectAll = () => userEvent.keyboard("{Control>}a{/Control}");

beforeEach(async () => {
  await setViewport("desktop");
});

describe("rendering", () => {
  test("it's a box with a named toolbar over text that's a named textbox of many lines", async () => {
    await mount();

    expect(one(".nuv-rich-text-editor")).not.toBeNull();
    expect(
      page.getByRole("toolbar", { name: "Formatting" }).element().className,
    ).toBe("nuv-toolbar nuv-rich-text-editor__toolbar");
    expect(text().className).toContain("nuv-rich-text-editor__content");
    expect(text().getAttribute("aria-multiline")).toBe("true");
    expect(text().getAttribute("contenteditable")).toBe("true");
  });

  test("the toolbar has every format, the link and undo and redo, each named", async () => {
    await mount();

    for (const name of [
      "Bold",
      "Italic",
      "Underline",
      "Strikethrough",
      "Code",
      "Heading 2",
      "Heading 3",
      "Bulleted list",
      "Numbered list",
      "Quote",
      "Code block",
      "Link",
      "Undo",
      "Redo",
    ]) {
      expect(button(name).elements(), name).toHaveLength(1);
    }
    expect(
      page.getByRole("group", { name: "Text style" }).elements(),
    ).toHaveLength(1);
    expect(page.getByRole("group", { name: "Blocks" }).elements()).toHaveLength(
      1,
    );
  });

  test("headingLevels chooses which headings there are", async () => {
    await mount({ headingLevels: [1, 4] });

    expect(button("Heading 1").elements()).toHaveLength(1);
    expect(button("Heading 4").elements()).toHaveLength(1);
    expect(button("Heading 2").elements()).toHaveLength(0);
  });

  test("the placeholder is shown while nothing is written, and said as one", async () => {
    await mount({ placeholder: "Write a note" });
    const line = one(".nuv-rich-text-editor__placeholder");

    expect(line.dataset.placeholder).toBe("Write a note");
    expect(getComputedStyle(line, "::before").content).toBe('"Write a note"');
    expect(text().getAttribute("aria-placeholder")).toBe("Write a note");

    await write("Hi");
    expect(document.querySelector(".nuv-rich-text-editor__placeholder")).toBe(
      null,
    );
  });

  test("the root takes a ref, a class and other attributes, and what names the field goes to the text", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <>
        <span id="notes-label">Notes</span>
        <span id="notes-help">Shown on the invoice.</span>
        <RichTextEditor
          ref={ref}
          className="mine"
          data-testid="editor"
          aria-labelledby="notes-label"
          aria-describedby="notes-help"
          aria-required
          aria-invalid
        />
      </>,
    );
    await expect.element(box()).toBeInTheDocument();

    expect(ref.current?.className).toBe("nuv-rich-text-editor mine");
    expect(ref.current?.dataset.testid).toBe("editor");
    expect(ref.current?.hasAttribute("aria-labelledby")).toBe(false);
    expect(ref.current?.hasAttribute("data-invalid")).toBe(true);
    expect(text().getAttribute("aria-describedby")).toBe("notes-help");
    expect(text().getAttribute("aria-required")).toBe("true");
    expect(text().getAttribute("aria-invalid")).toBe("true");
  });

  test("a part outside an editor says what it needs", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(render(<RichTextEditorToolbar />)).rejects.toThrow(
      "RichTextEditorToolbar has to be inside a RichTextEditor.",
    );

    quiet.mockRestore();
  });
});

describe("the value", () => {
  test("defaultValue is the text to begin with", async () => {
    await mount({ defaultValue: "<p>Paid <strong>in full</strong>.</p>" });

    expect(text().querySelector("strong")?.textContent).toBe("in full");
    expect(text().textContent).toBe("Paid in full.");
  });

  test("typing reports the HTML, and beside it the words, the counts and the same as data", async () => {
    const onValueChange = vi.fn();
    await mount({ onValueChange });

    await write("Two words");

    await expect
      .poll(() => onValueChange.mock.lastCall?.[0])
      .toBe("<p>Two words</p>");
    const change = onValueChange.mock.lastCall?.[1] as RichTextEditorChange;
    expect(change.text).toBe("Two words");
    expect(change.characters).toBe(9);
    expect(change.words).toBe(2);
    expect(change.empty).toBe(false);
    expect(change.json).toMatchObject({
      type: "doc",
      content: [{ type: "paragraph" }],
    });
  });

  test("nothing written is the empty string, not an empty paragraph", async () => {
    const onValueChange = vi.fn();
    await mount({ onValueChange, defaultValue: "<p>Hi</p>" });

    await userEvent.click(text());
    await selectAll();
    await userEvent.keyboard("{Backspace}");

    await expect.poll(() => onValueChange.mock.lastCall?.[0]).toBe("");
    expect(onValueChange.mock.lastCall?.[1].empty).toBe(true);
  });

  test("kept by you, it follows what you set it to", async () => {
    function Kept() {
      const [value, setValue] = useState("<p>First</p>");
      return (
        <>
          <RichTextEditor
            aria-label="Notes"
            value={value}
            onValueChange={setValue}
          />
          <Button onClick={() => setValue("<p>Second</p>")}>Replace</Button>
          <output>{value}</output>
        </>
      );
    }
    await render(<Kept />);
    await expect.element(box()).toBeInTheDocument();
    expect(text().textContent).toBe("First");

    await page.getByRole("button", { name: "Replace" }).click();
    await expect.poll(() => text().textContent).toBe("Second");
  });

  test("kept by you, typing goes on from where the caret is", async () => {
    function Kept() {
      const [value, setValue] = useState("");
      return (
        <>
          <RichTextEditor
            aria-label="Notes"
            value={value}
            onValueChange={setValue}
          />
          <output>{value}</output>
        </>
      );
    }
    await render(<Kept />);
    await expect.element(box()).toBeInTheDocument();

    await write("abc def");

    await expect.poll(() => one("output").textContent).toBe("<p>abc def</p>");
    expect(text().textContent).toBe("abc def");
  });

  test("a script, an event handler and an address that would run something are not kept", async () => {
    const editorRef = createRef<RichTextEditorHandle>();
    await mount({
      editorRef,
      defaultValue:
        '<p onclick="alert(1)">Hi</p><script>alert(1)</script><p><a href="javascript:alert(1)">run</a></p><img src="x" onerror="alert(1)">',
    });

    const html = editorRef.current?.getHTML() ?? "";
    expect(html).toContain("Hi");
    expect(html).not.toContain("script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("onerror");
    expect(text().querySelector("script, img")).toBeNull();
  });
});

describe("formatting", () => {
  test("a toggle formats what's selected, and is on while the caret is in it", async () => {
    const editorRef = createRef<RichTextEditorHandle>();
    await mount({ editorRef, defaultValue: "<p>Hello</p>" });
    await userEvent.click(text());
    await selectAll();
    expect(pressed("Bold")).toBe("false");

    await button("Bold").click();

    await expect
      .poll(() => editorRef.current?.getHTML())
      .toBe("<p><strong>Hello</strong></p>");
    await expect.poll(() => pressed("Bold")).toBe("true");
    expect(document.activeElement).toBe(text());

    await button("Bold").click();
    await expect.poll(() => editorRef.current?.getHTML()).toBe("<p>Hello</p>");
  });

  test("each mark writes its own element", async () => {
    const editorRef = createRef<RichTextEditorHandle>();
    await mount({ editorRef, defaultValue: "<p>Hello</p>" });
    await userEvent.click(text());
    await selectAll();

    for (const [name, tag] of [
      ["Italic", "em"],
      ["Underline", "u"],
      ["Strikethrough", "s"],
    ] as const) {
      await button(name).click();
      await expect
        .poll(() => text().querySelector(tag)?.textContent)
        .toBe("Hello");
    }
  });

  test("the keyboard's own shortcut does the same, and the toggle follows", async () => {
    const editorRef = createRef<RichTextEditorHandle>();
    await mount({ editorRef, defaultValue: "<p>Hello</p>" });
    await userEvent.click(text());
    await selectAll();

    await userEvent.keyboard("{Control>}b{/Control}");

    await expect
      .poll(() => editorRef.current?.getHTML())
      .toBe("<p><strong>Hello</strong></p>");
    await expect.poll(() => pressed("Bold")).toBe("true");
  });

  test("a heading, a list, a quote and a block of code each change the line the caret is in", async () => {
    const editorRef = createRef<RichTextEditorHandle>();
    await mount({ editorRef, defaultValue: "<p>Hello</p>" });
    const html = () => editorRef.current?.getHTML();
    await userEvent.click(text());

    await button("Heading 2").click();
    await expect.poll(html).toBe("<h2>Hello</h2>");
    await expect.poll(() => pressed("Heading 2")).toBe("true");
    await button("Heading 2").click();
    await expect.poll(html).toBe("<p>Hello</p>");

    await button("Bulleted list").click();
    await expect.poll(html).toBe("<ul><li><p>Hello</p></li></ul>");
    await button("Numbered list").click();
    await expect.poll(html).toBe("<ol><li><p>Hello</p></li></ol>");
    await expect.poll(() => pressed("Bulleted list")).toBe("false");
    await button("Numbered list").click();

    await button("Quote").click();
    await expect.poll(html).toBe("<blockquote><p>Hello</p></blockquote>");
    await button("Quote").click();

    await button("Code block").click();
    await expect.poll(html).toBe("<pre><code>Hello</code></pre>");
  });

  test("undo is off until there's something to undo, and redo until something is undone", async () => {
    const editorRef = createRef<RichTextEditorHandle>();
    await mount({ editorRef });
    expect((button("Undo").element() as HTMLButtonElement).disabled).toBe(true);
    expect((button("Redo").element() as HTMLButtonElement).disabled).toBe(true);

    await write("Hello");
    await expect
      .poll(() => (button("Undo").element() as HTMLButtonElement).disabled)
      .toBe(false);

    await button("Undo").click();
    await expect.poll(() => editorRef.current?.getHTML()).toBe("");
    await expect
      .poll(() => (button("Redo").element() as HTMLButtonElement).disabled)
      .toBe(false);

    await button("Redo").click();
    await expect.poll(() => editorRef.current?.getText()).toBe("Hello");
  });

  test("the toolbar is one Tab stop, the arrow keys move along it, and Tab goes on to the text", async () => {
    await mount({ defaultValue: "<p>Hello</p>" });
    (button("Bold").element() as HTMLElement).focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(button("Italic").element());

    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(text());
  });
});

describe("links", () => {
  const address = () => page.getByRole("textbox", { name: "Web address" });

  test("the button opens a box for the address, and Enter makes what's selected a link", async () => {
    const editorRef = createRef<RichTextEditorHandle>();
    await mount({ editorRef, defaultValue: "<p>Our terms</p>" });
    await userEvent.click(text());
    await selectAll();

    await button("Link").click();
    await expect.element(address()).toBeVisible();
    await userEvent.type(address(), "example.com/terms{Enter}");

    await expect
      .poll(() => text().querySelector("a")?.getAttribute("href"))
      .toBe("https://example.com/terms");
    expect(text().querySelector("a")?.textContent).toBe("Our terms");
    expect(text().querySelector("a")?.getAttribute("rel")).toContain(
      "noopener",
    );
    await expect.poll(() => address().elements().length).toBe(0);
  });

  test("with nothing selected, the address is written as the link's words", async () => {
    await mount();
    await userEvent.click(text());

    await button("Link").click();
    await userEvent.type(address(), "mailto:billing@example.com{Enter}");

    await expect
      .poll(() => text().querySelector("a")?.textContent)
      .toBe("mailto:billing@example.com");
    expect(text().querySelector("a")?.getAttribute("href")).toBe(
      "mailto:billing@example.com",
    );
  });

  test("an address that would run something is refused, and the box says why", async () => {
    await mount({ defaultValue: "<p>Our terms</p>" });
    await userEvent.click(text());
    await selectAll();

    await button("Link").click();
    await userEvent.type(address(), "javascript:alert(1){Enter}");

    await expect
      .element(page.getByText("Enter a web address, an email address"))
      .toBeVisible();
    expect(address().element().getAttribute("aria-invalid")).toBe("true");
    expect(text().querySelector("a")).toBeNull();
  });

  test("on a link the box has its address, and a button takes the link off", async () => {
    await mount({
      defaultValue: '<p><a href="https://example.com">Our terms</a></p>',
    });
    await userEvent.click(text().querySelector("a") as HTMLElement);
    await expect.poll(() => pressed("Link")).toBe("true");

    await button("Link").click();
    await expect
      .poll(() => (address().element() as HTMLInputElement).value)
      .toBe("https://example.com");
    await page.getByRole("button", { name: "Remove link" }).click();

    await expect.poll(() => text().querySelector("a")).toBeNull();
    expect(text().textContent).toBe("Our terms");
  });

  test("a click on a link in the text doesn't leave the page", async () => {
    await mount({
      defaultValue: '<p><a href="#somewhere">Our terms</a></p>',
    });

    await userEvent.click(text().querySelector("a") as HTMLElement);

    expect(location.hash).toBe("");
  });
});

describe("a limit", () => {
  test("the count says how much is written and how much can be", async () => {
    await mount({ maxLength: 10 });
    const count = () => one(".nuv-rich-text-editor__count");
    expect(count().textContent).toBe("0 of 10 characters");

    await write("Hello");

    await expect.poll(() => count().textContent).toBe("5 of 10 characters");
    expect(count().hasAttribute("data-full")).toBe(false);
  });

  test("typing stops at the limit, and the count shows it's full", async () => {
    const editorRef = createRef<RichTextEditorHandle>();
    await mount({ editorRef, maxLength: 5 });

    await write("Hello there");

    await expect.poll(() => editorRef.current?.getText()).toBe("Hello");
    expect(one(".nuv-rich-text-editor__count").textContent).toBe(
      "5 of 5 characters",
    );
    expect(one(".nuv-rich-text-editor__count").hasAttribute("data-full")).toBe(
      true,
    );
  });

  test("with no limit there's no count unless it's asked for", async () => {
    await mount();
    expect(document.querySelector(".nuv-rich-text-editor__count")).toBeNull();
  });
});

describe("disabled and read only", () => {
  test("disabled, it can't be written in, the toolbar is off, and it says so", async () => {
    await mount({ disabled: true, defaultValue: "<p>Hello</p>" });

    expect(text().getAttribute("contenteditable")).toBe("false");
    expect(text().getAttribute("aria-disabled")).toBe("true");
    expect(one(".nuv-rich-text-editor").hasAttribute("data-disabled")).toBe(
      true,
    );
    expect((button("Bold").element() as HTMLButtonElement).disabled).toBe(true);
    expect((button("Link").element() as HTMLButtonElement).disabled).toBe(true);
  });

  test("read only, it can be read and not changed", async () => {
    const onValueChange = vi.fn();
    await mount({
      readOnly: true,
      defaultValue: "<p>Hello</p>",
      onValueChange,
    });

    expect(text().getAttribute("contenteditable")).toBe("false");
    expect(text().getAttribute("aria-readonly")).toBe("true");
    await userEvent.click(text());
    await userEvent.keyboard("more");
    expect(text().textContent).toBe("Hello");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("it can be turned back on", async () => {
    const { rerender } = await mount({ disabled: true });

    await rerender(<RichTextEditor aria-label="Notes" />);

    await expect
      .poll(() => text().getAttribute("contenteditable"))
      .toBe("true");
    expect(text().hasAttribute("aria-disabled")).toBe(false);
  });
});

describe("in a form", () => {
  test("with a name, the HTML is sent with the form and follows what's written", async () => {
    await render(
      <form>
        <RichTextEditor
          aria-label="Notes"
          name="notes"
          defaultValue="<p>Hello</p>"
        />
      </form>,
    );
    await expect.element(box()).toBeInTheDocument();
    const data = () =>
      new FormData(one("form") as HTMLFormElement).get("notes");
    expect(data()).toBe("<p>Hello</p>");

    await userEvent.click(text());
    await userEvent.keyboard("{Control>}{End}{/Control}!");

    await expect.poll(data).toBe("<p>Hello!</p>");
  });

  test("disabled, nothing is sent", async () => {
    await render(
      <form>
        <RichTextEditor aria-label="Notes" name="notes" disabled />
      </form>,
    );
    await expect.element(box()).toBeInTheDocument();

    expect(new FormData(one("form") as HTMLFormElement).has("notes")).toBe(
      false,
    );
  });
});

describe("from outside", () => {
  test("editorRef focuses, reads, replaces, adds to and clears the text", async () => {
    const editorRef = createRef<RichTextEditorHandle>();
    const onValueChange = vi.fn();
    await mount({ editorRef, onValueChange, defaultValue: "<p>Hello</p>" });
    const handle = editorRef.current as RichTextEditorHandle;

    handle.focus();
    await expect.poll(() => document.activeElement).toBe(text());
    expect(handle.getText()).toBe("Hello");
    expect(handle.getJSON()).toMatchObject({ type: "doc" });

    handle.setHTML("<p>New</p>");
    await expect
      .poll(() => onValueChange.mock.lastCall?.[0])
      .toBe("<p>New</p>");

    handle.insertText("!");
    await expect.poll(() => handle.getText()).toContain("!");

    handle.clear();
    await expect.poll(() => onValueChange.mock.lastCall?.[0]).toBe("");
    expect(handle.getHTML()).toBe("");
  });
});

describe("parts of your own", () => {
  test("a toolbar takes the groups and buttons you give it, and the count can be shown with no limit", async () => {
    await render(
      <RichTextEditor aria-label="Notes" defaultValue="<p>Hello</p>">
        <RichTextEditorToolbar aria-label="Tools">
          <RichTextEditorFormats items={["bold"]} aria-label="Style" />
          <ToolbarSeparator />
          <RichTextEditorLink />
          <RichTextEditorActions
            items={["horizontalRule", "clearFormatting"]}
          />
        </RichTextEditorToolbar>
        <RichTextEditorContent />
        <RichTextEditorCount />
      </RichTextEditor>,
    );
    await expect.element(box()).toBeInTheDocument();
    const tools = page.getByRole("toolbar", { name: "Tools" });

    expect(tools.getByRole("button").elements()).toHaveLength(4);
    expect(
      document.querySelector(".nuv-rich-text-editor__count")?.textContent,
    ).toBe("5 characters");

    await userEvent.click(text());
    await tools.getByRole("button", { name: "Divider" }).click();
    await expect.poll(() => text().querySelector("hr")).not.toBeNull();
  });

  test("clear formatting takes the marks and the block off what's selected", async () => {
    const editorRef = createRef<RichTextEditorHandle>();
    await render(
      <RichTextEditor
        aria-label="Notes"
        editorRef={editorRef}
        defaultValue="<h2><strong>Hello</strong></h2>"
      >
        <RichTextEditorToolbar>
          <RichTextEditorActions items={["clearFormatting"]} />
        </RichTextEditorToolbar>
        <RichTextEditorContent />
      </RichTextEditor>,
    );
    await expect.element(box()).toBeInTheDocument();
    await userEvent.click(text());
    await selectAll();

    await button("Clear formatting").click();

    await expect.poll(() => editorRef.current?.getHTML()).toBe("<p>Hello</p>");
  });
});

describe("the menu on the selection", () => {
  const menu = () =>
    page.getByRole("toolbar", { name: "Format the selection" });

  test("it comes up when text is selected, and its toggles format it", async () => {
    const editorRef = createRef<RichTextEditorHandle>();
    await mount({ editorRef, defaultValue: "<p>Hello</p>" });
    expect(menu().elements()).toHaveLength(0);

    await userEvent.click(text());
    await selectAll();
    await expect.element(menu()).toBeVisible();
    await menu().getByRole("button", { name: "Italic" }).click();

    await expect
      .poll(() => editorRef.current?.getHTML())
      .toBe("<p><em>Hello</em></p>");
  });

  test("there's none when the text can't be changed", async () => {
    await mount({ readOnly: true, defaultValue: "<p>Hello</p>" });

    expect(document.querySelector(".nuv-rich-text-editor__bubble")).toBeNull();
  });
});

describe("words", () => {
  test("every name can be given in another language", async () => {
    await mount({
      maxLength: 20,
      labels: {
        toolbar: "Opmaak",
        bold: "Vet",
        heading: (level) => `Kop ${level}`,
        link: "Koppeling",
        count: (characters, max) => `${characters} van ${max} tekens`,
      },
    });
    const bar = page.getByRole("toolbar", { name: "Opmaak" });

    expect(bar.getByRole("button", { name: "Vet" }).elements()).toHaveLength(1);
    expect(bar.getByRole("button", { name: "Kop 2" }).elements()).toHaveLength(
      1,
    );
    expect(
      bar.getByRole("button", { name: "Koppeling" }).elements(),
    ).toHaveLength(1);
    // One that isn't given keeps its English.
    expect(bar.getByRole("button", { name: "Italic" }).elements()).toHaveLength(
      1,
    );
    expect(one(".nuv-rich-text-editor__count").textContent).toBe(
      "0 van 20 tekens",
    );
  });
});

describe("how it's drawn", () => {
  test("the text is at least 10rem tall, and the box has the ring of a field when the keyboard is in the text", async () => {
    await mount();
    const root = one(".nuv-rich-text-editor");

    expect(
      rect(one(".nuv-rich-text-editor__body")).height,
    ).toBeGreaterThanOrEqual(160);
    (button("Redo").element() as HTMLElement).focus();
    (button("Bold").element() as HTMLElement).focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(text());
    expect(style(root).outlineStyle).toBe("solid");
    expect(style(text()).outlineStyle).toBe("none");
  });

  test("a press anywhere in the box's empty space puts the caret in the text", async () => {
    await mount();
    const body = one(".nuv-rich-text-editor__body");

    await userEvent.click(body, { position: { x: 100, y: 140 } });

    expect(document.activeElement).toBe(text());
  });

  test("what's written is drawn as what it is: a heading larger, a list with its marks, a quote with a line", async () => {
    await mount({
      defaultValue:
        "<h2>Title</h2><p>Text</p><ul><li><p>One</p></li></ul><blockquote><p>Said</p></blockquote><pre><code>code</code></pre>",
    });
    const size = (selector: string) =>
      Number.parseFloat(
        style(text().querySelector(selector) as Element).fontSize,
      );

    expect(size("h2")).toBeGreaterThan(size("p"));
    expect(style(text().querySelector("ul") as Element).listStyleType).toBe(
      "disc",
    );
    expect(
      Number.parseFloat(
        style(text().querySelector("blockquote") as Element)
          .borderInlineStartWidth,
      ),
    ).toBeGreaterThan(0);
    expect(style(text().querySelector("pre") as Element).whiteSpace).toBe(
      "pre",
    );
  });

  test("a long word wraps inside the box, and a narrow box wraps the toolbar", async () => {
    await render(
      <div style={{ width: 240 }}>
        <RichTextEditor
          aria-label="Notes"
          defaultValue={`<p>${"Averyverylongwordwithnoplacetobreak".repeat(4)}</p>`}
        />
      </div>,
    );
    await expect.element(box()).toBeInTheDocument();
    const root = one(".nuv-rich-text-editor");

    expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth + 1);
    expect(rect(button("Redo").element()).top).toBeGreaterThan(
      rect(button("Bold").element()).top,
    );
    expect(rect(button("Redo").element()).right).toBeLessThanOrEqual(
      rect(root).right,
    );
  });

  test("its variables change the height, the colors and the space inside", async () => {
    await render(
      <div
        style={
          {
            "--nuv-rich-text-editor-min-height": "300px",
            "--nuv-rich-text-editor-bg": "rgb(1, 2, 3)",
            "--nuv-rich-text-editor-border": "rgb(4, 5, 6)",
            "--nuv-rich-text-editor-padding": "40px",
          } as never
        }
      >
        <RichTextEditor aria-label="Notes" />
      </div>,
    );
    await expect.element(box()).toBeInTheDocument();

    expect(rect(one(".nuv-rich-text-editor__body")).height).toBe(300);
    expect(style(one(".nuv-rich-text-editor")).backgroundColor).toBe(
      "rgb(1, 2, 3)",
    );
    expect(style(one(".nuv-rich-text-editor")).borderTopColor).toBe(
      "rgb(4, 5, 6)",
    );
    expect(style(text()).paddingLeft).toBe("40px");
  });

  test("invalid, the box's edge is the danger color", async () => {
    await mount({ "aria-invalid": true });
    const probe = document.createElement("span");
    probe.style.color = "var(--color-danger)";
    document.body.append(probe);

    expect(style(one(".nuv-rich-text-editor")).borderTopColor).toBe(
      style(probe).color,
    );
    probe.remove();
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe empty with a placeholder, and with every kind of text in it", async () => {
    const { container } = await renderThemed(
      theme,
      <>
        <RichTextEditor aria-label="Notes" placeholder="Write a note" />
        <RichTextEditor
          aria-label="Terms"
          maxLength={500}
          defaultValue='<h2>Title</h2><p>Text with <strong>bold</strong>, <code>code</code> and <a href="https://example.com">a link</a>.</p><ul><li><p>One</p></li></ul><blockquote><p>Said</p></blockquote><pre><code>code</code></pre>'
        />
      </>,
    );
    await expect.element(box()).toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });

  test("passes axe with the box for a link open", async () => {
    await renderThemed(
      theme,
      <RichTextEditor aria-label="Notes" defaultValue="<p>Hello</p>" />,
    );
    await expect.element(box()).toBeInTheDocument();
    await userEvent.click(text());
    await button("Link").click();
    await expect
      .element(page.getByRole("textbox", { name: "Web address" }))
      .toBeVisible();

    expect(await axe(document.body, behindOpenList)).toHaveNoViolations();
  });
});
