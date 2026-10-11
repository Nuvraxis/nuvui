import { encode } from "uqr";

/**
 * How much of the code can be lost and still be read: about 7% for `"L"`,
 * 15% for `"M"`, 25% for `"Q"` and 30% for `"H"`. A higher level makes a
 * code with more and smaller squares for the same value.
 */
export type QRCodeErrorCorrection = "L" | "M" | "Q" | "H";

export interface QRCodeEncoding {
  /** The rows of squares, `true` for a dark one. */
  rows: boolean[][];
  /** How many squares there are along a side. */
  size: number;
  /** The code's version, 1 to 40: how big it had to be for the value. */
  version: number;
  errorCorrection: QRCodeErrorCorrection;
}

export interface QRCodeEncodeOptions {
  /** @default "M" */
  errorCorrection?: QRCodeErrorCorrection;
}

/**
 * The squares for a value, or `null` if there's nothing to encode or it's
 * more than a QR code holds, which at the highest level is about 1,200
 * bytes.
 *
 * It needs no browser, so it runs wherever the value is checked.
 */
export function encodeQRCode(
  value: string,
  { errorCorrection = "M" }: QRCodeEncodeOptions = {},
): QRCodeEncoding | null {
  if (typeof value !== "string" || value === "") return null;
  try {
    const code = encode(value, { ecc: errorCorrection, border: 0 });
    return {
      rows: code.data,
      size: code.size,
      version: code.version,
      errorCorrection,
    };
  } catch {
    return null;
  }
}
