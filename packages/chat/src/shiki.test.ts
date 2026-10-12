import { describe, expect, test } from "vitest";
import type { CodeToken } from "./components/code-block";
import { createShikiHighlighter } from "./shiki";

const code = 'const a = "x"; // hi\nfoo(a)';
const text = (lines: CodeToken[][] | null) =>
  lines?.map((line) => line.map((token) => token.content).join("")).join("\n");

// Shiki and a grammar are fetched the first time, which takes a moment.
const patient = { timeout: 30_000 };

describe("the highlighter for Shiki", () => {
  test(
    "colors code it knows the language of, and the tokens put together are the code",
    patient,
    async () => {
      const highlight = createShikiHighlighter();

      const lines = await highlight(code, "ts");

      expect(lines).toHaveLength(2);
      expect(text(lines)).toBe(code);
    },
  );

  test(
    "each kind of token is a variable of the code block's, with one of the theme's colors behind it",
    patient,
    async () => {
      const highlight = createShikiHighlighter();

      const lines = (await highlight(code, "ts")) ?? [];
      const colorOf = (content: string) =>
        lines.flat().find((token) => token.content === content)?.color;

      expect(colorOf("const")).toBe(
        "var(--nuv-code-block-token-keyword, var(--color-danger))",
      );
      expect(colorOf('"x"')).toBe(
        "var(--nuv-code-block-token-string-expression, var(--color-success))",
      );
      expect(colorOf("// hi")).toBe(
        "var(--nuv-code-block-token-comment, var(--color-muted-foreground))",
      );
      // No color is written as a color: every one is a variable.
      for (const token of lines.flat()) {
        expect(token.color).toMatch(/^var\(--nuv-code-block-/);
      }
    },
  );

  test(
    "a language is found by any of its names, in any case",
    patient,
    async () => {
      const highlight = createShikiHighlighter();

      expect(text(await highlight(code, "typescript"))).toBe(code);
      expect(text(await highlight(code, "TS"))).toBe(code);
      expect(text(await highlight("a = 1", "py"))).toBe("a = 1");
    },
  );

  test("a language it doesn't know, or none, is null", patient, async () => {
    const highlight = createShikiHighlighter();

    expect(await highlight(code, "no-such-language")).toBeNull();
    expect(await highlight(code, undefined)).toBeNull();
    expect(await highlight(code, "")).toBeNull();
  });

  test(
    "code that isn't whole yet is colored as far as it goes",
    patient,
    async () => {
      const highlight = createShikiHighlighter();
      const half = 'const a = "unclosed\nfunction (';

      expect(text(await highlight(half, "ts"))).toBe(half);
    },
  );

  test("empty code is one empty line", patient, async () => {
    const highlight = createShikiHighlighter();

    expect(text(await highlight("", "ts"))).toBe("");
  });
});
