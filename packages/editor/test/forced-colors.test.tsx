import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { emulateMedia } from "@nuvui/tooling/test/media";
import { beforeEach, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { CodeEditor, DiffEditor } from "../src/code";

// Forced-colors mode is what Windows high contrast turns on. The browser
// replaces every color with one from a short system palette and stops
// drawing backgrounds, so a selection or a change drawn by its fill alone
// would vanish.

beforeEach(async ({ skip }) => {
  await emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });

  // WebKit answers the media query when asked to, but has no forced-colors
  // mode: it goes on painting the colors the page set.
  const probe = document.createElement("span");
  probe.style.color = "rgb(1, 2, 3)";
  document.body.append(probe);
  const forced = getComputedStyle(probe).color !== "rgb(1, 2, 3)";
  probe.remove();
  if (!forced) skip("this browser doesn't force colors");
});

const code = () => page.getByRole("textbox", { name: "Script" });

test("what's selected is the system's highlight", async () => {
  await render(<CodeEditor aria-label="Script" defaultValue="select me" />);
  await expect.element(code()).toBeInTheDocument();
  await userEvent.click(code().element());
  await userEvent.keyboard("{Control>}a{/Control}");
  const layer = document.querySelector(".cm-selectionBackground");
  expect(layer).not.toBeNull();
  const probe = document.createElement("span");
  probe.style.backgroundColor = "Highlight";
  probe.style.forcedColorAdjust = "none";
  document.body.append(probe);
  expect(getComputedStyle(layer as Element).backgroundColor).toBe(
    getComputedStyle(probe).backgroundColor,
  );
  probe.remove();
});

test("the line the cursor is on has an outline", async () => {
  await render(<CodeEditor aria-label="Script" defaultValue={"a\nb"} />);
  await expect.element(code()).toBeInTheDocument();
  await userEvent.click(code().element());
  const line = document.querySelector(".cm-activeLine") as HTMLElement;
  expect(getComputedStyle(line).outlineStyle).toBe("solid");
});

test("a problem is still marked in the gutter, and a changed line has a border", async () => {
  await render(
    <>
      <CodeEditor
        aria-label="Script"
        defaultValue="let a = ;"
        diagnostics={[
          { from: 8, to: 9, severity: "error", message: "Missing." },
        ]}
      />
      <div style={{ inlineSize: 900 }}>
        <DiffEditor
          aria-label="Changes"
          original={"a\n"}
          defaultModified={"b\n"}
        />
      </div>
    </>,
  );
  await expect.element(code()).toBeInTheDocument();
  await expect
    .poll(() => document.querySelectorAll(".cm-lint-marker-error").length)
    .toBe(1);
  const marker = document.querySelector(".cm-lint-marker-error") as HTMLElement;
  const style = getComputedStyle(marker);
  expect(style.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");

  await expect
    .poll(() => document.querySelectorAll(".cm-changedLine").length)
    .toBeGreaterThan(0);
  const changed = document.querySelector(".cm-changedLine") as HTMLElement;
  expect(getComputedStyle(changed).borderLeftStyle).toBe("solid");
});
