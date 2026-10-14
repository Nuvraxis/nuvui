import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { DirectionProvider } from "@nuvui/react/direction";
import { axe, behindOpenList } from "@nuvui/tooling/test/axe";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { type ComponentProps, createRef } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { type EmojiItem, EmojiPicker } from ".";

const style = (element: Element) => getComputedStyle(element);
const rect = (element: Element) => element.getBoundingClientRect();

// A list short enough to know by heart. The tests are about what the
// picker does with a list, and not about which emoji there are.
const few: EmojiItem[] = [
  {
    emoji: "😀",
    label: "grinning face",
    tags: ["cheerful", "smile"],
    group: "smileys",
    version: 1,
  },
  {
    emoji: "😃",
    label: "grinning face with big eyes",
    group: "smileys",
    version: 0.6,
  },
  {
    emoji: "😄",
    label: "grinning face with smiling eyes",
    group: "smileys",
    version: 0.6,
  },
  { emoji: "😁", label: "beaming face", group: "smileys", version: 0.6 },
  { emoji: "😆", label: "squinting face", group: "smileys", version: 0.6 },
  { emoji: "🫠", label: "melting face", group: "smileys", version: 14 },
  {
    emoji: "🫩",
    label: "face with bags under eyes",
    group: "smileys",
    version: 16,
  },
  {
    emoji: "👋",
    label: "waving hand",
    tags: ["hello", "bye"],
    group: "people",
    version: 0.6,
    skins: ["👋🏻", "👋🏼", "👋🏽", "👋🏾", "👋🏿"],
  },
  {
    emoji: "👍",
    label: "thumbs up",
    group: "people",
    version: 0.6,
    skins: ["👍🏻", "👍🏼", "👍🏽", "👍🏾", "👍🏿"],
  },
  { emoji: "🧠", label: "brain", group: "people", version: 5 },
  { emoji: "🐶", label: "dog face", group: "animals", version: 0.6 },
  { emoji: "🐱", label: "cat face", group: "animals", version: 0.6 },
  { emoji: "🍎", label: "red apple", group: "food", version: 0.6 },
  { emoji: "🍕", label: "pizza", group: "food", version: 0.6 },
  { emoji: "🍔", label: "hamburger", group: "food", version: 0.6 },
  { emoji: "🏁", label: "chequered flag", group: "flags", version: 0.6 },
  { emoji: "🇫🇷", label: "flag: France", group: "flags", version: 2 },
];

// Many, to see that only some are drawn. Each is a character of its own,
// which is all the picker asks of one.
const many: EmojiItem[] = Array.from({ length: 600 }, (_, index) => ({
  emoji: String.fromCodePoint(0x1f300 + index),
  label: `number ${index + 1}`,
  group: "symbols",
  version: 1,
}));

const list = () => page.getByRole("grid", { name: "Emoji" });
const scroller = () => list().element() as HTMLElement;
const search = () => page.getByRole("searchbox", { name: "Search emoji" });
const emoji = (name: string) =>
  list().getByRole("gridcell", { name, exact: true });
const group = (name: string) =>
  page
    .getByRole("navigation", { name: "Emoji groups" })
    .getByRole("button", { name, exact: true });
const tone = () => page.getByRole("button", { name: /^Skin tone/ });
const active = () =>
  document.querySelector("[data-active]")?.getAttribute("aria-label") ?? null;
const headings = () =>
  [...document.querySelectorAll(".nuv-emoji-picker__heading")].map(
    (heading) => heading.textContent,
  );
const cells = () => document.querySelectorAll(".nuv-emoji-picker__emoji");
const kept = (key = "nuvui-emoji") =>
  JSON.parse(localStorage.getItem(key) ?? "{}") as {
    recent?: string[];
    tone?: number;
  };

type Props = Partial<ComponentProps<typeof EmojiPicker>>;

// Four emoji to a row, whatever the browser's scrollbar takes: the keys
// are tested against rows that are known.
const narrow = { "--nuv-emoji-picker-width": "180px" } as never;

async function mount(props: Props = {}) {
  const screen = await render(
    <EmojiPicker data={few} flags style={narrow} {...props} />,
  );
  // By its role alone, since a test may have given it another name.
  await expect
    .poll(() =>
      document.querySelector('[role="grid"]')?.getAttribute("aria-colcount"),
    )
    .toBe("4");
  return screen;
}

