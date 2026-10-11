// jsbarcode's types describe the function that draws. What's used here is
// the encoders under it, which have none. Each is given a value and
// options, says whether it can encode the value, and gives the bars as
// text: "1" for a bar a module wide and "0" for a space.
interface JsBarcodeEncoded {
  data: string;
  text?: string;
  options?: { height?: number; textAlign?: "left" | "right" | "center" };
}

interface JsBarcodeEncoder {
  new (
    data: string,
    options: Record<string, unknown>,
  ): {
    valid(): boolean;
    encode(): JsBarcodeEncoded | JsBarcodeEncoded[];
  };
}

declare module "jsbarcode/bin/barcodes/CODE128/index.js" {
  export const CODE128: JsBarcodeEncoder;
}

declare module "jsbarcode/bin/barcodes/CODE39/index.js" {
  export const CODE39: JsBarcodeEncoder;
}

declare module "jsbarcode/bin/barcodes/EAN_UPC/index.js" {
  export const EAN13: JsBarcodeEncoder;
  export const EAN8: JsBarcodeEncoder;
  export const UPC: JsBarcodeEncoder;
  export const UPCE: JsBarcodeEncoder;
}

declare module "jsbarcode/bin/barcodes/ITF/index.js" {
  export const ITF: JsBarcodeEncoder;
  export const ITF14: JsBarcodeEncoder;
}

declare module "jsbarcode/bin/barcodes/MSI/index.js" {
  export const MSI: JsBarcodeEncoder;
  export const MSI10: JsBarcodeEncoder;
  export const MSI11: JsBarcodeEncoder;
  export const MSI1010: JsBarcodeEncoder;
  export const MSI1110: JsBarcodeEncoder;
}

declare module "jsbarcode/bin/barcodes/codabar/index.js" {
  export const codabar: JsBarcodeEncoder;
}

declare module "jsbarcode/bin/barcodes/pharmacode/index.js" {
  export const pharmacode: JsBarcodeEncoder;
}
