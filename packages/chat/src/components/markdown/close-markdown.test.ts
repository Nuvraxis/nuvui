import { describe, expect, test } from "vitest";
import { closeMarkdown } from "./close-markdown";

describe("text that's whole", () => {
  test.each([
    ["", ""],
    ["Hello", "Hello"],
    ["a **b** c", "a **b** c"],
    ["`a` and `b`", "`a` and `b`"],
    ["~~old~~ new", "~~old~~ new"],
    [
      "see [the docs](https://example.com) now",
      "see [the docs](https://example.com) now",
    ],
    ["* one\n* two", "* one\n* two"],
    ["2 * 3 = 6", "2 * 3 = 6"],
    ["snake_case and _more", "snake_case and _more"],
    ["```ts\nconst a = 1;\n```", "```ts\nconst a = 1;\n```"],
    ["```ts\nconst a = 1;\n```\n", "```ts\nconst a = 1;\n```\n"],
    ["~~~\ncode\n~~~", "~~~\ncode\n~~~"],
  ])("%j comes back as it was", (text, expected) => {
    expect(closeMarkdown(text)).toBe(expected);
  });
});

describe("a block of code that's still arriving", () => {
  test("is closed with the mark it was opened with", () => {
    expect(closeMarkdown("```ts\nconst a")).toBe("```ts\nconst a\n```");
    expect(closeMarkdown("~~~\ncode")).toBe("~~~\ncode\n~~~");
    expect(closeMarkdown("````md\n```\ninner")).toBe(
      "````md\n```\ninner\n````",
    );
  });

  test("a line break at its end isn't doubled", () => {
    expect(closeMarkdown("```ts\nconst a\n")).toBe("```ts\nconst a\n```");
  });

  test("only its language has come", () => {
    expect(closeMarkdown("Here:\n\n```ts")).toBe("Here:\n\n```ts\n```");
  });

  test("marks inside it are code, and left alone", () => {
    expect(closeMarkdown("```md\nSome **bold and `code")).toBe(
      "```md\nSome **bold and `code\n```",
    );
  });

  test("a shorter fence inside doesn't close it, and one as long does", () => {
    expect(closeMarkdown("````\na\n```")).toBe("````\na\n```\n````");
    expect(closeMarkdown("```\na\n````")).toBe("```\na\n````");
  });

  test("a closing fence has nothing after it on its line", () => {
    expect(closeMarkdown("```\na\n``` not the end")).toBe(
      "```\na\n``` not the end\n```",
    );
  });

  test("backticks with code in a line after them aren't a fence", () => {
    // Nothing is added on a line of its own, as it would be for a fence.
    expect(closeMarkdown("``` and `x`")).not.toContain("\n");
  });

  test("a second block is closed when the first is whole", () => {
    expect(closeMarkdown("```\na\n```\n\ntext\n\n```js\nb")).toBe(
      "```\na\n```\n\ntext\n\n```js\nb\n```",
    );
  });
});

describe("marks in a line", () => {
  test("bold that's open is closed", () => {
    expect(closeMarkdown("Some **bold")).toBe("Some **bold**");
  });

  test("the closing mark comes straight after the last word", () => {
    expect(closeMarkdown("Some **bold ")).toBe("Some **bold**");
  });

  test("a mark that has only just opened is dropped", () => {
    expect(closeMarkdown("Some **")).toBe("Some ");
    expect(closeMarkdown("Some ~~")).toBe("Some ");
    expect(closeMarkdown("use `")).toBe("use ");
  });

  test("struck text that's open is closed", () => {
    expect(closeMarkdown("~~old")).toBe("~~old~~");
  });

  test("bold and struck text open together are closed in turn, the last one first", () => {
    expect(closeMarkdown("**a ~~b")).toBe("**a ~~b~~**");
    expect(closeMarkdown("~~a **b")).toBe("~~a **b**~~");
    expect(closeMarkdown("**a ~~")).toBe("**a**");
  });

  test("code opened with two backticks is closed with two", () => {
    expect(closeMarkdown("use ``a ` b")).toBe("use ``a ` b``");
    expect(closeMarkdown("use ``a ` b`` now")).toBe("use ``a ` b`` now");
    expect(closeMarkdown("use ``")).toBe("use ");
  });

  test("code in a line that's open is closed, and what's in it isn't counted", () => {
    expect(closeMarkdown("use `npm")).toBe("use `npm`");
    expect(closeMarkdown("use `a **b")).toBe("use `a **b`");
  });

  test("a mark inside code that's whole is only a character", () => {
    expect(closeMarkdown("a `**` b **c")).toBe("a `**` b **c**");
    expect(closeMarkdown("a `**` b")).toBe("a `**` b");
  });

  test("only the last paragraph is looked at", () => {
    expect(closeMarkdown("First **done**.\n\nSecond **open")).toBe(
      "First **done**.\n\nSecond **open**",
    );
    // A mark left open in an earlier paragraph can't be closed from here.
    expect(closeMarkdown("First **open.\n\nSecond")).toBe(
      "First **open.\n\nSecond",
    );
  });

  test("text after a block of code that's whole is looked at, and the block isn't", () => {
    expect(closeMarkdown("```ts\nconst a = `x`;\n```\nThen **bo")).toBe(
      "```ts\nconst a = `x`;\n```\nThen **bo**",
    );
  });
});

describe("a link that's still arriving", () => {
  test("is its text until its address is whole", () => {
    expect(closeMarkdown("see [the docs](https://exa")).toBe("see the docs");
    expect(closeMarkdown("see [the docs](")).toBe("see the docs");
  });

  test("a picture is its description", () => {
    expect(closeMarkdown("![a chart](https://exa")).toBe("a chart");
  });

  test("a link before it that's whole is left as it is", () => {
    expect(closeMarkdown("[one](https://a.example) and [two](https://b")).toBe(
      "[one](https://a.example) and two",
    );
  });

  test("its text can be bold", () => {
    expect(closeMarkdown("**see [the docs](https://exa")).toBe(
      "**see the docs**",
    );
  });
});