const focusList = () => scroller().focus();

beforeEach(async () => {
  localStorage.clear();
  await setViewport("desktop");
});

describe("rendering", () => {
  test("it's a search box, a list of emoji that's a grid, and a row of groups", async () => {
    await mount();

    await expect.element(search()).toBeInTheDocument();
    await expect.element(list()).toBeInTheDocument();
    expect(scroller().tabIndex).toBe(0);
    expect(
      page
        .getByRole("navigation", { name: "Emoji groups" })
        .getByRole("button")
        .elements()
        .map((button) => button.getAttribute("aria-label")),
    ).toEqual([
      "Smileys and emotion",
      "People and body",
      "Animals and nature",
      "Food and drink",
      "Flags",
    ]);
  });

  test("each emoji is a cell named by its name, with the emoji in it", async () => {
    await mount();

    expect(emoji("grinning face").element().textContent).toBe("😀");
    expect(emoji("pizza").element().getAttribute("title")).toBe("pizza");
    expect(emoji("pizza").element().getAttribute("aria-colindex")).toBe("2");
  });

  test("the groups have headings, in Unicode's order, and the rows are counted", async () => {
    await mount();

    expect(headings()).toEqual([
      "Smileys and emotion",
      "People and body",
      "Animals and nature",
      "Food and drink",
      "Flags",
    ]);
    // Five headings, and six rows of four or fewer.
    expect(scroller().getAttribute("aria-rowcount")).toBe("11");
    expect(
      document
        .querySelector('[role="columnheader"]')
        ?.getAttribute("aria-colspan"),
    ).toBe("4");
  });

  test("a group with nothing in it has no heading and no button", async () => {
    await mount({ data: few.filter((item) => item.group !== "animals") });

    expect(headings()).not.toContain("Animals and nature");
    expect(group("Animals and nature").elements()).toHaveLength(0);
  });

  test("forwards its ref, a className and other props", async () => {
    const ref = createRef<HTMLDivElement>();
    await mount({ ref, className: "mine", id: "pick" });

    expect(ref.current?.className).toBe("nuv-emoji-picker mine");
    expect(ref.current?.id).toBe("pick");
  });
});

describe("the list it comes with", () => {
  test("it's loaded when the picker is drawn, and says it's on its way until then", async () => {
    await render(<EmojiPicker flags={false} />);

    // Either it's still on its way, or it was quick.
    expect(["true", null]).toContain(scroller().getAttribute("aria-busy"));
    await expect
      .poll(() => Number(scroller().getAttribute("aria-rowcount")))
      .toBeGreaterThan(100);
    expect(scroller().hasAttribute("aria-busy")).toBe(false);
    expect(
      document.querySelector(".nuv-emoji-picker")?.hasAttribute("data-loading"),
    ).toBe(false);
    await expect.element(emoji("grinning face")).toBeInTheDocument();
  });

  test("it's found by name and by other words, and has skin tones", async () => {
    await render(<EmojiPicker flags={false} defaultSkinTone={3} />);
    await expect
      .poll(() => Number(scroller().getAttribute("aria-rowcount")))
      .toBeGreaterThan(100);

    await userEvent.fill(search(), "pizza");
    await expect.element(emoji("pizza")).toBeInTheDocument();

    await userEvent.fill(search(), "waving hand");
    await expect
      .poll(() => emoji("waving hand").element().textContent)
      .toBe("👋🏽");
  });

  test("only the rows in view are drawn", async () => {
    await render(<EmojiPicker flags={false} />);
    await expect
      .poll(() => Number(scroller().getAttribute("aria-rowcount")))
      .toBeGreaterThan(100);

    expect(cells().length).toBeGreaterThan(20);
    expect(cells().length).toBeLessThan(200);
  });
});

