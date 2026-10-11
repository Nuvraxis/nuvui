---
"@nuvui/barcodes": minor
---

A new package, for barcodes and QR codes.

- `Barcode` draws bars for a scanner, in seventeen kinds: Code 128, GS1-128, Code 39 with and without its check character, EAN-13, EAN-8, UPC-A, UPC-E, ITF, ITF-14, MSI with and without its check digits, Codabar and Pharmacode. The value is written under the bars, and an EAN or a UPC is drawn the way it's printed on a product, with taller bars at its ends and middle.
- `QRCode` draws a QR code at one of four levels of error correction, with room in the middle for an `overlay`: a logo, or `QRCodeSwissCross` for a Swiss QR-bill.
- Both are SVG with no state and no `"use client"`, so a server component renders them as plain markup. Both stay black on white in a dark theme and in forced colors, because that's what scans.
- A value a code can't hold is drawn as an empty box with a line through it, or as your `fallback`, and never as a code that reads as something else. `encodeBarcode` and `encodeQRCode` say whether a value can be encoded, without a browser.
- `saveCode`, `codeToBlob` and `codeToSvg` turn a code on the page into an SVG or a PNG file.
- The bars are worked out by `jsbarcode` and the squares by `uqr`. Both are dependencies, and neither has dependencies of its own.
