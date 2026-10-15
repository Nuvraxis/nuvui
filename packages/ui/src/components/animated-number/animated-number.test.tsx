import "../../styles/index.scss";
import { emulateMedia } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  themeAttributes,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { AnimatedNumber } from "./animated-number";

const style = (element: Element) => getComputedStyle(element);
const root = () =>
  document.querySelector(".nuv-animated-number") as HTMLDataElement;
const text = () =>
  document.querySelector(".nuv-animated-number__text") as HTMLElement;
const motion = () =>
  document.querySelector(".nuv-animated-number__motion") as HTMLElement | null;
const digits = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>(".nuv-animated-number__digit"),
  );
const reels = () =>
  digits().map((digit) =>
    Array.from(
      digit.querySelectorAll(".nuv-animated-number__numeral"),
      (numeral) => numeral.textContent,
    ).join(""),
  );

// Waits for the moving copy to have arrived and gone.
const settled = () => expect.poll(() => motion(), { timeout: 4000 }).toBeNull();

describe("rendering", () => {
  test("is a data element with the plain number, and its text written out", async () => {
    await render(<AnimatedNumber value={1234.5} />);

    expect(root().tagName).toBe("DATA");
    expect(root().value).toBe("1234.5");
    expect(root().className).toBe(
      "nuv-animated-number nuv-animated-number--roll",
    );
    expect(root().dataset.state).toBe("still");
    expect(text().textContent).toBe("1,234.5");
    expect(motion()).toBeNull();
  });

  test("writes the number as FormattedNumber does", async () => {
    await render(
      <AnimatedNumber value={1299.5} currency="EUR" locale="de-DE" />,
    );

    expect(text().textContent?.replace(/\s/g, " ")).toBe("1.299,50 €");
  });

  test("forwards its ref, a className and other props", async () => {
    const ref = createRef<HTMLDataElement>();
    await render(
      <AnimatedNumber
        ref={ref}
        value={3}
        animation="pop"
        className="mine"
        id="count"
        aria-live="polite"
      />,
    );

    expect(ref.current).toBe(root());
    expect(root().className).toBe(
      "nuv-animated-number nuv-animated-number--pop mine",
    );
    expect(root().id).toBe("count");
    expect(root().getAttribute("aria-live")).toBe("polite");
  });

  test("the page from the server has the number, and nothing that moves", () => {
    const html = renderToString(<AnimatedNumber value={98765} />);

    expect(html).toContain("98,765");
    expect(html).toContain('data-state="still"');
    expect(html).not.toContain("nuv-animated-number__motion");
    expect(html).not.toContain("style=");
  });

  test("the digits all have one width, so a changing number doesn't push what's next to it", async () => {
    await render(<AnimatedNumber value={1} />);

    expect(style(root()).fontVariantNumeric).toBe("tabular-nums");
    expect(style(root()).whiteSpace).toBe("nowrap");
  });
});