describe("drawing only what's in view", () => {
  test("of six hundred, a few rows are in the page", async () => {
    await mount({ data: many });

    // A heading and a hundred and fifty rows of four.
    expect(scroller().getAttribute("aria-rowcount")).toBe("151");
    expect(cells().length).toBeLessThan(120);
    await expect.element(emoji("number 1")).toBeInTheDocument();
    expect(emoji("number 600").elements()).toHaveLength(0);
  });

  test("scrolling draws the rows that come into view, where they belong", async () => {
    await mount({ data: many });

    scroller().scrollTop = scroller().scrollHeight;

    await expect.element(emoji("number 600")).toBeInTheDocument();
    expect(emoji("number 1").elements()).toHaveLength(0);
    const last = emoji("number 600").element();
    expect(last.closest('[role="row"]')?.getAttribute("aria-rowindex")).toBe(
      "151",
    );
    expect(rect(last).bottom).toBeLessThanOrEqual(rect(scroller()).bottom + 1);
  });

  test("the keys can go on past what's drawn", async () => {
    await mount({ data: many });
    focusList();

    await userEvent.keyboard("{Control>}{End}{/Control}");

    await expect.poll(active).toBe("number 600");
    expect(scroller().getAttribute("aria-activedescendant")).toBe(
      emoji("number 600").element().id,
    );
  });
});

describe("picking", () => {
  test("a press picks an emoji, and says which with what's known of it", async () => {
    const onEmojiSelect = vi.fn();
    await mount({ onEmojiSelect });

    await emoji("pizza").click();

    expect(onEmojiSelect).toHaveBeenCalledOnce();
    expect(onEmojiSelect.mock.calls[0]?.[0]).toBe("🍕");
    expect(onEmojiSelect.mock.calls[0]?.[1]).toMatchObject({
      emoji: "🍕",
      label: "pizza",
      group: "food",
    });
  });

  test("the list is one stop for the Tab key, and its first emoji is where the keys start", async () => {
    await mount();
    (search().element() as HTMLElement).focus();

    await userEvent.keyboard("{Tab}{Tab}");

    expect(document.activeElement).toBe(scroller());
    await expect.poll(active).toBe("grinning face");
    expect(scroller().getAttribute("aria-activedescendant")).toBe(
      emoji("grinning face").element().id,
    );
  });

  test("the arrow keys move along a row and between rows, past the headings", async () => {
    await mount();
    focusList();
    await expect.poll(active).toBe("grinning face");

    await userEvent.keyboard("{ArrowRight}");
    expect(active()).toBe("grinning face with big eyes");

    // Down a row, in the same column.
    await userEvent.keyboard("{ArrowDown}");
    expect(active()).toBe("melting face");

    // Down again is the next group, over its heading.
    await userEvent.keyboard("{ArrowDown}");
    expect(active()).toBe("thumbs up");

    await userEvent.keyboard("{ArrowUp}{ArrowLeft}");
    expect(active()).toBe("squinting face");
  });

  test("a row that's shorter takes the keys to its last emoji", async () => {
    await mount();
    focusList();

    await userEvent.keyboard("{End}");
    expect(active()).toBe("beaming face");

    await userEvent.keyboard("{ArrowDown}");
    expect(active()).toBe("melting face");
  });

  test("Home and End are the ends of the row, and with Control the ends of the list", async () => {
    await mount();
    focusList();
    await userEvent.keyboard("{ArrowDown}");
    expect(active()).toBe("squinting face");

    await userEvent.keyboard("{End}");
    expect(active()).toBe("melting face");
    await userEvent.keyboard("{Home}");
    expect(active()).toBe("squinting face");

    await userEvent.keyboard("{Control>}{End}{/Control}");
    expect(active()).toBe("flag: France");
    await userEvent.keyboard("{Control>}{Home}{/Control}");
    expect(active()).toBe("grinning face");
  });

  test("the keys stop at the ends", async () => {
    await mount();
    focusList();

    await userEvent.keyboard("{ArrowLeft}{ArrowUp}");
    expect(active()).toBe("grinning face");

    await userEvent.keyboard(
      "{Control>}{End}{/Control}{ArrowRight}{ArrowDown}",
    );
    expect(active()).toBe("flag: France");
  });

  test("Enter and Space pick the emoji the keys are on", async () => {
    const onEmojiSelect = vi.fn();
    await mount({ onEmojiSelect });
    focusList();

    await userEvent.keyboard("{ArrowRight}{Enter}");
    expect(onEmojiSelect.mock.lastCall?.[0]).toBe("😃");

    await userEvent.keyboard("{ArrowRight} ");
    expect(onEmojiSelect.mock.lastCall?.[0]).toBe("😄");
  });

  test("where text reads from the right, the left arrow goes on", async () => {
    await render(
      <DirectionProvider dir="rtl">
        <div dir="rtl">
          <EmojiPicker data={few} flags style={narrow} />
        </div>
      </DirectionProvider>,
    );
    await expect.poll(() => scroller().getAttribute("aria-colcount")).toBe("4");
    focusList();

    await userEvent.keyboard("{ArrowLeft}");
    expect(active()).toBe("grinning face with big eyes");
    await userEvent.keyboard("{ArrowRight}");
    expect(active()).toBe("grinning face");
  });

  test("the emoji the keys are on is scrolled into view", async () => {
    await mount({
      style: {
        ...(narrow as object),
        "--nuv-emoji-picker-height": "220px",
      } as never,
    });
    focusList();

    await userEvent.keyboard("{Control>}{End}{/Control}");

    await expect.poll(() => scroller().scrollTop).toBeGreaterThan(0);
    const cell = emoji("flag: France").element();
    expect(rect(cell).bottom).toBeLessThanOrEqual(rect(scroller()).bottom + 1);
    expect(rect(cell).top).toBeGreaterThanOrEqual(rect(scroller()).top - 1);
  });
});

