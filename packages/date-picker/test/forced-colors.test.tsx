import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { beforeEach, describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Calendar, DatePicker } from "../src";

// Forced-colors mode is what Windows high contrast turns on. The browser
// replaces every color with one from a short system palette and stops
// drawing backgrounds, so a picked day shown by its fill alone would look
// like every other day.

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

const style = (element: Element) => getComputedStyle(element);

// What the browser is using for one of its system colors.
function system(name: string) {
  const probe = document.createElement("span");
  probe.style.color = name;
  document.body.append(probe);
  const { color } = style(probe);
  probe.remove();
  return color;
}

const canvas = () => system("canvas");
const today = new Date(2026, 9, 7);
const october = (day: number) => new Date(2026, 9, day);
const calendar = { today, defaultMonth: today };
const button = (day: number) =>
  document.querySelector(
    `[data-day="2026-10-${String(day).padStart(2, "0")}"] button`,
  ) as HTMLElement;

describe("calendar", () => {
  test("a picked day is filled with the system's color for something selected", async () => {
    await render(
      <Calendar {...calendar} mode="single" selected={october(15)} />,
    );
    expect(style(button(15)).backgroundColor).toBe(system("highlight"));
    expect(style(button(15)).color).toBe(system("highlighttext"));
    expect(style(button(14)).backgroundColor).not.toBe(system("highlight"));
  });

  test("today still has its ring, and it can be seen", async () => {
    await render(<Calendar {...calendar} mode="single" />);
    const now = style(button(7));
    expect(now.borderTopStyle).toBe("solid");
    expect(contrast(now.borderTopColor, canvas())).toBeGreaterThan(3);
    expect(style(button(8)).borderTopStyle).toBe("none");
  });

  test("the days inside a range are filled too", async () => {
    await render(
      <Calendar
        {...calendar}
        mode="range"
        selected={{ from: october(12), to: october(15) }}
      />,
    );
    const middle = button(13).parentElement as HTMLElement;
    const outside = button(16).parentElement as HTMLElement;
    expect(style(middle).backgroundColor).toBe(system("highlight"));
    expect(style(outside).backgroundColor).not.toBe(system("highlight"));
  });

  test("the day with keyboard focus has a ring", async () => {
    await render(<Calendar {...calendar} mode="single" />);
    await userEvent.keyboard("{Tab}{Tab}{Tab}");
    const focused = style(document.activeElement as Element);
    expect(focused.outlineStyle).toBe("solid");
    expect(contrast(focused.outlineColor, canvas())).toBeGreaterThan(3);
  });
});

describe("date picker", () => {
  test("the field keeps its edge, and the calendar's panel has one", async () => {
    await setViewport("desktop");
    await render(<DatePicker aria-label="Due date" defaultOpen />);
    const box = style(
      page.getByRole("textbox").element().parentElement as Element,
    );
    const panel = style(page.getByRole("dialog").element());
    for (const part of [box, panel]) {
      expect(part.borderTopStyle).toBe("solid");
      expect(contrast(part.borderTopColor, canvas())).toBeGreaterThan(3);
    }
  });
});
