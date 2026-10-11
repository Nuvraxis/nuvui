import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { barHeights, drawnBars, readCode } from "../../../test/read";
import { Barcode, type BarcodeType, barcodeTypes, encodeBarcode } from ".";

const code = () => {
  const found = document.querySelector<SVGSVGElement>(".nuv-barcode");
  if (!found) throw new Error("no barcode on the page");
  return found;
};
const texts = () =>
  Array.from(
    code().querySelectorAll(".nuv-barcode__text"),
    (text) => text.textContent,
  );
const fill = (selector: string) =>
  getComputedStyle(code().querySelector(selector) as Element).fill;

// A value each kind takes, and what's written under it: the same, or with
// the check digit the encoder worked out.
const samples: Record<BarcodeType, [value: string, text: string]> = {
  code128: ["Hello 123456", "Hello 123456"],
  "gs1-128": ["0101234567890128", "0101234567890128"],
  code39: ["AB-12", "AB-12"],
  "code39-mod43": ["AB-12", "AB-12H"],
  ean13: ["590123412345", "5901234123457"],
  ean8: ["9638507", "96385074"],
  upca: ["12345678901", "123456789012"],
  upce: ["01234565", "01234565"],
  itf: ["123456", "123456"],
  itf14: ["1234567890123", "12345678901231"],
  msi: ["1234", "1234"],
  "msi-mod10": ["1234", "12344"],
  "msi-mod11": ["1234", "12343"],
  "msi-mod1010": ["1234", "123448"],
  "msi-mod1110": ["1234", "123430"],
  codabar: ["A40156B", "40156"],
  pharmacode: ["1234", "1234"],
};

describe("rendering", () => {
  test("it's a picture named by its value, as wide as its bars and the space at its ends", async () => {
    await render(<Barcode value="Hello 123456" />);
    const encoding = encodeBarcode("Hello 123456");

    expect(code().getAttribute("role")).toBe("img");
    expect(code().getAttribute("aria-label")).toBe("Hello 123456");
    expect(code().dataset.type).toBe("code128");
    // Code 128: a start, twelve characters or fewer packed in pairs, a
    // check and a stop, each eleven modules but the stop's thirteen.
    expect(encoding?.modules).toBe(145);
    expect(code().getAttribute("width")).toBe(String((145 + 20) * 2));
    // The bars, two pixels, and room for the text and what hangs under it.
    expect(code().getAttribute("height")).toBe(String(64 + 2 + 14 * 1.25));
    expect(code().getAttribute("viewBox")).toBe("0 0 330 83.5");
    expect(texts()).toEqual(["Hello 123456"]);
  });

  test("the name is yours when you give one, or comes from something on the page", async () => {
    const screen = await render(
      <Barcode value="4006381333931" aria-label="Order 1042" />,
    );
    expect(code().getAttribute("aria-label")).toBe("Order 1042");

    await screen.rerender(
      <>
        <p id="what">Parcel 7</p>
        <Barcode value="4006381333931" aria-labelledby="what" />
      </>,
    );
    expect(code().hasAttribute("aria-label")).toBe(false);
    expect(code().getAttribute("aria-labelledby")).toBe("what");
  });

  test("it takes a ref, a class and other attributes", async () => {
    const ref = createRef<SVGSVGElement>();
    await render(
      <Barcode ref={ref} value="A1" className="mine" data-kind="label" />,
    );

    expect(ref.current).toBe(code());
    expect(code().getAttribute("class")).toBe("nuv-barcode mine");
    expect(code().dataset.kind).toBe("label");
  });

  test("the bars' width, their height and the space at the ends are set", async () => {
    await render(
      <Barcode
        value="1234"
        type="msi"
        barWidth={3}
        height={40}
        quietZone={4}
      />,
    );

    // MSI: a start of three, twelve for each digit, a stop of four.
    expect(code().getAttribute("width")).toBe(String((55 + 8) * 3));
    expect(barHeights(code())).toEqual([40]);
    expect(drawnBars(code(), { barWidth: 3, quietZone: 4 })).toBe(
      encodeBarcode("1234", "msi")?.parts[0]?.bars,
    );
  });

  test("without the text there's only the bars", async () => {
    await render(<Barcode value="1234" type="msi" showText={false} />);

    expect(texts()).toEqual([]);
    expect(code().getAttribute("height")).toBe("64");
  });

  test("the text can be other than the value, and its size is set", async () => {
    await render(<Barcode value="00123456" text="00 123 456" textSize={20} />);

    expect(texts()).toEqual(["00 123 456"]);
    expect(code().querySelector("text")?.getAttribute("font-size")).toBe("20");
    expect(code().getAttribute("height")).toBe(String(64 + 2 + 25));
    // What's read is still the value.
    expect((await readCode(code()))?.text).toBe("00123456");
  });
});