describe("searching", () => {
  test("typing leaves the emoji whose name has a word that begins with it", async () => {
    await mount();

    await userEvent.fill(search(), "grin");

    await expect.poll(headings).toEqual(["Search results"]);
    expect([...cells()].map((cell) => cell.getAttribute("aria-label"))).toEqual(
      [
        "grinning face",
        "grinning face with big eyes",
        "grinning face with smiling eyes",
      ],
    );
  });

  test("an emoji is found by its other words, and by several words at once", async () => {
    await mount();

    await userEvent.fill(search(), "hello");
    await expect.element(emoji("waving hand")).toBeInTheDocument();
    expect(cells()).toHaveLength(1);

    await userEvent.fill(search(), "face big");
    await expect
      .element(emoji("grinning face with big eyes"))
      .toBeInTheDocument();
    expect(cells()).toHaveLength(1);
  });

  test("how many were found is said, and that none were is shown as well", async () => {
    await mount();
    const status = () => page.getByRole("status").element().textContent;
    expect(status()).toBe("");

    await userEvent.fill(search(), "face");
    await expect.poll(status).toBe("8 emoji found");

    await userEvent.fill(search(), "pizza");
    await expect.poll(status).toBe("1 emoji found");

    await userEvent.fill(search(), "zzz");
    await expect.poll(status).toBe("No emoji found");
    expect(document.querySelector(".nuv-emoji-picker__note")?.textContent).toBe(
      "No emoji found",
    );
    expect(cells()).toHaveLength(0);
  });

  test("an empty search is the groups again", async () => {
    await mount();
    await userEvent.fill(search(), "pizza");
    await expect.poll(headings).toEqual(["Search results"]);

    await userEvent.fill(search(), "");

    await expect.poll(() => headings().length).toBe(5);
  });

  test("an emoji named for what's typed comes before one that's only found by it", async () => {
    await mount({
      data: [
        {
          emoji: "🧑‍🚀",
          label: "astronaut",
          tags: ["rocket", "space"],
          group: "people",
        },
        { emoji: "🚀", label: "rocket", tags: ["launch"], group: "travel" },
      ],
    });

    await userEvent.fill(search(), "rocket");

    await expect
      .poll(() => [...cells()].map((cell) => cell.getAttribute("aria-label")))
      .toEqual(["rocket", "astronaut"]);
  });

  test("Enter in the search box picks the first one found", async () => {
    const onEmojiSelect = vi.fn();
    await mount({ onEmojiSelect });

    await userEvent.fill(search(), "pizza");
    await expect.element(emoji("pizza")).toBeInTheDocument();
    await userEvent.keyboard("{Enter}");

    expect(onEmojiSelect.mock.lastCall?.[0]).toBe("🍕");
  });

  test("Enter in an empty search box picks nothing", async () => {
    const onEmojiSelect = vi.fn();
    await mount({ onEmojiSelect });
    (search().element() as HTMLElement).focus();

    await userEvent.keyboard("{Enter}");

    expect(onEmojiSelect).not.toHaveBeenCalled();
  });

  test("the down arrow goes from the search box into the list", async () => {
    await mount();
    await userEvent.fill(search(), "face");
    await expect.poll(headings).toEqual(["Search results"]);

    await userEvent.keyboard("{ArrowDown}");

    expect(document.activeElement).toBe(scroller());
    await expect.poll(active).toBe("grinning face");
  });

  test("autoFocus puts the caret in the search box", async () => {
    await mount({ autoFocus: true });

    expect(document.activeElement).toBe(search().element());
  });
});

