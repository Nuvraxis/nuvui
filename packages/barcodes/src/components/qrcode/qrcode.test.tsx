import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { drawnSquares, readCode } from "../../../test/read";
import {
  encodeQRCode,
  QRCode,
  type QRCodeErrorCorrection,
  QRCodeSwissCross,
} from ".";

const address = "https://nuvui.nuvraxis.com/docs";

const code = () => {
  const found = document.querySelector<SVGSVGElement>(".nuv-qrcode");
  if (!found) throw new Error("no QR code on the page");
  return found;
};
const overlay = () =>
  code().querySelector<SVGSVGElement>(".nuv-qrcode__overlay");
const fill = (selector: string) =>
  getComputedStyle(code().querySelector(selector) as Element).fill;
const rows = (level: QRCodeErrorCorrection) =>
  encodeQRCode(address, { errorCorrection: level })?.rows.map((row) =>
    row.map((dark) => (dark ? "1" : "0")).join(""),
  );

describe("rendering", () => {
  test("it's a square picture named by its value, with four squares of space around it", async () => {
    await render(<QRCode value={address} />);

    expect(code().getAttribute("role")).toBe("img");
    expect(code().getAttribute("aria-label")).toBe(address);
    expect(code().getAttribute("width")).toBe("160");
    expect(code().getAttribute("height")).toBe("160");
    // At "M" this address is a version 3 code, 29 squares a side.
    expect(code().dataset.version).toBe("3");
    expect(code().dataset.errorCorrection).toBe("M");
    expect(code().getAttribute("viewBox")).toBe("0 0 37 37");
  });

  test("what's drawn is the code's squares, square for square", async () => {
    await render(<QRCode value={address} />);

    expect(drawnSquares(code())).toEqual(rows("M"));
  });

  test("the name is yours when you give one, or comes from something on the page", async () => {
    const screen = await render(
      <QRCode value={address} aria-label="Open the docs" />,
    );
    expect(code().getAttribute("aria-label")).toBe("Open the docs");

    await screen.rerender(
      <>
        <p id="what">Scan to open the docs</p>
        <QRCode value={address} aria-labelledby="what" />
      </>,
    );
    expect(code().hasAttribute("aria-label")).toBe(false);
    expect(code().getAttribute("aria-labelledby")).toBe("what");
  });

  test("it takes a ref, a class and other attributes", async () => {
    const ref = createRef<SVGSVGElement>();
    await render(
      <QRCode ref={ref} value={address} className="mine" data-kind="ticket" />,
    );

    expect(ref.current).toBe(code());
    expect(code().getAttribute("class")).toBe("nuv-qrcode mine");
    expect(code().dataset.kind).toBe("ticket");
  });

  test("the size and the space around it are set", async () => {
    await render(<QRCode value={address} size={300} quietZone={1} />);

    expect(code().getAttribute("width")).toBe("300");
    expect(code().getAttribute("viewBox")).toBe("0 0 31 31");
    expect(drawnSquares(code(), 1)).toEqual(rows("M"));
  });
});

describe("error correction", () => {
  test.for<[QRCodeErrorCorrection, number]>([
    ["L", 25],
    ["M", 29],
    ["Q", 29],
    ["H", 33],
  ])("at %s the address takes %i squares a side", async ([level, side]) => {
    await render(<QRCode value={address} errorCorrection={level} />);

    expect(code().dataset.errorCorrection).toBe(level);
    expect(code().getAttribute("viewBox")).toBe(`0 0 ${side + 8} ${side + 8}`);
    expect(drawnSquares(code())).toEqual(rows(level));
  });

  test("the encoder says how big the code had to be", () => {
    expect(encodeQRCode("hi")).toMatchObject({
      size: 21,
      version: 1,
      errorCorrection: "M",
    });
  });
});