describe("the bars", () => {
  test("an MSI is its start, four bits for each digit, and its stop", async () => {
    await render(<Barcode value="1234" type="msi" />);

    // A bit that's 0 is "100" and a bit that's 1 is "110".
    expect(drawnBars(code())).toBe(
      [
        "110",
        "100100100110",
        "100100110100",
        "100100110110",
        "100110100100",
        "1001",
      ].join(""),
    );
  });

  test("a pharmacode is narrow and wide bars for the number in twos", async () => {
    await render(<Barcode value="1234" type="pharmacode" />);

    expect(drawnBars(code())).toBe("10010011100111001001110010010011100111");
  });

  test("a UPC-E is its digits in the parities its check digit picks", async () => {
    await render(<Barcode value="01234565" type="upce" />);
    const bars = drawnBars(code());

    // Eight modules of room for the first digit, the start, six digits of
    // seven modules, the end, and room for the check digit.
    expect(bars).toBe(
      [
        "00000000",
        "101",
        "0110011",
        "0010011",
        "0111101",
        "0011101",
        "0111001",
        "0101111",
        "010101",
        "00000000",
      ].join(""),
    );
    expect(texts()).toEqual(["0", "123456", "5"]);
  });

  test("an EAN-13 has taller bars at its ends and middle, and its digits in three groups", async () => {
    await render(<Barcode value="590123412345" type="ean13" />);

    expect(texts()).toEqual(["5", "901234", "123457"]);
    // Down to the middle of the text.
    expect(barHeights(code())).toEqual([64, 64 + 2 + 7]);
    expect(code().getAttribute("aria-label")).toBe("5901234123457");
  });

  test("flat, an EAN-13 is one height with its digits in one line", async () => {
    await render(<Barcode value="590123412345" type="ean13" flat />);

    expect(texts()).toEqual(["5901234123457"]);
    expect(barHeights(code())).toEqual([64]);
    // Three for each end, five in the middle, and twelve digits of seven.
    expect(drawnBars(code()).length).toBe(95);
  });

  test("without the text, the taller bars are no taller", async () => {
    await render(
      <Barcode value="590123412345" type="ean13" showText={false} />,
    );

    expect(barHeights(code())).toEqual([64]);
  });
});

describe("check digits and what each kind takes", () => {
  test.for(barcodeTypes)(
    "%s takes its sample, and writes its check digit",
    (type) => {
      const [value, text] = samples[type];

      expect(encodeBarcode(value, type)?.text).toBe(text);
      expect(encodeBarcode(value, type)?.type).toBe(type);
    },
  );

  test.for<[BarcodeType, string, string]>([
    ["code128", "", "nothing"],
    ["code128", "Zoë", "a letter outside ASCII"],
    ["code39", "AB#", "a sign it has no bars for"],
    ["ean13", "59012341234", "eleven digits"],
    ["ean13", "5901234123450", "a check digit that's wrong"],
    ["ean13", "59012341234a", "a letter"],
    ["ean8", "123", "three digits"],
    ["upca", "1234567890123", "thirteen digits"],
    ["upce", "01234567", "a check digit that's wrong"],
    ["itf", "12345", "an odd number of digits"],
    ["itf14", "123", "three digits"],
    ["msi", "12a4", "a letter"],
    ["codabar", "12E4", "a letter it has no bars for"],
    ["pharmacode", "2", "a number under 3"],
    ["pharmacode", "131071", "a number over 131070"],
  ])("%s doesn't take %s (%s)", ([type, value]) => {
    expect(encodeBarcode(value, type)).toBe(null);
  });

  test("a full EAN-13 is taken as it is when its check digit is right", () => {
    expect(encodeBarcode("5901234123457", "ean13")?.text).toBe("5901234123457");
  });

  test("a kind there isn't gives nothing, and doesn't throw", () => {
    expect(encodeBarcode("123", "qr" as BarcodeType)).toBe(null);
  });
});

describe("a value that can't be a barcode", () => {
  test("is an empty box with a line through it, marked, with no bars", async () => {
    await render(<Barcode value="12ab" type="ean13" aria-label="Item 12" />);

    expect(code().hasAttribute("data-invalid")).toBe(true);
    expect(code().querySelector(".nuv-barcode__bars")).toBe(null);
    expect(code().querySelector(".nuv-barcode__mark")).not.toBe(null);
    expect(code().getAttribute("aria-label")).toBe("Item 12");
    expect(await readCode(code())).toBe(null);
  });

  test("is whatever you give for it", async () => {
    const screen = await render(
      <Barcode
        value="12ab"
        type="ean13"
        fallback={<p>This item has no barcode.</p>}
      />,
    );

    await expect
      .element(screen.getByText("This item has no barcode."))
      .toBeVisible();
    expect(document.querySelector(".nuv-barcode")).toBe(null);
  });

  test("is nothing at all when that's what you give", async () => {
    const screen = await render(<Barcode value="" fallback={null} />);

    expect(screen.container.innerHTML).toBe("");
  });
});