describe("the groups", () => {
  const short = {
    ...(narrow as object),
    "--nuv-emoji-picker-height": "220px",
  } as never;

  test("a group's button brings its heading to the top of the list", async () => {
    await mount({ style: short });
    expect(scroller().scrollTop).toBe(0);

    await group("Food and drink").click();

    await expect.poll(() => scroller().scrollTop).toBeGreaterThan(0);
    const heading = [
      ...document.querySelectorAll(".nuv-emoji-picker__heading"),
    ].find((entry) => entry.textContent === "Food and drink") as Element;
    expect(Math.abs(rect(heading).top - rect(scroller()).top)).toBeLessThan(2);
  });

  test("the group in view is the one that's marked", async () => {
    await mount({ style: short });
    expect(
      group("Smileys and emotion").element().getAttribute("aria-current"),
    ).toBe("true");
    expect(group("Food and drink").element().hasAttribute("aria-current")).toBe(
      false,
    );

    await group("Food and drink").click();

    await expect
      .poll(() =>
        group("Food and drink").element().getAttribute("aria-current"),
      )
      .toBe("true");
    expect(
      group("Smileys and emotion").element().hasAttribute("aria-current"),
    ).toBe(false);
  });

  test("during a search a group's button puts the search away and goes there", async () => {
    await mount({ style: short });
    await userEvent.fill(search(), "pizza");
    await expect.poll(headings).toEqual(["Search results"]);
    expect(group("Food and drink").element().hasAttribute("aria-current")).toBe(
      false,
    );

    await group("Food and drink").click();

    await expect.element(search()).toHaveValue("");
    await expect.poll(() => scroller().scrollTop).toBeGreaterThan(0);
    await expect
      .poll(() =>
        group("Food and drink").element().getAttribute("aria-current"),
      )
      .toBe("true");
  });
});

describe("skin tones", () => {
  test("the control says the tone that's set, and offers six", async () => {
    await mount();
    expect(tone().element().getAttribute("aria-label")).toBe(
      "Skin tone: Default",
    );

    await tone().click();

    expect(
      page
        .getByRole("menuitemradio")
        .elements()
        .map((item) => item.textContent),
    ).toEqual([
      "✋Default",
      "✋🏻Light",
      "✋🏼Medium-light",
      "✋🏽Medium",
      "✋🏾Medium-dark",
      "✋🏿Dark",
    ]);
    await expect
      .element(page.getByRole("menuitemradio", { name: "Default" }))
      .toHaveAttribute("aria-checked", "true");
  });

  test("a tone that's chosen is drawn on the emoji that have one, and picked with them", async () => {
    const onEmojiSelect = vi.fn();
    const onSkinToneChange = vi.fn();
    await mount({ onEmojiSelect, onSkinToneChange });

    await tone().click();
    await page
      .getByRole("menuitemradio", { name: "Medium", exact: true })
      .click();

    await expect
      .poll(() => emoji("waving hand").element().textContent)
      .toBe("👋🏽");
    expect(onSkinToneChange).toHaveBeenCalledWith(3);
    expect(emoji("brain").element().textContent).toBe("🧠");
    await expect
      .poll(() => tone().element().getAttribute("aria-label"))
      .toBe("Skin tone: Medium");

    await emoji("waving hand").click();
    expect(onEmojiSelect.mock.lastCall?.[0]).toBe("👋🏽");
    // What's known of it is the emoji itself, with no tone.
    expect(onEmojiSelect.mock.lastCall?.[1].emoji).toBe("👋");

    await emoji("brain").click();
    expect(onEmojiSelect.mock.lastCall?.[0]).toBe("🧠");
  });

  test("defaultSkinTone is where it starts, and skinTone is yours to keep", async () => {
    const screen = await mount({ defaultSkinTone: 1 });
    expect(emoji("thumbs up").element().textContent).toBe("👍🏻");

    await screen.rerender(
      <EmojiPicker data={few} flags style={narrow} skinTone={5} />,
    );
    expect(emoji("thumbs up").element().textContent).toBe("👍🏿");

    // Kept by you, it changes when you change it.
    await tone().click();
    await page
      .getByRole("menuitemradio", { name: "Light", exact: true })
      .click();
    await expect
      .poll(() => emoji("thumbs up").element().textContent)
      .toBe("👍🏿");
  });

  test("the tone is remembered by the browser, and read again the next time", async () => {
    const screen = await mount();
    await tone().click();
    await page
      .getByRole("menuitemradio", { name: "Dark", exact: true })
      .click();
    await expect.poll(() => kept().tone).toBe(5);

    await screen.unmount();
    await mount();

    await expect
      .poll(() => emoji("waving hand").element().textContent)
      .toBe("👋🏿");
  });
});