describe("something over the middle", () => {
  test("goes in a box a fifth of the code across, in the middle, on a ground of its own", async () => {
    await render(
      <QRCode
        value={address}
        overlay={<circle data-testid="logo" cx="50" cy="50" r="40" />}
      />,
    );
    const box = overlay();

    // 33 squares a side at "H". A fifth of that, and the same space on
    // both sides of it.
    expect(box?.getAttribute("width")).toBe("6.6");
    expect(box?.getAttribute("height")).toBe("6.6");
    expect(box?.getAttribute("x")).toBe(String(4 + (33 - 6.6) / 2));
    expect(box?.getAttribute("y")).toBe(box?.getAttribute("x"));
    expect(box?.getAttribute("viewBox")).toBe("0 0 100 100");
    expect(box?.querySelector(".nuv-qrcode__ground")).not.toBe(null);
    expect(box?.querySelector("[data-testid='logo']")).not.toBe(null);
  });

  test("raises the error correction to the highest, unless you set it", async () => {
    const screen = await render(
      <QRCode value={address} overlay={<circle cx="50" cy="50" r="40" />} />,
    );
    expect(code().dataset.errorCorrection).toBe("H");

    await screen.rerender(
      <QRCode
        value={address}
        errorCorrection="Q"
        overlay={<circle cx="50" cy="50" r="40" />}
      />,
    );
    expect(code().dataset.errorCorrection).toBe("Q");
  });

  test("nothing given for it is no overlay, and the usual error correction", async () => {
    await render(<QRCode value={address} overlay={null} />);

    expect(overlay()).toBe(null);
    expect(code().dataset.errorCorrection).toBe("M");
  });

  test("is kept between a tenth and three tenths of the code", async () => {
    const screen = await render(
      <QRCode value={address} overlaySize={0.9} overlay={<g />} />,
    );
    expect(Number(overlay()?.getAttribute("width"))).toBeCloseTo(33 * 0.3);

    await screen.rerender(
      <QRCode value={address} overlaySize={0.01} overlay={<g />} />,
    );
    expect(Number(overlay()?.getAttribute("width"))).toBeCloseTo(33 * 0.1);
  });

  test("the Swiss cross is black with a white cross, whatever the code's colors", async () => {
    await render(
      <div
        style={
          {
            "--nuv-qrcode-fg": "rgb(10, 20, 80)",
            "--nuv-qrcode-bg": "rgb(250, 250, 240)",
          } as never
        }
      >
        <QRCode
          value={address}
          errorCorrection="M"
          overlaySize={0.152}
          overlay={<QRCodeSwissCross className="mine" data-kind="bill" />}
        />
      </div>,
    );
    const cross = code().querySelector(".nuv-qrcode__overlay g");

    expect(cross?.getAttribute("class")).toBe("mine");
    expect(cross?.getAttribute("data-kind")).toBe("bill");
    expect(fill(".nuv-qrcode__cross-ground")).toBe("rgb(0, 0, 0)");
    expect(fill(".nuv-qrcode__cross-arms")).toBe("rgb(255, 255, 255)");
    expect(Number(overlay()?.getAttribute("width"))).toBeCloseTo(29 * 0.152);
  });
});

describe("a value that can't be a QR code", () => {
  test("nothing, or more than a code holds, is no code", () => {
    expect(encodeQRCode("")).toBe(null);
    // The most a code holds at the highest level, and one more.
    expect(
      encodeQRCode("x".repeat(1273), { errorCorrection: "H" })?.version,
    ).toBe(40);
    expect(encodeQRCode("x".repeat(1274), { errorCorrection: "H" })).toBe(null);
    // And at the lowest.
    expect(
      encodeQRCode("x".repeat(2953), { errorCorrection: "L" })?.version,
    ).toBe(40);
    expect(encodeQRCode("x".repeat(2954), { errorCorrection: "L" })).toBe(null);
  });

  test("is an empty box with a line through it, marked, with no squares", async () => {
    await render(<QRCode value="" aria-label="A ticket with no number" />);

    expect(code().hasAttribute("data-invalid")).toBe(true);
    expect(code().querySelector(".nuv-qrcode__squares")).toBe(null);
    expect(code().querySelector(".nuv-qrcode__mark")).not.toBe(null);
    expect(code().getAttribute("width")).toBe("160");
    expect(await readCode(code())).toBe(null);
  });

  test("is whatever you give for it, or nothing at all", async () => {
    const screen = await render(
      <QRCode value="" fallback={<p>This ticket has no code.</p>} />,
    );
    await expect
      .element(screen.getByText("This ticket has no code."))
      .toBeVisible();
    expect(document.querySelector(".nuv-qrcode")).toBe(null);

    await screen.rerender(<QRCode value="" fallback={null} />);
    expect(screen.container.innerHTML).toBe("");
  });
});

