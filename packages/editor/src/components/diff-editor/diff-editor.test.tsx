import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  DiffEditor,
  DiffEditorContent,
  type DiffEditorHandle,
  type DiffEditorSummary,
} from ".";

const one = (selector: string) =>
  document.querySelector(selector) as HTMLElement;
const all = (selector: string) => [...document.querySelectorAll(selector)];

const original = page.getByRole("textbox", { name: "Original" });
const changed = page.getByRole("textbox", { name: "Changed" });
const toolbar = () => page.getByRole("toolbar", { name: "Changes" });
const button = (name: string) =>
  page.getByRole("button", { name, exact: true });
const status = () => one(".nuv-diff-editor__status").textContent ?? "";
const said = () =>
  all(".nuv-diff-editor [aria-live]")
    .map((region) => region.textContent)
    .join("");
const changedLines = () =>
  [...(changed.element() as HTMLElement).querySelectorAll(".cm-line")].map(
    (line) => line.textContent,
  );

const before = "one\ntwo\nthree\nfour\nfive\n";
const after = "one\n2\nthree\nfour\nfive\nsix\n";

type Props = Partial<ComponentProps<typeof DiffEditor>>;

// Wide enough to be side by side, and CodeMirror takes over once the page
// has drawn.
async function mount(props: Props = {}) {
  const result = await render(
    <div style={{ inlineSize: 900 }}>
      <DiffEditor
        aria-label="Changes to notes.txt"
        original={before}
        defaultModified={after}
        collapseUnchanged={false}
        {...props}
      />
    </div>,
  );
  await expect.element(changed).toBeInTheDocument();
  return result;
}

beforeEach(async () => {
  await setViewport("desktop");
});

describe("rendering", () => {
  test("it's a named group with a toolbar, the two texts named and read only, and a status bar", async () => {
    await mount();
    expect(
      page.getByRole("group", { name: "Changes to notes.txt" }).elements(),
    ).toHaveLength(1);
    expect(toolbar().elements()).toHaveLength(1);
    expect(original.element().getAttribute("aria-readonly")).toBe("true");
    expect(changed.element().getAttribute("aria-readonly")).toBe("true");
    expect(one(".nuv-diff-editor").dataset.layout).toBe("split");
  });

  test("the status bar says how many changes, and how many lines were added and removed", async () => {
    await mount();
    await expect.poll(status).toBe("2 changes, 2 lines added, 1 removed");
  });

  test("a change is drawn with + and − in the gutter, and said as added and removed", async () => {
    await mount();
    await expect
      .poll(() => all(".cm-changedLineGutter").length)
      .toBeGreaterThan(0);
    const signs = new Set(
      all(".cm-changedLineGutter").map(
        (gutter) => getComputedStyle(gutter, "::before").content,
      ),
    );
    expect(signs).toEqual(new Set(['"−"', '"+"']));
    const spoken = all(".cm-changedLine").map(
      (line) => getComputedStyle(line, "::before").content,
    );
    expect(spoken.some((words) => words.includes("added"))).toBe(true);
    expect(spoken.some((words) => words.includes("removed"))).toBe(true);
  });

  test("children choose the parts", async () => {
    await render(
      <DiffEditor aria-label="Changes" original="a" defaultModified="b">
        <DiffEditorContent />
      </DiffEditor>,
    );
    await expect.element(changed).toBeInTheDocument();
    expect(document.querySelector(".nuv-diff-editor__toolbar")).toBeNull();
    expect(document.querySelector(".nuv-diff-editor__status")).toBeNull();
  });
});

describe("layout", () => {
  test("the toolbar switches to one column, and says so", async () => {
    const onLayoutChange = vi.fn();
    await mount({ onLayoutChange });
    await button("In one column").click();
    expect(onLayoutChange).toHaveBeenCalledWith("unified");
    await expect
      .poll(() => one(".nuv-diff-editor").dataset.layout)
      .toBe("unified");
    expect(all(".cm-editor")).toHaveLength(1);
    await expect.poll(() => all(".cm-deletedChunk").length).toBeGreaterThan(0);
    expect(status()).toBe("2 changes, 2 lines added, 1 removed");
  });

  test("a box narrower than minSplitWidth is in one column, and side by side again when it's wider", async () => {
    const { rerender } = await render(
      <div style={{ inlineSize: 500 }}>
        <DiffEditor
          aria-label="Changes"
          original={before}
          defaultModified={after}
        />
      </div>,
    );
    await expect.element(changed).toBeInTheDocument();
    expect(one(".nuv-diff-editor").dataset.layout).toBe("unified");

    await rerender(
      <div style={{ inlineSize: 900 }}>
        <DiffEditor
          aria-label="Changes"
          original={before}
          defaultModified={after}
        />
      </div>,
    );
    await expect
      .poll(() => one(".nuv-diff-editor").dataset.layout)
      .toBe("split");
  });
});