describe("the ones picked before", () => {
  test("a picked emoji is remembered, newest first, with no tone and no repeats", async () => {
    await mount({ defaultSkinTone: 2 });

    await emoji("pizza").click();
    await emoji("waving hand").click();
    await emoji("pizza").click();

    expect(kept().recent).toEqual(["🍕", "👋"]);
  });

  test("they aren't added to the list while it's open, so nothing moves under the pointer", async () => {
    await mount();

    await emoji("pizza").click();

    expect(headings()).not.toContain("Recently used");
    expect(scroller().getAttribute("aria-rowcount")).toBe("11");
  });

  test("the next time, they're first, under a heading and a button of their own", async () => {
    localStorage.setItem(
      "nuvui-emoji",
      JSON.stringify({ recent: ["🍕", "👋"] }),
    );
    await mount({ defaultSkinTone: 4 });

    await expect.poll(() => headings()[0]).toBe("Recently used");
    expect([...cells()].slice(0, 2).map((cell) => cell.textContent)).toEqual([
      "🍕",
      "👋🏾",
    ]);
    await expect.element(group("Recently used")).toBeInTheDocument();
    // In the list twice: among the recent ones, and in its group.
    expect(emoji("pizza").elements()).toHaveLength(2);
  });

  test("no more are remembered than maxRecent", async () => {
    await mount({ maxRecent: 2 });

    await emoji("pizza").click();
    await emoji("brain").click();
    await emoji("dog face").click();

    expect(kept().recent).toEqual(["🐶", "🧠"]);
  });

  test("kept by you, they're what you give, and you're told the new list", async () => {
    const onRecentChange = vi.fn();
    const screen = await mount({ recent: ["🧠"], onRecentChange });
    expect(headings()[0]).toBe("Recently used");
    expect(cells()[0]?.textContent).toBe("🧠");

    await emoji("pizza").click();
    expect(onRecentChange).toHaveBeenCalledWith(["🍕", "🧠"]);

    await screen.rerender(
      <EmojiPicker data={few} flags style={narrow} recent={["🍕", "🧠"]} />,
    );
    expect(cells()[0]?.textContent).toBe("🍕");

    await screen.rerender(
      <EmojiPicker data={few} flags style={narrow} recent={[]} />,
    );
    expect(headings()).not.toContain("Recently used");
  });

  test("a recent emoji is the same emoji with and without the mark that asks for color", async () => {
    const onRecentChange = vi.fn();
    const marked = "👍\uFE0F";
    await mount({
      data: [
        { emoji: marked, label: "thumbs up", group: "people" },
        { emoji: "🍕", label: "pizza", group: "food" },
      ],
      // Kept without the mark, as most places write it.
      recent: ["👍", "🍕"],
      onRecentChange,
    });

    expect(headings()[0]).toBe("Recently used");
    expect(cells()[0]?.getAttribute("aria-label")).toBe("thumbs up");

    // Picked again, it's there once.
    (cells()[0] as HTMLElement).click();
    expect(onRecentChange).toHaveBeenCalledWith([marked, "🍕"]);
  });

  test("an emoji that isn't in the list is left out of the recent ones", async () => {
    await mount({ recent: ["🍕", "🦖"] });

    expect(cells()[0]?.textContent).toBe("🍕");
    expect(cells()[1]?.getAttribute("aria-label")).toBe("grinning face");
  });

  test("storageKey names where they're kept, and null keeps nothing", async () => {
    const screen = await mount({ storageKey: "mine" });
    await emoji("pizza").click();
    expect(kept("mine").recent).toEqual(["🍕"]);
    expect(localStorage.getItem("nuvui-emoji")).toBeNull();

    await screen.unmount();
    localStorage.clear();
    await mount({ storageKey: null });
    await emoji("pizza").click();
    expect(localStorage.length).toBe(0);
  });

  test("something else's under the same name doesn't break it", async () => {
    localStorage.setItem("nuvui-emoji", "not json");

    await mount();

    await expect.element(emoji("pizza")).toBeInTheDocument();
    expect(headings()).not.toContain("Recently used");
  });
});

