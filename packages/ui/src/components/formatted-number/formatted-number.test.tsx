import "../../styles/index.scss";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { FormattedNumber, formatNumber } from "./formatted-number";

const style = (element: Element) => getComputedStyle(element);
const number = () => page.getByTestId("number").element() as HTMLDataElement;

// Intl puts a narrow or a non-breaking space where a locale has one. What's
// compared is the text with every kind of space made an ordinary one.
const plain = (text: string | null) => (text ?? "").replace(/\s/g, " ");

describe("formatNumber", () => {
  test("groups digits the American way unless told otherwise", () => {
    expect(formatNumber(1234567.891)).toBe("1,234,567.891");
    expect(plain(formatNumber(1234567.891, { locale: "de-DE" }))).toBe(
      "1.234.567,891",
    );
  });

  test("writes a ratio as a percentage", () => {
    expect(formatNumber(0.256, { format: "percent" })).toBe("26%");
    expect(
      formatNumber(0.256, { format: "percent", maximumFractionDigits: 1 }),
    ).toBe("25.6%");
  });

  test("a currency is enough to get a currency", () => {
    expect(formatNumber(1299.5, { currency: "USD" })).toBe("$1,299.50");
    expect(
      plain(formatNumber(1299.5, { currency: "EUR", locale: "de-DE" })),
    ).toBe("1.299,50 €");
  });

  test("format wins over what a currency would imply", () => {
    expect(formatNumber(12, { currency: "USD", format: "decimal" })).toBe("12");
  });

  test("writes a large number short", () => {
    expect(formatNumber(1_250_000, { compact: true })).toBe("1.3M");
    expect(formatNumber(1_250_000, { compact: true, currency: "USD" })).toBe(
      "$1.3M",
    );
  });

  test("writes a plus on a gain when asked", () => {
    expect(formatNumber(12, { signDisplay: "exceptZero" })).toBe("+12");
    expect(formatNumber(-12, { signDisplay: "exceptZero" })).toBe("-12");
    expect(formatNumber(0, { signDisplay: "exceptZero" })).toBe("0");
    expect(formatNumber(-12, { signDisplay: "never" })).toBe("12");
  });

  test("keeps as many decimals as it's told to", () => {
    expect(formatNumber(2, { minimumFractionDigits: 2 })).toBe("2.00");
    expect(formatNumber(2.3456, { maximumFractionDigits: 2 })).toBe("2.35");
    // Zero is a real setting, not a missing one.
    expect(formatNumber(2.6, { maximumFractionDigits: 0 })).toBe("3");
  });

  test("options go to Intl as they are, and win over the props", () => {
    expect(
      formatNumber(88, { options: { style: "unit", unit: "kilometer" } }),
    ).toBe("88 km");
    expect(
      formatNumber(1.5, {
        maximumFractionDigits: 0,
        options: { maximumFractionDigits: 1 },
      }),
    ).toBe("1.5");
  });

  test("writes the same text for the same settings every time", () => {
    const first = formatNumber(1234.5, { currency: "GBP", locale: "en-GB" });
    const second = formatNumber(1234.5, { currency: "GBP", locale: "en-GB" });

    expect(first).toBe("£1,234.50");
    expect(second).toBe(first);
  });
});

describe("rendering", () => {
  test("is a data element with the plain number as its value", async () => {
    await render(<FormattedNumber data-testid="number" value={1234.5} />);

    expect(number().tagName).toBe("DATA");
    expect(number().value).toBe("1234.5");
    expect(number().textContent).toBe("1,234.5");
    expect(number().className).toBe("nuv-formatted-number");
  });

  test("passes every setting on to the text", async () => {
    await render(
      <FormattedNumber
        data-testid="number"
        value={-0.0425}
        format="percent"
        signDisplay="exceptZero"
        minimumFractionDigits={1}
        maximumFractionDigits={1}
      />,
    );

    expect(number().textContent).toBe("-4.3%");
  });

  test("forwards its ref, a className and other props", async () => {
    const ref = createRef<HTMLDataElement>();
    await render(
      <FormattedNumber
        ref={ref}
        value={5}
        className="mine"
        title="Five seats"
      />,
    );

    expect(ref.current?.className).toBe("nuv-formatted-number mine");
    expect(ref.current?.title).toBe("Five seats");
  });
});

describe("styles", () => {
  test("has digits of one width and stays on one line", async () => {
    await render(
      <div style={{ width: 20 }}>
        <FormattedNumber
          data-testid="number"
          value={1234567}
          currency="EUR"
          locale="fr-FR"
        />
      </div>,
    );

    expect(style(number()).fontVariantNumeric).toBe("tabular-nums");
    expect(style(number()).whiteSpace).toBe("nowrap");
  });

  test("the variable gives the digits their own widths back", async () => {
    await render(
      <FormattedNumber
        data-testid="number"
        value={1}
        style={{ "--nuv-formatted-number-numeric": "normal" } as never}
      />,
    );

    expect(style(number()).fontVariantNumeric).toBe("normal");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe", async () => {
    const screen = await renderThemed(
      theme,
      <p>
        Revenue was <FormattedNumber value={48250} currency="USD" /> this month.
      </p>,
    );

    await expectNoViolations(screen.container);
  });
});