describe("moving between changes", () => {
  test("next and previous move to a change, from the toolbar and from Alt and the arrows, and say which", async () => {
    await mount();
    await button("Next change").click();
    await expect.poll(said).toContain("Change 1 of 2");
    expect(
      (changed.element() as HTMLElement)
        .closest(".cm-editor")
        ?.contains(document.activeElement),
    ).toBe(true);

    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await expect.poll(said).toContain("Change 2 of 2");
    await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");
    await expect.poll(said).toContain("Change 1 of 2");
  });

  test("editorRef moves too, and gives the changed text", async () => {
    const editor = createRef<DiffEditorHandle>();
    await mount({ editorRef: editor });
    editor.current?.nextChange();
    await expect.poll(said).toContain("Change 1 of 2");
    expect(editor.current?.getModified()).toBe(after);
  });
});

describe("unchanged lines", () => {
  const long = Array.from({ length: 30 }, (_, i) => `line ${i}`).join("\n");
  const longAfter = long.replace("line 15", "line fifteen");

  test("long stretches are folded, say how many lines they hold, and the toolbar opens them", async () => {
    await render(
      <div style={{ inlineSize: 900 }}>
        <DiffEditor
          aria-label="Changes"
          original={long}
          defaultModified={longAfter}
        />
      </div>,
    );
    await expect.element(changed).toBeInTheDocument();
    await expect
      .poll(() => all(".cm-collapsedLines").map((fold) => fold.textContent))
      .toContain("12 unchanged lines");

    await button("Show unchanged lines").click();
    await expect.poll(() => all(".cm-collapsedLines").length).toBe(0);
    expect(
      button("Show unchanged lines").element().getAttribute("aria-pressed"),
    ).toBe("true");
  });
});

describe("keeping and undoing a change", () => {
  function Review({
    onChange,
  }: {
    onChange: (summary: DiffEditorSummary) => void;
  }) {
    const [modified, setModified] = useState(after);
    return (
      <div style={{ inlineSize: 900 }}>
        <DiffEditor
          aria-label="Changes"
          original={before}
          modified={modified}
          onModifiedChange={(next, summary) => {
            setModified(next);
            onChange(summary);
          }}
          collapseUnchanged={false}
          editable
        />
      </div>
    );
  }

  test("without editable there's nothing to keep or undo", async () => {
    await mount();
    expect(all(".nuv-diff-editor__chunk-button")).toHaveLength(0);
    expect(button("Keep change").elements()).toHaveLength(0);
  });

  test("beside each change, Undo puts the original back and Keep makes it no longer a change, from the keyboard", async () => {
    const onChange = vi.fn();
    await render(<Review onChange={onChange} />);
    await expect.element(changed).toBeInTheDocument();
    await expect
      .poll(() => all(".nuv-diff-editor__chunk-button").length)
      .toBe(4);

    (
      one(
        '.nuv-diff-editor__chunk-button[aria-label="Undo change"]',
      ) as HTMLElement
    ).focus();
    await userEvent.keyboard("{Enter}");
    await expect
      .poll(() => onChange.mock.lastCall?.[0])
      .toEqual({
        changes: 1,
        added: 1,
        removed: 0,
      });
    expect(changedLines()).toContain("two");

    (
      one(
        '.nuv-diff-editor__chunk-button[aria-label="Keep change"]',
      ) as HTMLElement
    ).focus();
    await userEvent.keyboard(" ");
    await expect
      .poll(() => onChange.mock.lastCall?.[0])
      .toEqual({
        changes: 0,
        added: 0,
        removed: 0,
      });
    expect(changedLines()).toContain("six");
    expect(status()).toBe("No changes");
  });

  test("side by side, the two buttons beside a change are in a row, neither covers the other, and each takes a click", async () => {
    const onChange = vi.fn();
    await render(<Review onChange={onChange} />);
    await expect.element(changed).toBeInTheDocument();
    await expect
      .poll(() => all(".nuv-diff-editor__chunk-button").length)
      .toBe(4);
    for (const controls of all(".nuv-diff-editor__chunk-controls")) {
      const [keep, undo] = [...controls.children].map((child) =>
        child.getBoundingClientRect(),
      );
      expect(keep?.top).toBe(undo?.top);
      expect(keep?.right ?? 0).toBeLessThanOrEqual(undo?.left ?? 0);
    }
    for (const control of all(".nuv-diff-editor__chunk-button")) {
      const box = control.getBoundingClientRect();
      const there = document.elementFromPoint(
        box.left + box.width / 2,
        box.top + box.height / 2,
      );
      expect(there?.closest("button")).toBe(control);
    }

    await userEvent.click(
      one('.nuv-diff-editor__chunk-button[aria-label="Keep change"]'),
    );
    await expect.poll(() => onChange.mock.lastCall?.[0]?.changes).toBe(1);
  });

  test("the toolbar keeps or undoes the change the cursor is in, in one column too", async () => {
    const onChange = vi.fn();
    await render(<Review onChange={onChange} />);
    await expect.element(changed).toBeInTheDocument();
    await button("In one column").click();
    await expect
      .poll(() => one(".nuv-diff-editor").dataset.layout)
      .toBe("unified");

    await button("Next change").click();
    await button("Undo change").click();
    await expect.poll(() => onChange.mock.lastCall?.[0]?.changes).toBe(1);
    await button("Next change").click();
    await button("Keep change").click();
    await expect.poll(status).toBe("No changes");
  });

  test("keeping a change gives the original it's written into", async () => {
    const onOriginalChange = vi.fn();
    await mount({ editable: true, onOriginalChange });
    await button("Next change").click();
    await button("Keep change").click();
    await expect
      .poll(() => onOriginalChange.mock.lastCall?.[0])
      .toBe("one\n2\nthree\nfour\nfive\n");
  });

  test("editable, the changed text can be written in", async () => {
    const onModifiedChange = vi.fn();
    await mount({ editable: true, onModifiedChange });
    expect(changed.element().hasAttribute("aria-readonly")).toBe(false);
    await userEvent.click(changed.element());
    await userEvent.keyboard("{Control>}{End}{/Control}!");
    await expect
      .poll(() => onModifiedChange.mock.lastCall?.[0])
      .toBe(`${after}!`);
  });
});