describe("which emoji are listed", () => {
  test("one newer than emojiVersion is left out, and listed when the version says so", async () => {
    const screen = await mount();
    expect(emoji("face with bags under eyes").elements()).toHaveLength(0);
    expect(emoji("melting face").elements()).toHaveLength(1);

    await screen.rerender(
      <EmojiPicker data={few} flags style={narrow} emojiVersion={16} />,
    );
    await expect
      .element(emoji("face with bags under eyes"))
      .toBeInTheDocument();

    await screen.rerender(
      <EmojiPicker data={few} flags style={narrow} emojiVersion={13} />,
    );
    await expect.poll(() => emoji("melting face").elements().length).toBe(0);
  });

  test("flags={false} leaves the flags out, with their button", async () => {
    await mount({ flags: false });

    expect(headings()).not.toContain("Flags");
    expect(group("Flags").elements()).toHaveLength(0);
    expect(emoji("flag: France").elements()).toHaveLength(0);
  });
});

describe("words", () => {
  test("every name and heading can be given in another language", async () => {
    await mount({
      recent: ["🍕"],
      labels: {
        search: "Emoji zoeken",
        list: "Emoji's",
        groups: "Groepen",
        recent: "Onlangs gebruikt",
        results: "Gevonden",
        group: { food: "Eten en drinken" },
        skinTone: "Huidskleur",
        skinTones: [
          "Standaard",
          "Licht",
          "Lichtgetint",
          "Getint",
          "Donkergetint",
          "Donker",
        ],
        found: (count) => `${count} gevonden`,
      },
    });

    await expect
      .element(page.getByRole("searchbox", { name: "Emoji zoeken" }))
      .toHaveAttribute("placeholder", "Emoji zoeken");
    await expect
      .element(page.getByRole("grid", { name: "Emoji's" }))
      .toBeInTheDocument();
    expect(headings()).toContain("Onlangs gebruikt");
    expect(headings()).toContain("Eten en drinken");
    // A group that wasn't given a name keeps the English one.
    expect(headings()).toContain("People and body");
    await expect
      .element(page.getByRole("button", { name: "Huidskleur: Standaard" }))
      .toBeInTheDocument();
    await expect
      .element(
        page
          .getByRole("navigation", { name: "Groepen" })
          .getByRole("button", { name: "Eten en drinken" }),
      )
      .toBeInTheDocument();

    await userEvent.fill(page.getByRole("searchbox"), "pizza");
    await expect.poll(headings).toEqual(["Gevonden"]);
    await expect
      .poll(() => page.getByRole("status").element().textContent)
      .toBe("1 gevonden");
  });
});