describe("read back", () => {
  // The reader has no MSI or pharmacode, and its UPC-E doesn't read a
  // UPC-E from anywhere. Those three are checked bar by bar above.
  test.for<[BarcodeType, string, string]>([
    ["code128", "CODE_128", "Hello 123456"],
    ["gs1-128", "CODE_128", "0101234567890128"],
    ["code39", "CODE_39", "AB-12"],
    ["code39-mod43", "CODE_39", "AB-12H"],
    ["ean13", "EAN_13", "5901234123457"],
    ["ean8", "EAN_8", "96385074"],
    ["upca", "UPC_A", "123456789012"],
    ["itf", "ITF", "123456"],
    ["itf14", "ITF", "12345678901231"],
    ["codabar", "CODABAR", "A40156B"],
  ])("a %s is read as a %s holding %s", async ([type, format, text]) => {
    await render(<Barcode value={samples[type][0]} type={type} />);

    expect(await readCode(code())).toEqual({ text, format });
  });

  test("in a dark theme it reads the same", async () => {
    await renderThemed("dark", <Barcode value="Hello 123456" />);

    expect((await readCode(code()))?.text).toBe("Hello 123456");
  });

  test("with one-pixel bars it reads the same", async () => {
    await render(<Barcode value="Hello 123456" barWidth={1} />);

    expect((await readCode(code()))?.text).toBe("Hello 123456");
  });
});

describe("styles", () => {
  test.for(["light", "dark"] as const)(
    "in %s the bars are black on white, whatever the theme",
    async (theme) => {
      await renderThemed(theme, <Barcode value="Hello 123456" />);

      expect(fill(".nuv-barcode__bars")).toBe("rgb(0, 0, 0)");
      expect(fill(".nuv-barcode__ground")).toBe("rgb(255, 255, 255)");
      expect(fill(".nuv-barcode__text")).toBe("rgb(0, 0, 0)");
    },
  );

  test("forced colors leave it black on white", async () => {
    await emulateMedia({ forcedColors: "active" });
    await render(<Barcode value="Hello 123456" />);

    expect(fill(".nuv-barcode__bars")).toBe("rgb(0, 0, 0)");
    expect(fill(".nuv-barcode__ground")).toBe("rgb(255, 255, 255)");
  });

  test("component variables change the colors and the font", async () => {
    await render(
      <div
        style={
          {
            "--nuv-barcode-fg": "rgb(10, 20, 80)",
            "--nuv-barcode-bg": "rgb(250, 250, 240)",
            "--nuv-barcode-font": "serif",
            "--nuv-barcode-invalid": "rgb(1, 2, 3)",
          } as never
        }
      >
        <Barcode value="Hello 123456" />
      </div>,
    );

    expect(fill(".nuv-barcode__bars")).toBe("rgb(10, 20, 80)");
    expect(fill(".nuv-barcode__ground")).toBe("rgb(250, 250, 240)");
    expect(fill(".nuv-barcode__text")).toBe("rgb(10, 20, 80)");
    expect(
      getComputedStyle(code().querySelector("text") as Element).fontFamily,
    ).toBe("serif");
  });

  test("the line through one that can't be drawn is the danger color, and takes a variable", async () => {
    const screen = await render(<Barcode value="" />);
    const stroke = () =>
      getComputedStyle(code().querySelector(".nuv-barcode__mark") as Element)
        .stroke;
    const first = stroke();
    expect(contrast(first, "rgb(255, 255, 255)")).toBeGreaterThanOrEqual(3);

    await screen.rerender(
      <div style={{ "--nuv-barcode-invalid": "rgb(1, 2, 3)" } as never}>
        <Barcode value="" />
      </div>,
    );
    expect(stroke()).toBe("rgb(1, 2, 3)");
  });

  test("in a space that's too narrow it shrinks, and keeps its shape", async () => {
    await render(
      <div style={{ width: 165 }}>
        <Barcode value="Hello 123456" />
      </div>,
    );
    const box = code().getBoundingClientRect();

    expect(box.width).toBe(165);
    expect(box.height).toBeCloseTo(83.5 / 2, 1);
  });

  test("the text is drawn in a monospace font, read from the left", async () => {
    await render(
      <div dir="rtl">
        <Barcode value="590123412345" type="ean13" />
      </div>,
    );
    const style = getComputedStyle(code().querySelector("text") as Element);

    expect(style.direction).toBe("ltr");
    expect(style.fontFamily).toMatch(/mono/i);
    // And the bars aren't turned round where the page reads from the
    // right: it reads the same.
    expect((await readCode(code()))?.text).toBe("5901234123457");
  });
});

describe("accessibility", () => {
  test.for(themes)("passes axe in %s", async (theme) => {
    const { container } = await renderThemed(
      theme,
      <>
        <Barcode value="590123412345" type="ean13" aria-label="Item 5901234" />
        <Barcode value="" aria-label="An item with no number" />
      </>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