describe("read back", () => {
  test.for<QRCodeErrorCorrection>(["L", "M", "Q", "H"])(
    "at %s it reads as the address",
    async (level) => {
      await render(<QRCode value={address} errorCorrection={level} />);

      expect(await readCode(code())).toEqual({
        text: address,
        format: "QR_CODE",
      });
    },
  );

  test("with something over the middle it still reads", async () => {
    await render(
      <QRCode
        value={address}
        size={240}
        overlay={<circle cx="50" cy="50" r="40" />}
      />,
    );

    expect((await readCode(code()))?.text).toBe(address);
  });

  test("a Swiss cross on a bill's code, at the size and level a bill asks for, still reads", async () => {
    const bill = "SPC\n0200\n1\nCH4431999123000889012\nS\nRobert Schneider AG";
    await render(
      <QRCode
        value={bill}
        size={240}
        errorCorrection="M"
        overlaySize={0.152}
        overlay={<QRCodeSwissCross />}
      />,
    );

    expect((await readCode(code()))?.text).toBe(bill);
  });

  test("text that isn't Latin reads back as it went in", async () => {
    await render(<QRCode value="Grüße, 世界" size={240} />);

    expect((await readCode(code()))?.text).toBe("Grüße, 世界");
  });

  test("in a dark theme it reads the same", async () => {
    await renderThemed("dark", <QRCode value={address} />);

    expect((await readCode(code()))?.text).toBe(address);
  });
});

describe("styles", () => {
  test.for(["light", "dark"] as const)(
    "in %s the squares are black on white, whatever the theme",
    async (theme) => {
      await renderThemed(theme, <QRCode value={address} />);

      expect(fill(".nuv-qrcode__squares")).toBe("rgb(0, 0, 0)");
      expect(fill(".nuv-qrcode__ground")).toBe("rgb(255, 255, 255)");
    },
  );

  test("forced colors leave it black on white", async () => {
    await emulateMedia({ forcedColors: "active" });
    await render(<QRCode value={address} />);

    expect(fill(".nuv-qrcode__squares")).toBe("rgb(0, 0, 0)");
    expect(fill(".nuv-qrcode__ground")).toBe("rgb(255, 255, 255)");
  });

  test("component variables change the colors, under the overlay as well", async () => {
    await render(
      <div
        style={
          {
            "--nuv-qrcode-fg": "rgb(10, 20, 80)",
            "--nuv-qrcode-bg": "rgb(250, 250, 240)",
          } as never
        }
      >
        <QRCode value={address} overlay={<g />} />
      </div>,
    );

    expect(fill(".nuv-qrcode__squares")).toBe("rgb(10, 20, 80)");
    expect(fill(".nuv-qrcode__ground")).toBe("rgb(250, 250, 240)");
    expect(fill(".nuv-qrcode__overlay .nuv-qrcode__ground")).toBe(
      "rgb(250, 250, 240)",
    );
  });

  test("the line through one that can't be drawn is the danger color, and takes a variable", async () => {
    const screen = await render(<QRCode value="" />);
    const stroke = () =>
      getComputedStyle(code().querySelector(".nuv-qrcode__mark") as Element)
        .stroke;
    expect(contrast(stroke(), "rgb(255, 255, 255)")).toBeGreaterThanOrEqual(3);

    await screen.rerender(
      <div style={{ "--nuv-qrcode-invalid": "rgb(1, 2, 3)" } as never}>
        <QRCode value="" />
      </div>,
    );
    expect(stroke()).toBe("rgb(1, 2, 3)");
  });

  test("in a space that's too narrow it shrinks, and stays square", async () => {
    await render(
      <div style={{ width: 100 }}>
        <QRCode value={address} />
      </div>,
    );
    const box = code().getBoundingClientRect();

    expect(box.width).toBe(100);
    expect(box.height).toBe(100);
  });
});

describe("accessibility", () => {
  test.for(themes)("passes axe in %s", async (theme) => {
    const { container } = await renderThemed(
      theme,
      <>
        <QRCode value={address} aria-label="Open the docs" />
        <QRCode
          value={address}
          aria-label="Open the docs, with the logo"
          overlay={<circle cx="50" cy="50" r="40" />}
        />
        <QRCode value="" aria-label="A ticket with no number" />
      </>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
