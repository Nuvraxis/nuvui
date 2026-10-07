import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { hitAt } from "@nuvui/tooling/test/themed";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Calendar, DatePicker, DateRangePicker } from "../src";

// This file runs in a browser context of its own, one that reports a touch
// screen. What the parts measure with a mouse is checked next to each
// component.

const box = (element: Element) => element.getBoundingClientRect();
const today = new Date(2026, 9, 7);
const calendar = { today, defaultMonth: today };

test("the browser reports a touch screen", () => {
  expect(matchMedia("(pointer: coarse)").matches).toBe(true);
});

describe("calendar", () => {
  test("every day and both month buttons are 44px each way", async () => {
    await render(<Calendar {...calendar} mode="single" />);
    for (const button of page.getByRole("button").elements()) {
      expect(box(button).width).toBe(44);
      expect(box(button).height).toBe(44);
    }
    expect(page.getByRole("button").elements()).toHaveLength(33);
  });

  test("density doesn't make a day smaller than a finger", async () => {
    document.documentElement.setAttribute("data-density", "compact");
    await render(<Calendar {...calendar} mode="single" />);
    const day = page.getByRole("button", { name: /October 15th/ }).element();
    expect(box(day).height).toBe(44);
  });

  test("seven days fit across a phone, with the page's margins", async () => {
    await render(
      <div style={{ padding: 16 }}>
        <Calendar {...calendar} mode="single" />
      </div>,
    );
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });
});

describe("date picker", () => {
  test("the field is 44px tall, and a tap just outside its button still lands on it", async () => {
    await render(
      <div style={{ padding: 40 }}>
        <DatePicker aria-label="Due date" />
      </div>,
    );
    const field = page.getByRole("textbox").element();
    expect(box(field.parentElement as Element).height).toBe(44);

    const button = page.getByRole("button", { name: "Choose date" }).element();
    // Drawn 36px tall. 20px up from its center is outside it and inside a
    // 44px target.
    expect(box(button).height).toBe(36);
    expect(hitAt(button, 0, -20)).toBe(button);
  });

  test("text is 16px, so that iOS doesn't zoom in on the field", async () => {
    await render(<DateRangePicker aria-label="Stay" />);
    for (const field of page.getByRole("textbox").elements()) {
      expect(getComputedStyle(field).fontSize).toBe("16px");
    }
  });

  test("the calendar opens as a sheet, and a tap on a day picks it", async () => {
    await render(<DatePicker aria-label="Due date" calendar={calendar} />);
    await page.getByRole("button", { name: "Choose date" }).click();
    const sheet = page.getByRole("dialog", { name: "Choose date" });
    await expect.element(sheet).toBeVisible();
    await sheet.getByRole("button", { name: /October 15th/ }).click();
    await expect.element(page.getByRole("textbox")).toHaveValue("10/15/2026");
  });

  test("both fields of a range, the dash and the button fit a phone", async () => {
    await render(
      <div style={{ padding: 16 }}>
        <DateRangePicker
          aria-label="Stay"
          defaultValue={{
            from: new Date(2026, 9, 12),
            to: new Date(2026, 10, 23),
          }}
        />
      </div>,
    );
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
    // Neither date is cut short.
    for (const field of page.getByRole("textbox").elements()) {
      expect(field.scrollWidth).toBeLessThanOrEqual(field.clientWidth);
    }
  });
});
