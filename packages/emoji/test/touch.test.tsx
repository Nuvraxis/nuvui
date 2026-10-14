import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { type EmojiItem, EmojiPicker, EmojiReaction } from "../src";

// This file runs in a browser context of its own, one that reports a touch
// screen, at the width of a phone. What a mouse and a keyboard do is
// checked next to the component.

const rect = (element: Element) => element.getBoundingClientRect();

const few: EmojiItem[] = [
  { emoji: "😀", label: "grinning face", group: "smileys", version: 1 },
  { emoji: "😃", label: "grinning face with big eyes", group: "smileys" },
  { emoji: "👋", label: "waving hand", group: "people" },
  { emoji: "🍕", label: "pizza", group: "food" },
  { emoji: "🍔", label: "hamburger", group: "food" },
];

const list = () => page.getByRole("grid", { name: "Emoji" });
const emoji = (name: string) =>
  list().getByRole("gridcell", { name, exact: true });

async function mount(onEmojiSelect = vi.fn()) {
  await render(
    <EmojiPicker data={few} flags={false} onEmojiSelect={onEmojiSelect} />,
  );
  await expect
    .poll(() => Number(list().element().getAttribute("aria-colcount")))
    .toBeGreaterThan(1);
  return onEmojiSelect;
}

test("the browser reports a touch screen", () => {
  expect(matchMedia("(pointer: coarse)").matches).toBe(true);
});

test("an emoji's square is 44 pixels each way", async () => {
  await mount();
  const cell = rect(emoji("pizza").element());

  expect(cell.height).toBe(44);
  expect(cell.width).toBeGreaterThanOrEqual(44);
});

test("the skin tone and the groups are 44 pixels each way", async () => {
  await mount();

  for (const button of [
    page.getByRole("button", { name: /^Skin tone/ }),
    page
      .getByRole("navigation", { name: "Emoji groups" })
      .getByRole("button", { name: "Food and drink" }),
  ]) {
    expect(rect(button.element()).width).toBe(44);
    expect(rect(button.element()).height).toBe(44);
  }
});

test("a reaction is 44 pixels tall, and as wide or wider", async () => {
  await render(<EmojiReaction emoji="👍" label="thumbs up" count={3} />);
  const button = rect(
    page.getByRole("button", { name: "thumbs up, 3" }).element(),
  );

  expect(button.height).toBe(44);
  expect(button.width).toBeGreaterThanOrEqual(44);
});

test("a tap on a reaction asks for the other state", async () => {
  const onPressedChange = vi.fn();
  await render(
    <EmojiReaction
      emoji="👍"
      label="thumbs up"
      count={3}
      onPressedChange={onPressedChange}
    />,
  );

  await page.getByRole("button", { name: "thumbs up, 3" }).click();

  expect(onPressedChange).toHaveBeenCalledWith(true);
});

test("the search box is 16 pixels or more, so iOS doesn't zoom the page", async () => {
  await mount();

  expect(
    Number.parseFloat(
      getComputedStyle(page.getByRole("searchbox").element()).fontSize,
    ),
  ).toBeGreaterThanOrEqual(16);
});

test("a tap picks an emoji", async () => {
  const onEmojiSelect = await mount();

  await emoji("pizza").click();

  expect(onEmojiSelect.mock.lastCall?.[0]).toBe("🍕");
});

test("it's no wider than the phone, and the page doesn't scroll sideways", async () => {
  await mount();

  expect(
    rect(document.querySelector(".nuv-emoji-picker") as Element).right,
  ).toBeLessThanOrEqual(document.documentElement.clientWidth);
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    document.documentElement.clientWidth,
  );
});
