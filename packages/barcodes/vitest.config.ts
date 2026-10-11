import { browserTests } from "@nuvui/tooling/vitest";

export default browserTests({
  dependencies: [
    // jsbarcode's encoders are CommonJS files, each imported by its path.
    "jsbarcode/bin/barcodes/CODE39/index.js",
    "jsbarcode/bin/barcodes/CODE128/index.js",
    "jsbarcode/bin/barcodes/codabar/index.js",
    "jsbarcode/bin/barcodes/EAN_UPC/index.js",
    "jsbarcode/bin/barcodes/ITF/index.js",
    "jsbarcode/bin/barcodes/MSI/index.js",
    "jsbarcode/bin/barcodes/pharmacode/index.js",
    "uqr",
    // Only in the tests: it reads back what was drawn.
    "@zxing/library",
  ],
});