describe("from outside", () => {
  test("a new original or changed text replaces the one shown", async () => {
    const { rerender } = await render(
      <div style={{ inlineSize: 900 }}>
        <DiffEditor
          aria-label="Changes"
          original={"a\n"}
          modified={"b\n"}
          collapseUnchanged={false}
        />
      </div>,
    );
    await expect.element(changed).toBeInTheDocument();
    await rerender(
      <div style={{ inlineSize: 900 }}>
        <DiffEditor
          aria-label="Changes"
          original={"c\n"}
          modified={"c\n"}
          collapseUnchanged={false}
        />
      </div>,
    );
    await expect.poll(status).toBe("No changes");
  });
});

describe("words", () => {
  test("every name can be given in another language", async () => {
    await mount({
      editable: true,
      labels: {
        toolbar: "Wijzigingen",
        nextChange: "Volgende wijziging",
        keep: "Houden",
        original: "Oud",
        modified: "Nieuw",
        summary: ({ changes }) => `${changes} wijzigingen`,
      },
    });
    expect(
      page.getByRole("toolbar", { name: "Wijzigingen" }).elements(),
    ).toHaveLength(1);
    expect(button("Volgende wijziging").elements()).toHaveLength(1);
    expect(
      page.getByRole("textbox", { name: "Nieuw" }).elements(),
    ).toHaveLength(1);
    await expect.poll(status).toBe("2 wijzigingen");
    await expect
      .poll(() => all('[aria-label="Houden"]').length)
      .toBeGreaterThan(0);
  });
});

describe("on the server", () => {
  test("the changed text is in a <pre>, and is taken over cleanly", async () => {
    const node = (
      <DiffEditor
        aria-label="Changes"
        original={before}
        defaultModified={after}
      />
    );
    const html = renderToString(node);
    expect(html).toContain("nuv-diff-editor__fallback");
    expect(html).toContain("six");

    const host = document.createElement("div");
    host.style.inlineSize = "900px";
    host.innerHTML = html;
    document.body.append(host);
    const redone: unknown[] = [];
    const root = hydrateRoot(host, node, {
      onRecoverableError: (error) => redone.push(error),
    });
    await expect.poll(() => host.querySelector(".cm-editor")).not.toBeNull();
    expect(redone).toEqual([]);
    root.unmount();
    host.remove();
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe side by side and in one column, with the buttons beside each change", async () => {
    const { container } = await renderThemed(
      theme,
      <div style={{ inlineSize: 900 }}>
        <DiffEditor
          aria-label="Changes"
          original={before}
          defaultModified={after}
          language="markdown"
          editable
        />
      </div>,
    );
    await expect.element(changed).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    await button("In one column").click();
    await expect
      .poll(() => one(".nuv-diff-editor").dataset.layout)
      .toBe("unified");
    expect(await axe(container)).toHaveNoViolations();
  });
});
