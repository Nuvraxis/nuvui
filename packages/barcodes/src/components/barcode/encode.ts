import { CODE39 } from "jsbarcode/bin/barcodes/CODE39/index.js";
import { CODE128 } from "jsbarcode/bin/barcodes/CODE128/index.js";
import { codabar } from "jsbarcode/bin/barcodes/codabar/index.js";
import {
  EAN8,
  EAN13,
  UPC,
  UPCE,
} from "jsbarcode/bin/barcodes/EAN_UPC/index.js";
import { ITF, ITF14 } from "jsbarcode/bin/barcodes/ITF/index.js";
import {
  MSI,
  MSI10,
  MSI11,
  MSI1010,
  MSI1110,
} from "jsbarcode/bin/barcodes/MSI/index.js";
import { pharmacode } from "jsbarcode/bin/barcodes/pharmacode/index.js";

/** The kinds of barcode there are here. */
export type BarcodeType =
  | "code128"
  | "gs1-128"
  | "code39"
  | "code39-mod43"
  | "ean13"
  | "ean8"
  | "upca"
  | "upce"
  | "itf"
  | "itf14"
  | "msi"
  | "msi-mod10"
  | "msi-mod11"
  | "msi-mod1010"
  | "msi-mod1110"
  | "codabar"
  | "pharmacode";

// An encoder, and anything it has to be told.
const encoders: Record<
  BarcodeType,
  [JsBarcodeEncoder, Record<string, unknown>]
> = {
  code128: [CODE128, {}],
  // Code 128 with the mark in front that says the value is GS1's.
  "gs1-128": [CODE128, { ean128: true }],
  code39: [CODE39, {}],
  "code39-mod43": [CODE39, { mod43: true }],
  ean13: [EAN13, {}],
  ean8: [EAN8, {}],
  upca: [UPC, {}],
  upce: [UPCE, {}],
  itf: [ITF, {}],
  itf14: [ITF14, {}],
  msi: [MSI, {}],
  "msi-mod10": [MSI10, {}],
  "msi-mod11": [MSI11, {}],
  "msi-mod1010": [MSI1010, {}],
  "msi-mod1110": [MSI1110, {}],
  codabar: [codabar, {}],
  pharmacode: [pharmacode, {}],
};

/** Every kind of barcode there is here. */
export const barcodeTypes = Object.keys(encoders) as BarcodeType[];

// The ones whose digits are written in groups between the taller bars.
const grouped: ReadonlySet<BarcodeType> = new Set([
  "ean13",
  "ean8",
  "upca",
  "upce",
]);

export interface BarcodePart {
  /** "1" for a bar one module wide and "0" for a space as wide. */
  bars: string;
  /** What's written under this part, if anything. */
  text?: string;
  /**
   * A guard: bars at the two ends and in the middle of an EAN or a UPC,
   * drawn taller than the rest.
   */
  guard: boolean;
  /** Where the text sits under the part. */
  align: "start" | "center" | "end";
}

export interface BarcodeEncoding {
  type: BarcodeType;
  /** The parts from left to right. Most kinds have one. */
  parts: BarcodePart[];
  /** How many modules wide the bars are, all parts together. */
  modules: number;
  /**
   * The whole of what's written under the bars, with a check digit the
   * encoder worked out.
   */
  text: string;
}

export interface BarcodeEncodeOptions {
  /**
   * Written under the bars in place of the value. An EAN or a UPC writes
   * its own digits whatever this is.
   */
  text?: string;
  /**
   * An EAN or a UPC in one part, with every bar the same height and no
   * digit outside the bars.
   * @default false
   */
  flat?: boolean;
}

const aligned = { left: "start", center: "center", right: "end" } as const;

/**
 * The bars for a value, or `null` if this kind of barcode can't hold it:
 * a letter in an EAN, a check digit that's wrong, an odd number of digits
 * in an ITF, nothing at all.
 *
 * It needs no browser, so it runs wherever the value is checked.
 */
export function encodeBarcode(
  value: string,
  type: BarcodeType = "code128",
  { text, flat = false }: BarcodeEncodeOptions = {},
): BarcodeEncoding | null {
  const entry = encoders[type];
  if (!entry || typeof value !== "string" || value === "") return null;
  const [Encoder, extra] = entry;

  let encoded: JsBarcodeEncoded | JsBarcodeEncoded[];
  try {
    const encoder = new Encoder(value, {
      ...extra,
      text: grouped.has(type) ? undefined : text,
      flat,
      // An EAN-13 puts its first digit outside the bars only if it's told
      // the text is shown. Whether it's drawn is decided later.
      displayValue: true,
      // Read by the encoders for EAN and UPC to size their guards, which
      // is done here in the drawing. They only have to be numbers.
      fontSize: 0,
      height: 0,
      textMargin: 0,
      width: 1,
    });
    if (!encoder.valid()) return null;
    encoded = encoder.encode();
  } catch {
    return null;
  }

  const parts = (Array.isArray(encoded) ? encoded : [encoded])
    .filter((part) => part.data.length > 0)
    .map(
      (part): BarcodePart => ({
        bars: part.data,
        text: part.text === undefined ? undefined : String(part.text),
        guard: part.options?.height !== undefined,
        align: aligned[part.options?.textAlign ?? "center"],
      }),
    );
  const modules = parts.reduce((sum, part) => sum + part.bars.length, 0);
  if (modules === 0) return null;

  return {
    type,
    parts,
    modules,
    text: parts.map((part) => part.text ?? "").join(""),
  };
}
