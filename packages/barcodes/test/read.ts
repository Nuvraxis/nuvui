import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HTMLCanvasElementLuminanceSource,
  HybridBinarizer,
  MultiFormatReader,
} from "@zxing/library";
import { codeToBlob } from "../src";

export interface Read {
  text: string;
  format: string;
}

// Every format the reader knows. Left to itself it only tries a few.
const formats = Object.values(BarcodeFormat).filter(
  (format) => typeof format === "number",
);

/**
 * Reads a code that's on the page the way a scanner would: it's made into
 * a picture, colors and all, and the picture is decoded. `null` if nothing
 * could be read.
 */
export async function readCode(code: SVGSVGElement): Promise<Read | null> {
  const blob = await codeToBlob(code, { format: "png", scale: 2 });
  const picture = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = picture.width;
  canvas.height = picture.height;
  canvas.getContext("2d")?.drawImage(picture, 0, 0);

  const bitmap = new BinaryBitmap(
    new HybridBinarizer(new HTMLCanvasElementLuminanceSource(canvas)),
  );
  try {
    const result = new MultiFormatReader().decode(
      bitmap,
      new Map<DecodeHintType, unknown>([
        [DecodeHintType.TRY_HARDER, true],
        [DecodeHintType.POSSIBLE_FORMATS, formats],
      ]),
    );
    return {
      text: result.getText(),
      format: BarcodeFormat[result.getBarcodeFormat()] ?? "",
    };
  } catch {
    return null;
  }
}

/**
 * The bars of a barcode as they're drawn, back as text: "1" for each
 * module that's dark and "0" for each that isn't, without the empty space
 * at the two ends.
 */
export function drawnBars(
  code: SVGSVGElement,
  { barWidth = 2, quietZone = 10 } = {},
): string {
  const path = code.querySelector(".nuv-barcode__bars")?.getAttribute("d");
  const modules = Number(code.getAttribute("width")) / barWidth - quietZone * 2;
  const bars = Array.from({ length: modules }, () => "0");
  for (const [, x, across] of (path ?? "").matchAll(/M([\d.]+) 0h([\d.]+)/g)) {
    const from = Number(x) / barWidth - quietZone;
    for (let at = 0; at < Number(across) / barWidth; at += 1) {
      bars[from + at] = "1";
    }
  }
  return bars.join("");
}

/** The heights the bars of a barcode are drawn at, each one once. */
export function barHeights(code: SVGSVGElement): number[] {
  const path = code.querySelector(".nuv-barcode__bars")?.getAttribute("d");
  const heights = Array.from((path ?? "").matchAll(/v([\d.]+)/g), ([, tall]) =>
    Number(tall),
  );
  return [...new Set(heights)].sort((a, b) => a - b);
}

/**
 * The squares of a QR code as they're drawn, back as rows of "1" and "0",
 * without the empty space around them.
 */
export function drawnSquares(code: SVGSVGElement, quietZone = 4): string[] {
  const path = code.querySelector(".nuv-qrcode__squares")?.getAttribute("d");
  const [, , whole] = (code.getAttribute("viewBox") ?? "").split(" ");
  const side = Number(whole) - quietZone * 2;
  const rows = Array.from({ length: side }, () =>
    Array.from({ length: side }, () => "0"),
  );
  for (const [, x, y, across] of (path ?? "").matchAll(
    /M([\d.]+) ([\d.]+)h([\d.]+)/g,
  )) {
    const row = rows[Number(y) - quietZone];
    for (let at = 0; at < Number(across); at += 1) {
      if (row) row[Number(x) - quietZone + at] = "1";
    }
  }
  return rows.map((row) => row.join(""));
}