describe("with motion", () => {
  test("only the digits that change move, and the text under them is the new number", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const screen = await render(<AnimatedNumber value={1234} />);

    await screen.rerender(<AnimatedNumber value={1240} />);

    expect(root().dataset.state).toBe("moving");
    expect(text().textContent).toBe("1,240");
    expect(style(text()).opacity).toBe("0");
    expect(motion()?.getAttribute("aria-hidden")).toBe("true");
    expect(digits()).toHaveLength(2);
    // 3 rolls up to 4, and 4 rolls up past nine to 0.
    expect(reels()).toEqual(["34", "4567890"]);
    await settled();
    expect(root().dataset.state).toBe("still");
    expect(style(text()).opacity).toBe("1");
  });

  test("a number that goes down rolls the other way", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const screen = await render(<AnimatedNumber value={5} />);

    await screen.rerender(<AnimatedNumber value={3} />);

    expect(motion()?.dataset.direction).toBe("down");
    // The column is listed from the top, with the new digit there, and
    // starts at the bottom, on the old one.
    expect(reels()).toEqual(["345"]);
    const digit = digits()[0] as HTMLElement;
    expect(digit.style.getPropertyValue("--nuv-animated-number-from")).toBe(
      "-200%",
    );
    expect(digit.style.getPropertyValue("--nuv-animated-number-to")).toBe("0%");
    await settled();
  });

  test("a negative number rolls the way its size goes, since the sign is written apart", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const screen = await render(<AnimatedNumber value={-3} />);

    await screen.rerender(<AnimatedNumber value={-5} />);

    expect(motion()?.dataset.direction).toBe("up");
    expect(reels()).toEqual(["345"]);
    await settled();

    await screen.rerender(<AnimatedNumber value={-4} />);

    expect(motion()?.dataset.direction).toBe("down");
    expect(reels()).toEqual(["45"]);
    await settled();
  });

  test("a place the number didn't have counts up from zero", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const screen = await render(<AnimatedNumber value={97} />);

    await screen.rerender(<AnimatedNumber value={103} />);

    // The hundreds are new, the tens go from 9 to 0, the ones from 7 to 3.
    expect(reels()).toEqual(["01", "90", "7890123"]);
    await settled();
  });

  test("each digit that moves is drawn over the place the text has it", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const screen = await render(
      <p style={{ fontSize: 32, lineHeight: 1.6 }}>
        Total <AnimatedNumber value={1234} /> today
      </p>,
    );
    const before = root().getBoundingClientRect();

    await screen.rerender(
      <p style={{ fontSize: 32, lineHeight: 1.6 }}>
        Total <AnimatedNumber value={1289} /> today
      </p>,
    );

    const gaps = Array.from(
      document.querySelectorAll(".nuv-animated-number__gap"),
    );
    expect(gaps).toHaveLength(2);
    digits().forEach((digit, index) => {
      const box = digit.getBoundingClientRect();
      const gap = (gaps[index] as Element).getBoundingClientRect();
      expect(Math.abs(box.left - gap.left)).toBeLessThan(0.5);
      expect(Math.abs(box.top - gap.top)).toBeLessThan(0.5);
      expect(Math.abs(box.width - gap.width)).toBeLessThan(0.5);
      expect(Math.abs(box.height - gap.height)).toBeLessThan(0.5);
    });
    // Nothing beside the number moved.
    const during = root().getBoundingClientRect();
    expect(during.width).toBeCloseTo(before.width, 1);
    expect(during.left).toBeCloseTo(before.left, 1);
    await settled();
  });

  test("the copy is laid out the way the text is, in a language read from the right", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const screen = await render(
      <p dir="rtl" lang="ar">
        <AnimatedNumber value={1204} locale="ar-EG" />
      </p>,
    );

    await screen.rerender(
      <p dir="rtl" lang="ar">
        <AnimatedNumber value={1265} locale="ar-EG" />
      </p>,
    );

    // The text and its copy have the same characters in the same places.
    const range = document.createRange();
    const node = text().firstChild as Text;
    const copy = Array.from(motion()?.children ?? []).filter(
      (child) => !child.classList.contains("nuv-animated-number__digit"),
    );
    let offset = 0;
    for (const character of copy) {
      const length = (character.textContent ?? "").length;
      range.setStart(node, offset);
      range.setEnd(node, offset + length);
      offset += length;
      const want = range.getBoundingClientRect();
      const got = character.getBoundingClientRect();
      // A character out of order would be a whole digit away. WebKit puts
      // one run of text and a row of spans up to a pixel apart.
      expect(Math.abs(want.left - got.left)).toBeLessThan(1);
    }
    await settled();
  });

  test("a numbering system that isn't Latin rolls through its own digits", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const screen = await render(<AnimatedNumber value={1} locale="ar-EG" />);

    await screen.rerender(<AnimatedNumber value={3} locale="ar-EG" />);

    expect(text().textContent).toBe("٣");
    expect(reels()).toEqual(["١٢٣"]);
    await settled();
  });

  // A sign before the number and after it, a comma and a point, a
  // currency with cents and one without.
  test.each([
    ["EUR", "de-DE"],
    ["GBP", "en-GB"],
    ["JPY", "ja-JP"],
    ["CHF", "de-CH"],
    ["INR", "en-IN"],
  ])(
    "separators, signs and the currency stay where they are: %s in %s",
    async (currency, locale) => {
      await emulateMedia({ reducedMotion: "no-preference" });
      const screen = await render(
        <AnimatedNumber value={-1200} currency={currency} locale={locale} />,
      );
      const symbol = new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
      })
        .formatToParts(1)
        .find((part) => part.type === "currency")?.value;

      await screen.rerender(
        <AnimatedNumber value={-1300} currency={currency} locale={locale} />,
      );

      expect(text().textContent).toBe(
        new Intl.NumberFormat(locale, { style: "currency", currency }).format(
          -1300,
        ),
      );
      expect(digits()).toHaveLength(1);
      expect(reels()).toEqual(["23"]);
      // The currency is in the copy as it is, not in anything that moves.
      expect(symbol).toBeTruthy();
      expect(motion()?.textContent).toContain(symbol);
      for (const digit of digits()) {
        expect(digit.textContent).not.toContain(symbol);
      }
      await settled();
    },
  );

  test("pop: the old digit leaves as the new one comes, each after the one before", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const screen = await render(<AnimatedNumber value={18} animation="pop" />);

    await screen.rerender(<AnimatedNumber value={27} animation="pop" />);

    const [tens, ones] = digits() as [HTMLElement, HTMLElement];
    expect(tens.querySelector(".nuv-animated-number__old")?.textContent).toBe(
      "1",
    );
    expect(tens.querySelector(".nuv-animated-number__new")?.textContent).toBe(
      "2",
    );
    expect(
      style(tens.querySelector(".nuv-animated-number__new") as Element)
        .animationName,
    ).toBe("nuv-animated-number-in");
    expect(
      style(ones.querySelector(".nuv-animated-number__new") as Element)
        .animationDelay,
    ).toBe("0.04s");
    await settled();
  });

  test("pop: a new place has nothing to leave", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const screen = await render(<AnimatedNumber value={9} animation="pop" />);

    await screen.rerender(<AnimatedNumber value={10} animation="pop" />);

    const [tens] = digits() as [HTMLElement];
    expect(tens.querySelector(".nuv-animated-number__old")).toBeNull();
    await settled();
  });

  test("a new value mid-way moves on from where the last one was going", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const screen = await render(<AnimatedNumber value={1} />);

    await screen.rerender(<AnimatedNumber value={4} />);
    await screen.rerender(<AnimatedNumber value={6} />);

    expect(text().textContent).toBe("6");
    expect(reels()).toEqual(["456"]);
    await settled();
    expect(text().textContent).toBe("6");
  });

  test("the same text from a new value moves nothing", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const screen = await render(
      <AnimatedNumber value={1.234} maximumFractionDigits={1} />,
    );

    await screen.rerender(
      <AnimatedNumber value={1.21} maximumFractionDigits={1} />,
    );

    expect(motion()).toBeNull();
    expect(root().value).toBe("1.21");
  });

  test("the moving copy can't be selected, so a copy and paste gets the number once", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const screen = await render(<AnimatedNumber value={1} />);

    await screen.rerender(<AnimatedNumber value={2} />);

    expect(style(motion() as Element).userSelect).toBe("none");
    expect(style(motion() as Element).pointerEvents).toBe("none");
    await settled();
  });

  test("component variables change the timing", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const variables = {
      "--nuv-animated-number-duration": "1200ms",
      "--nuv-animated-number-stagger": "90ms",
    } as never;
    const screen = await render(
      <div style={variables}>
        <AnimatedNumber value={11} />
      </div>,
    );

    await screen.rerender(
      <div style={variables}>
        <AnimatedNumber value={22} />
      </div>,
    );

    const [, ones] = digits() as [HTMLElement, HTMLElement];
    const reel = ones.querySelector(".nuv-animated-number__reel") as Element;
    expect(style(reel).animationDuration).toBe("1.2s");
    expect(style(reel).animationDelay).toBe("0.09s");
  });
});