describe("styles", () => {
  test("it's a panel of a set size, and the list is the part that scrolls", async () => {
    await render(<EmojiPicker data={many} flags={false} />);
    await expect
      .poll(() => Number(scroller().getAttribute("aria-colcount")))
      .toBeGreaterThan(4);
    const root = document.querySelector(".nuv-emoji-picker") as HTMLElement;

    expect(rect(root).width).toBe(320);
    expect(rect(root).height).toBe(384);
    expect(style(scroller()).overflowY).toBe("auto");
    expect(scroller().scrollHeight).toBeGreaterThan(scroller().clientHeight);
    expect(root.scrollHeight).toBe(root.clientHeight);
  });

  test("with a mouse an emoji's square is 36 pixels, and the emoji fill the row", async () => {
    await mount();
    const first = rect(emoji("grinning face").element());
    const fourth = rect(emoji("beaming face").element());

    expect(first.height).toBe(36);
    expect(first.width).toBeGreaterThanOrEqual(36);
    expect(fourth.right).toBeLessThanOrEqual(rect(scroller()).right);
    expect(fourth.top).toBe(first.top);
  });

  test("the ring is on the emoji the keys are on, when the keys are in use", async () => {
    await mount();
    (search().element() as HTMLElement).focus();
    await userEvent.keyboard("{Tab}{Tab}");
    await expect.poll(active).toBe("grinning face");

    expect(style(scroller()).outlineStyle).toBe("none");
    expect(style(emoji("grinning face").element()).outlineStyle).toBe("solid");
    expect(style(emoji("pizza").element()).outlineStyle).toBe("none");
  });

  test("component variables change the size and the colors", async () => {
    await render(
      <EmojiPicker
        data={few}
        flags
        style={
          {
            "--nuv-emoji-picker-width": "260px",
            "--nuv-emoji-picker-height": "300px",
            "--nuv-emoji-picker-bg": "rgb(10, 20, 30)",
            "--nuv-emoji-picker-fg": "rgb(200, 210, 220)",
            "--nuv-emoji-picker-border": "rgb(1, 2, 3)",
            "--nuv-emoji-picker-radius": "2px",
            "--nuv-emoji-picker-emoji-size": "30px",
            "--nuv-emoji-picker-heading-fg": "rgb(4, 5, 6)",
          } as never
        }
      />,
    );
    await expect.poll(() => cells().length).toBeGreaterThan(0);
    const root = document.querySelector(".nuv-emoji-picker") as HTMLElement;

    expect(rect(root).width).toBe(260);
    expect(rect(root).height).toBe(300);
    expect(style(root).backgroundColor).toBe("rgb(10, 20, 30)");
    expect(style(root).color).toBe("rgb(200, 210, 220)");
    expect(style(root).borderTopColor).toBe("rgb(1, 2, 3)");
    expect(style(root).borderTopLeftRadius).toBe("2px");
    expect(style(emoji("pizza").element()).fontSize).toBe("30px");
    expect(
      style(document.querySelector(".nuv-emoji-picker__heading") as Element)
        .color,
    ).toBe("rgb(4, 5, 6)");
  });

  test("it's no wider than the room it's given", async () => {
    await render(
      <div style={{ inlineSize: 200 }}>
        <EmojiPicker data={few} flags />
      </div>,
    );
    await expect.poll(() => cells().length).toBeGreaterThan(0);

    expect(
      rect(document.querySelector(".nuv-emoji-picker") as Element).width,
    ).toBe(200);
  });
});

describe("forced colors", () => {
  test("the emoji the keys are on has an edge, which a background can't give it there", async () => {
    await emulateMedia({ forcedColors: "active" });
    await mount();
    focusList();
    await expect.poll(active).toBe("grinning face");

    expect(style(emoji("grinning face").element()).outlineStyle).toBe("solid");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe with the groups, with a search, and with nothing found", async () => {
    const { container } = await renderThemed(
      theme,
      <EmojiPicker data={few} flags recent={["🍕"]} />,
    );
    await expect.poll(() => cells().length).toBeGreaterThan(0);
    expect(await axe(container)).toHaveNoViolations();

    await userEvent.fill(search(), "face");
    await expect.poll(headings).toEqual(["Search results"]);
    expect(await axe(container)).toHaveNoViolations();

    await userEvent.fill(search(), "zzz");
    await expect.poll(() => cells().length).toBe(0);
    expect(await axe(container)).toHaveNoViolations();
  });

  test("passes axe with the keys on an emoji, and with the skin tones open", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const { container } = await renderThemed(
      theme,
      <EmojiPicker data={few} flags />,
    );
    await expect.poll(() => cells().length).toBeGreaterThan(0);
    focusList();
    await userEvent.keyboard("{ArrowRight}");
    expect(await axe(container)).toHaveNoViolations();

    await tone().click();
    await expect
      .element(page.getByRole("menuitemradio", { name: "Default" }))
      .toBeVisible();
    await Promise.all(
      document.getAnimations().map((animation) => animation.finished),
    );
    expect(await axe(document.body, behindOpenList)).toHaveNoViolations();
  });
});
