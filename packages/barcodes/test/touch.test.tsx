import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Barcode, QRCode } from "../src";
import { readCode } from "./read";

// This file runs in a browser context of its own, one that reports a touch
// screen, at the width of a phone. A code has nothing to press. What a
// phone changes is the room there is for it.

const first = (selector: string) =>
  document.querySelector(selector) as SVGSVGElement;

test("a barcode wider than the screen shrinks to fit, keeps its shape, and still reads", async () => {
  // Wider than a phone at two pixels a bar.
  const value = "SHIPMENT-0000123456789-A";
  await render(
    <div style={{ padding: 16 }}>
      <Barcode value={value} />
    </div>,
  );
  const code = first(".nuv-barcode");
  const made = Number(code.getAttribute("width"));
  const box = code.getBoundingClientRect();

  expect(made).toBeGreaterThan(window.innerWidth);
  expect(box.width).toBe(window.innerWidth - 32);
  expect(box.height / box.width).toBeCloseTo(
    Number(code.getAttribute("height")) / made,
    2,
  );
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    window.innerWidth,
  );
  expect((await readCode(code))?.text).toBe(value);
});

test("a QR code larger than the screen shrinks to fit, and stays square", async () => {
  await render(
    <div style={{ padding: 16 }}>
      <QRCode value="https://nuvui.nuvraxis.com/docs" size={600} />
    </div>,
  );
  const box = first(".nuv-qrcode").getBoundingClientRect();

  expect(box.width).toBe(window.innerWidth - 32);
  expect(box.height).toBe(box.width);
});