describe("with less motion", () => {
  test("the new number is there at once, and nothing moves", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const screen = await render(<AnimatedNumber value={1234} />);

    await screen.rerender(<AnimatedNumber value={1240} />);

    expect(motion()).toBeNull();
    expect(root().dataset.state).toBe("still");
    expect(text().textContent).toBe("1,240");
    expect(style(text()).opacity).toBe("1");
  });

  test("pop too", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const screen = await render(<AnimatedNumber value={1} animation="pop" />);

    await screen.rerender(<AnimatedNumber value={2} animation="pop" />);

    expect(motion()).toBeNull();
  });
});

describe("for a screen reader", () => {
  test("the number is read once, as text, while it moves and after", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const screen = await render(<AnimatedNumber value={1234} />);

    await screen.rerender(<AnimatedNumber value={1240} />);

    // The text is see-through and still read. The copy is hidden.
    await expect
      .element(page.getByText("1,240", { exact: true }))
      .toBeInTheDocument();
    expect(text().closest("[aria-hidden]")).toBeNull();
    expect(motion()?.getAttribute("aria-hidden")).toBe("true");
    await settled();
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, still and moving", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const screen = await renderThemed(
      theme,
      <p>
        Orders <AnimatedNumber value={120} />
      </p>,
    );
    await expectNoViolations(screen.container);

    // What renderThemed draws around it, so the theme stays.
    await screen.rerender(
      <main
        {...themeAttributes(theme)}
        style={{
          padding: 16,
          backgroundColor: "var(--color-background)",
          color: "var(--color-foreground)",
        }}
      >
        <p>
          Orders <AnimatedNumber value={135} />
        </p>
      </main>,
    );
    await expectNoViolations(screen.container);
  });
});
