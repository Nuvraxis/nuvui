import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { LanguageSupport, StreamLanguage } from "@codemirror/language";
import { axe, behindOpenList } from "@nuvui/tooling/test/axe";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  CodeEditor,
  type CodeEditorChange,
  CodeEditorContent,
  type CodeEditorHandle,
  CodeEditorStatus,
  CodeEditorToolbar,
} from ".";

const rect = (element: Element) => element.getBoundingClientRect();
const one = (selector: string) =>
  document.querySelector(selector) as HTMLElement;

const code = (name = "Script") => page.getByRole("textbox", { name });
const content = (name = "Script") => code(name).element() as HTMLElement;
const toolbar = () => page.getByRole("toolbar", { name: "Code" });
const button = (name: string) =>
  page.getByRole("button", { name, exact: true });
const status = () => one(".nuv-code-editor__status").textContent ?? "";
const lines = () =>
  [...document.querySelectorAll(".cm-line")].map((line) => line.textContent);

type EditorProps = Partial<ComponentProps<typeof CodeEditor>>;

// CodeMirror takes over once the page has drawn, so a test waits for the
// code to be a textbox before it does anything to it.
async function mount(props: EditorProps = {}) {
  const result = await render(
    <CodeEditor aria-label="Script" defaultValue="let a = 1;" {...props} />,
  );
  await expect.element(code()).toBeInTheDocument();
  return result;
}

async function typeAtEnd(keys: string, name = "Script") {
  await userEvent.click(content(name));
  await userEvent.keyboard("{Control>}{End}{/Control}");
  await userEvent.keyboard(keys);
}

beforeEach(async () => {
  await setViewport("desktop");
});

describe("rendering", () => {
  test("it's a box with a named toolbar over code that's a named textbox of many lines, and a status bar", async () => {
    await mount();

    expect(one(".nuv-code-editor")).not.toBeNull();
    expect(toolbar().element().className).toBe(
      "nuv-toolbar nuv-code-editor__toolbar",
    );
    expect(content().getAttribute("aria-multiline")).toBe("true");
    expect(content().classList.contains("nuv-code-editor__code")).toBe(true);
    expect(
      page.getByRole("group", { name: "Code status" }).elements(),
    ).toHaveLength(1);
  });

  test("the toolbar has the language, wrapping and copying, and formatting only with a format", async () => {
    const { rerender } = await mount({ language: "javascript" });

    expect(
      toolbar().getByRole("combobox", { name: "Language" }).elements(),
    ).toHaveLength(0);
    expect(button("Wrap lines").elements()).toHaveLength(1);
    expect(button("Copy code").elements()).toHaveLength(1);
    expect(button("Format code").elements()).toHaveLength(0);

    await rerender(
      <CodeEditor
        aria-label="Script"
        defaultLanguage="javascript"
        format={(text) => text}
      />,
    );
    expect(
      toolbar().getByRole("combobox", { name: "Language" }).elements(),
    ).toHaveLength(1);
    expect(button("Format code").elements()).toHaveLength(1);
  });

  test("the root takes a ref, a class and other attributes, and what names the field goes to the code", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <>
        <span id="script-label">Script</span>
        <span id="script-help">Runs on every order.</span>
        <CodeEditor
          ref={ref}
          className="mine"
          data-testid="editor"
          aria-labelledby="script-label"
          aria-describedby="script-help"
          aria-invalid
          aria-required
        />
      </>,
    );
    await expect.element(code()).toBeInTheDocument();

    expect(ref.current?.className).toBe("nuv-code-editor mine");
    expect(ref.current?.dataset.testid).toBe("editor");
    expect(ref.current?.hasAttribute("data-invalid")).toBe(true);
    expect(content().getAttribute("aria-invalid")).toBe("true");
    expect(content().getAttribute("aria-required")).toBe("true");
    const described = (content().getAttribute("aria-describedby") ?? "")
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent);
    expect(described).toEqual([
      "Runs on every order.",
      "Tab indents. To leave the code, press Escape, then Tab.",
    ]);
  });

  test("children choose the parts, and a part outside an editor says what it needs", async () => {
    await render(
      <CodeEditor aria-label="Script" defaultValue="x">
        <CodeEditorContent />
      </CodeEditor>,
    );
    await expect.element(code()).toBeInTheDocument();
    expect(document.querySelector(".nuv-code-editor__toolbar")).toBeNull();
    expect(document.querySelector(".nuv-code-editor__status")).toBeNull();

    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(render(<CodeEditorStatus />)).rejects.toThrow(
      "CodeEditorStatus has to be inside a CodeEditor.",
    );
    errors.mockRestore();
  });

  test("the toolbar takes controls of your own, after its own", async () => {
    await render(
      <CodeEditor aria-label="Script">
        <CodeEditorToolbar>
          <button type="button">Run</button>
        </CodeEditorToolbar>
        <CodeEditorContent />
      </CodeEditor>,
    );
    await expect.element(code()).toBeInTheDocument();
    const names = [...toolbar().element().querySelectorAll("button")].map(
      (control) => control.getAttribute("aria-label") ?? control.textContent,
    );
    expect(names.at(-1)).toBe("Run");
  });
});

describe("the value", () => {
  test("defaultValue is the code to begin with", async () => {
    await mount({ defaultValue: "a\nb\nc" });
    expect(lines()).toEqual(["a", "b", "c"]);
  });

  test("typing reports the code, and beside it the lines, characters, selections and where the cursor is", async () => {
    const onValueChange =
      vi.fn<(code: string, change: CodeEditorChange) => void>();
    await mount({ defaultValue: "one\ntwo", onValueChange });
    await typeAtEnd("!");

    const [text, change] = onValueChange.mock.lastCall ?? [];
    expect(text).toBe("one\ntwo!");
    expect(change).toEqual({
      lines: 2,
      characters: 8,
      selections: [{ from: 8, to: 8 }],
      line: 2,
      column: 5,
    });
  });

  test("kept by you, it follows what you set it to, and doesn't report it back", async () => {
    const onValueChange = vi.fn();
    const { rerender } = await mount({ value: "first", onValueChange });
    await rerender(
      <CodeEditor
        aria-label="Script"
        value="second"
        onValueChange={onValueChange}
      />,
    );
    await expect.poll(lines).toEqual(["second"]);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("kept by you, typing goes on from where the cursor is", async () => {
    function Kept() {
      const [value, setValue] = useState("ab");
      return (
        <CodeEditor
          aria-label="Script"
          value={value}
          onValueChange={setValue}
        />
      );
    }
    await render(<Kept />);
    await expect.element(code()).toBeInTheDocument();
    await typeAtEnd("cdef");
    await expect.poll(lines).toEqual(["abcdef"]);
  });

  test("a value from outside isn't undone by undo", async () => {
    const { rerender } = await mount({
      value: "first",
      onValueChange: () => {},
    });
    await rerender(
      <CodeEditor
        aria-label="Script"
        value="second"
        onValueChange={() => {}}
      />,
    );
    await expect.poll(lines).toEqual(["second"]);
    await userEvent.click(content());
    await userEvent.keyboard("{Control>}z{/Control}");
    expect(lines()).toEqual(["second"]);
  });
});

describe("in a form", () => {
  test("with a name, the code is sent with the form and follows what's written", async () => {
    await render(
      <form data-testid="form">
        <CodeEditor aria-label="Script" name="script" defaultValue="a" />
      </form>,
    );
    await expect.element(code()).toBeInTheDocument();
    const form = () =>
      new FormData(one("[data-testid=form]") as HTMLFormElement).get("script");
    expect(form()).toBe("a");
    await typeAtEnd("b");
    await expect.poll(form).toBe("ab");
  });

  test("disabled, nothing is sent", async () => {
    await render(
      <form data-testid="form">
        <CodeEditor
          aria-label="Script"
          name="script"
          defaultValue="a"
          disabled
        />
      </form>,
    );
    await expect.element(code()).toBeInTheDocument();
    expect(
      new FormData(one("[data-testid=form]") as HTMLFormElement).has("script"),
    ).toBe(false);
  });
});

describe("read only and disabled", () => {
  test("read only, it can be read and selected and not changed, and Tab leaves it", async () => {
    await render(
      <>
        <CodeEditor aria-label="Script" defaultValue="keep" readOnly />
        <button type="button">After</button>
      </>,
    );
    await expect.element(code()).toBeInTheDocument();
    expect(content().getAttribute("aria-readonly")).toBe("true");
    await typeAtEnd("x");
    expect(lines()).toEqual(["keep"]);
    await userEvent.keyboard("{Tab}");
    await expect.poll(() => document.activeElement?.textContent).toBe("After");
  });

  test("read only, a long text that scrolls is reached with Tab, so it can be scrolled from the keyboard", async () => {
    await render(
      <>
        <button type="button">Before</button>
        <CodeEditor
          aria-label="Script"
          defaultValue={Array.from({ length: 40 }, (_, i) => `line ${i}`).join(
            "\n",
          )}
          maxLines={5}
          readOnly
        />
      </>,
    );
    await expect.element(code()).toBeInTheDocument();
    expect(content().getAttribute("tabindex")).toBe("0");
    page.getByRole("button", { name: "Before" }).element().focus();
    await userEvent.keyboard("{Tab}");
    await expect.poll(() => document.activeElement).toBe(content());
  });

  test("disabled, it can't be focused or written in, its toolbar is off, and it says so", async () => {
    await mount({ disabled: true, defaultLanguage: "css" });
    expect(content().hasAttribute("tabindex")).toBe(false);
    expect(content().getAttribute("contenteditable")).toBe("false");
    expect(content().getAttribute("aria-disabled")).toBe("true");
    expect(one(".nuv-code-editor").hasAttribute("data-disabled")).toBe(true);
    expect(button("Wrap lines").element()).toHaveProperty("disabled", true);
  });
});

describe("languages", () => {
  test("a language is fetched by its name the first time, and colors the code", async () => {
    await mount({
      language: "javascript",
      defaultValue: "const total = 4; // the boxes",
    });
    await expect.poll(status).toContain("JavaScript");
    // The comment is colored once the language is here.
    await expect
      .poll(() =>
        [...document.querySelectorAll(".cm-line span")].some((span) =>
          span.textContent?.includes("the boxes"),
        ),
      )
      .toBe(true);
  });

  test("an alias, or what a file in the language ends with, finds it", async () => {
    await mount({ language: "md" });
    await expect.poll(status).toContain("Markdown");
  });

  test("with none, it's the one the path ends in, and plain text without one", async () => {
    const { rerender } = await mount({ path: "notes.yaml" });
    await expect.poll(status).toContain("YAML");
    await rerender(<CodeEditor aria-label="Script" path="notes" />);
    await expect.poll(status).toContain("Plain text");
  });

  test("a LanguageSupport is used as it is", async () => {
    const shouty = new LanguageSupport(
      StreamLanguage.define({
        name: "shouty",
        token: (stream) => {
          stream.next();
          return "keyword";
        },
      }),
    );
    await mount({ language: shouty, defaultValue: "HEY" });
    await expect.poll(status).toContain("shouty");
  });

  test("the toolbar's picker changes it, and says so", async () => {
    const onLanguageChange = vi.fn();
    await mount({ defaultLanguage: "css", onLanguageChange });
    await toolbar().getByRole("combobox", { name: "Language" }).click();
    await page.getByRole("option", { name: "JSON" }).click();
    expect(onLanguageChange).toHaveBeenCalledWith("JSON");
    await expect.poll(status).toContain("JSON");
  });

  test("the picker is reached with the arrow keys, and works from the keyboard", async () => {
    await mount({ defaultLanguage: "css" });
    const picker = toolbar().getByRole("combobox", { name: "Language" });
    (picker.element() as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");
    await expect.element(page.getByRole("listbox")).toBeVisible();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    // The one after CSS in the list is SCSS.
    await expect.poll(status).toContain("SCSS");
  });

  test("with a language and no onLanguageChange, the toolbar shows its name and offers no other", async () => {
    await mount({ language: "sql" });
    expect(one(".nuv-code-editor__language-name").textContent).toBe("SQL");
  });
});

describe("the keyboard", () => {
  test("Tab indents, and Escape then Tab leaves", async () => {
    await render(
      <>
        <CodeEditor aria-label="Script" defaultValue="" />
        <button type="button">After</button>
      </>,
    );
    await expect.element(code()).toBeInTheDocument();
    await userEvent.click(content());
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(content());
    expect(lines()).toEqual(["  "]);

    await userEvent.keyboard("{Escape}{Tab}");
    await expect.poll(() => document.activeElement?.textContent).toBe("After");
  });

  test('tabBehavior="focus" leaves at once, and isn\'t described as indenting', async () => {
    await render(
      <>
        <CodeEditor aria-label="Script" tabBehavior="focus" />
        <button type="button">After</button>
      </>,
    );
    await expect.element(code()).toBeInTheDocument();
    expect(content().hasAttribute("aria-describedby")).toBe(false);
    await userEvent.click(content());
    await userEvent.keyboard("{Tab}");
    await expect.poll(() => document.activeElement?.textContent).toBe("After");
  });

  test("the toolbar is one Tab stop, and the arrow keys move along it", async () => {
    await render(
      <>
        <button type="button">Before</button>
        <CodeEditor aria-label="Script" defaultLanguage="css" />
      </>,
    );
    await expect.element(code()).toBeInTheDocument();
    (
      page.getByRole("button", { name: "Before" }).element() as HTMLElement
    ).focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Language");
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .poll(() => document.activeElement?.getAttribute("aria-label"))
      .toBe("Wrap lines");
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(content());
  });

  test("wrapping is a toggle, and wraps long lines", async () => {
    const onWrapChange = vi.fn();
    await mount({ onWrapChange });
    expect(button("Wrap lines").element().getAttribute("aria-pressed")).toBe(
      "false",
    );
    await button("Wrap lines").click();
    expect(onWrapChange).toHaveBeenCalledWith(true);
    expect(button("Wrap lines").element().getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(content().classList.contains("cm-lineWrapping")).toBe(true);
  });
});

describe("search", () => {
  test("Ctrl-F opens a panel with the core's fields, counts the matches, and Escape goes back to the code", async () => {
    await mount({ defaultValue: "box box\nbox" });
    await userEvent.click(content());
    await userEvent.keyboard("{Control>}f{/Control}");

    const find = page
      .getByRole("searchbox", { name: "Find" })
      .or(page.getByRole("textbox", { name: "Find" }));
    await expect.element(find).toHaveFocus();
    expect(
      page.getByRole("search", { name: "Search" }).elements(),
    ).toHaveLength(1);
    await userEvent.keyboard("box");
    await expect
      .poll(() => one(".nuv-code-editor__matches").textContent)
      .toMatch(/of 3$/);
    await userEvent.keyboard("{Enter}");
    await expect
      .poll(() => document.querySelectorAll(".cm-searchMatch-selected").length)
      .toBe(1);

    await userEvent.keyboard("{Escape}");
    await expect.poll(() => document.activeElement).toBe(content());
    expect(document.querySelector(".nuv-code-editor__search-form")).toBeNull();
  });

  test("replace all replaces every match, and a read-only editor has no replace", async () => {
    const onValueChange = vi.fn();
    const { rerender } = await mount({ defaultValue: "a a a", onValueChange });
    await userEvent.click(content());
    await userEvent.keyboard("{Control>}f{/Control}a");
    await page.getByRole("textbox", { name: "Replace" }).fill("b");
    await page.getByRole("button", { name: "Replace all" }).click();
    expect(onValueChange.mock.lastCall?.[0]).toBe("b b b");

    await rerender(
      <CodeEditor aria-label="Script" defaultValue="a" readOnly />,
    );
    await userEvent.click(content());
    await userEvent.keyboard("{Control>}f{/Control}");
    expect(
      page.getByRole("textbox", { name: "Replace" }).elements(),
    ).toHaveLength(0);
  });
});

describe("problems", () => {
  test("each is underlined, marked in the gutter by its kind and counted in the status bar", async () => {
    await mount({
      defaultValue: "let a = ;\nlet b = 2;",
      diagnostics: [
        { from: 8, to: 9, severity: "error", message: "A value is missing." },
        { from: 14, to: 15, severity: "warning", message: "b is never read." },
      ],
    });
    await expect
      .poll(() => document.querySelectorAll(".cm-lintRange-error").length)
      .toBe(1);
    expect(document.querySelectorAll(".cm-lintRange-warning")).toHaveLength(1);
    expect(document.querySelectorAll(".cm-lint-marker-error")).toHaveLength(1);
    expect(status()).toContain("2 problems");
  });

  test("a message says its kind in words, beside an icon", async () => {
    await mount({
      defaultValue: "let a = ;",
      diagnostics: [
        { from: 8, to: 9, severity: "error", message: "A value is missing." },
      ],
    });
    await userEvent.click(content());
    await userEvent.keyboard("{F8}");
    // F8 goes to the problem and opens its message.
    await expect
      .poll(() => one(".nuv-code-editor__severity")?.textContent)
      .toBe("Error");
    expect(one(".nuv-code-editor__problem").textContent).toContain(
      "A value is missing.",
    );
    expect(one(".nuv-code-editor__severity svg")).not.toBeNull();
  });

  test("a problem past the end of the code is drawn at the end, not thrown", async () => {
    await mount({
      defaultValue: "ab",
      diagnostics: [{ from: 10, to: 20, severity: "info", message: "Gone." }],
    });
    await expect.poll(status).toContain("1 problem");
  });
});

describe("formatting", () => {
  test("the toolbar's button and Shift-Alt-F format the code with what you give", async () => {
    const format = vi.fn((text: string) => text.toUpperCase());
    const onValueChange = vi.fn();
    await mount({ defaultValue: "abc", format, onValueChange });
    await button("Format code").click();
    await expect.poll(lines).toEqual(["ABC"]);
    expect(onValueChange.mock.lastCall?.[0]).toBe("ABC");

    await typeAtEnd("d");
    await userEvent.keyboard("{Shift>}{Alt>}f{/Alt}{/Shift}");
    await expect.poll(lines).toEqual(["ABCD"]);
  });

  test("a format that throws leaves the code as it was", async () => {
    await mount({
      defaultValue: "{ broken",
      format: () => {
        throw new Error("can't read it");
      },
    });
    await button("Format code").click();
    expect(lines()).toEqual(["{ broken"]);
  });
});

describe("a set of files", () => {
  test("each file keeps its own history, and undo in one doesn't touch another", async () => {
    function Files() {
      const [files, setFiles] = useState<Record<string, string>>({
        "a.css": "a {}",
        "b.css": "b {}",
      });
      const [open, setOpen] = useState("a.css");
      return (
        <>
          <button type="button" onClick={() => setOpen("a.css")}>
            a.css
          </button>
          <button type="button" onClick={() => setOpen("b.css")}>
            b.css
          </button>
          <CodeEditor
            aria-label="Script"
            path={open}
            value={files[open]}
            onValueChange={(next) =>
              setFiles((before) => ({ ...before, [open]: next }))
            }
          />
        </>
      );
    }
    await render(<Files />);
    await expect.element(code()).toBeInTheDocument();
    await typeAtEnd("1");
    await page.getByRole("button", { name: "b.css" }).click();
    await expect.poll(lines).toEqual(["b {}"]);
    await typeAtEnd("2");
    await page.getByRole("button", { name: "a.css" }).click();
    await expect.poll(lines).toEqual(["a {}1"]);

    await userEvent.click(content());
    await userEvent.keyboard("{Control>}z{/Control}");
    await expect.poll(lines).toEqual(["a {}"]);
    await page.getByRole("button", { name: "b.css" }).click();
    await expect.poll(lines).toEqual(["b {}2"]);
  });
});

describe("from outside", () => {
  test("editorRef focuses, reads, replaces, adds to and selects the code, and gives the view", async () => {
    const editor = createRef<CodeEditorHandle>();
    const onValueChange = vi.fn();
    await mount({ editorRef: editor, defaultValue: "abc", onValueChange });

    editor.current?.focus();
    expect(document.activeElement).toBe(content());
    expect(editor.current?.getValue()).toBe("abc");
    editor.current?.setValue("hello");
    expect(onValueChange.mock.lastCall?.[0]).toBe("hello");
    editor.current?.select(0, 5);
    editor.current?.insertText("bye");
    expect(editor.current?.getValue()).toBe("bye");
    expect(editor.current?.view?.state.doc.toString()).toBe("bye");
  });
});

describe("its look", () => {
  test("the line the cursor is on is marked only while it's being edited, with the code's colors kept readable on it", async () => {
    await mount({
      language: "javascript",
      defaultValue: "const a = 1;\nlet b;",
    });
    const line = () => one(".cm-activeLine") as HTMLElement;
    const keyword = () =>
      [...line().querySelectorAll("span")].find(
        (span) => span.textContent === "const",
      ) as HTMLElement;
    await expect.poll(() => keyword()).toBeTruthy();
    const plain = getComputedStyle(keyword()).color;
    expect(getComputedStyle(line()).backgroundColor).toBe("rgba(0, 0, 0, 0)");

    await userEvent.click(code().element());
    await expect
      .poll(() => getComputedStyle(line()).backgroundColor)
      .not.toBe("rgba(0, 0, 0, 0)");
    // Mixed toward the text's color, and so not the color it has elsewhere.
    expect(getComputedStyle(keyword()).color).not.toBe(plain);
  });

  test("it's at least four lines tall, and maxLines stops it growing", async () => {
    const { rerender } = await mount({ defaultValue: "" });
    const scroller = () => one(".cm-scroller");
    const line = Number.parseFloat(getComputedStyle(content()).lineHeight);
    expect(rect(scroller()).height).toBeGreaterThanOrEqual(line * 4);

    await rerender(
      <CodeEditor
        aria-label="Script"
        defaultValue={Array.from({ length: 40 }, (_, i) => `line ${i}`).join(
          "\n",
        )}
        maxLines={5}
      />,
    );
    await expect
      .poll(() => rect(one(".cm-editor")).height)
      .toBeLessThan(line * 7);
    expect(scroller().scrollHeight).toBeGreaterThan(scroller().clientHeight);
  });

  test("the box has the ring of a field when the keyboard is in the code", async () => {
    await mount();
    await userEvent.click(content());
    expect(getComputedStyle(one(".nuv-code-editor")).outlineStyle).toBe(
      "solid",
    );
  });

  test("its colors are the theme's tokens, and the code's are CodeBlock's", async () => {
    await mount({ language: "javascript", defaultValue: "const a = 1;" });
    const probe = document.createElement("span");
    probe.style.color = "var(--color-danger)";
    document.body.append(probe);
    await expect
      .poll(() =>
        [...document.querySelectorAll(".cm-line span")]
          .filter((span) => span.textContent === "const")
          .map((span) => getComputedStyle(span).color),
      )
      .toEqual([getComputedStyle(probe).color]);
    probe.remove();
  });

  test("its variables change its colors and its code's", async () => {
    await render(
      <div
        style={
          {
            "--nuv-code-editor-bg": "rgb(1, 2, 3)",
            "--nuv-code-block-token-keyword": "rgb(4, 5, 6)",
          } as never
        }
      >
        <CodeEditor
          aria-label="Script"
          language="javascript"
          defaultValue="const a = 1;"
        />
      </div>,
    );
    await expect.element(code()).toBeInTheDocument();
    expect(getComputedStyle(one(".cm-editor")).backgroundColor).toBe(
      "rgb(1, 2, 3)",
    );
    await expect
      .poll(() =>
        [...document.querySelectorAll(".cm-line span")]
          .filter((span) => span.textContent === "const")
          .map((span) => getComputedStyle(span).color),
      )
      .toEqual(["rgb(4, 5, 6)"]);
  });

  test("with less motion, the cursor doesn't blink", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await mount();
    await userEvent.click(content());
    await expect
      .poll(() => one(".cm-cursorLayer")?.style.animationDuration)
      .toBe("0ms");
    await emulateMedia({ reducedMotion: null });
  });

  test("in a page written right to left, the code is still left to right, and the toolbar follows the page", async () => {
    await render(
      <div dir="rtl">
        <CodeEditor aria-label="Script" defaultValue="a = 1" />
      </div>,
    );
    await expect.element(code()).toBeInTheDocument();
    expect(getComputedStyle(content()).direction).toBe("ltr");
    expect(getComputedStyle(toolbar().element()).direction).toBe("rtl");
  });

  test("a nonce goes on the styles CodeMirror writes", async () => {
    await mount({ nonce: "abc123" });
    expect(
      [...document.querySelectorAll("style")].some(
        (style) => style.getAttribute("nonce") === "abc123",
      ),
    ).toBe(true);
  });
});

describe("words", () => {
  test("every name can be given in another language", async () => {
    await mount({
      defaultLanguage: "css",
      labels: {
        toolbar: "Werkbalk",
        wrap: "Regels afbreken",
        copy: "Code kopiëren",
        language: "Taal",
        status: "Status",
        position: (line, column) => `Regel ${line}, kolom ${column}`,
      },
    });
    expect(
      page.getByRole("toolbar", { name: "Werkbalk" }).elements(),
    ).toHaveLength(1);
    expect(button("Regels afbreken").elements()).toHaveLength(1);
    expect(button("Code kopiëren").elements()).toHaveLength(1);
    expect(
      page.getByRole("combobox", { name: "Taal" }).elements(),
    ).toHaveLength(1);
    expect(status()).toContain("Regel 1, kolom 1");
  });
});

describe("on the server", () => {
  test("the code is in a <pre> with its line numbers, and is taken over cleanly", async () => {
    const node = (
      <CodeEditor
        aria-label="Script"
        defaultValue={"one\ntwo"}
        language="javascript"
      />
    );
    const html = renderToString(node);
    expect(html).toContain("nuv-code-editor__fallback");
    expect(html).toContain("one\ntwo");
    expect(html).toContain("1\n2");

    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const redone: unknown[] = [];
    const root = hydrateRoot(host, node, {
      onRecoverableError: (error) => redone.push(error),
    });
    await expect.poll(() => host.querySelector(".cm-editor")).not.toBeNull();
    expect(host.querySelector(".nuv-code-editor__fallback")).toBeNull();
    expect(redone).toEqual([]);
    root.unmount();
    host.remove();
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe with code in a language, a problem, and the toolbar and status", async () => {
    const { container } = await renderThemed(
      theme,
      <CodeEditor
        aria-label="Script"
        language="javascript"
        defaultValue={"// a comment\nconst total = 'boxes' + 4;\n"}
        diagnostics={[
          { from: 3, to: 4, severity: "warning", message: "A warning." },
        ]}
        format={(text) => text}
      />,
    );
    await expect.element(code()).toBeInTheDocument();
    await expect.poll(status).toContain("JavaScript");

    expect(await axe(container)).toHaveNoViolations();
  });

  test("passes axe with the search panel open", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await renderThemed(
      theme,
      <CodeEditor aria-label="Script" defaultValue="box box" />,
    );
    await expect.element(code()).toBeInTheDocument();
    await userEvent.click(content());
    await userEvent.keyboard("{Control>}f{/Control}box");
    await expect.element(page.getByRole("search")).toBeVisible();

    expect(await axe(document.body, behindOpenList)).toHaveNoViolations();
  });
});
