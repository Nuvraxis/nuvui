# @nuvui/barcodes

## 0.1.0

### Minor Changes

- [#47](https://github.com/Nuvraxis/nuvui/pull/47) [`f297c57`](https://github.com/Nuvraxis/nuvui/commit/f297c57826e4badd32ad6160c594dd1a94571099) Thanks [@sajanv88](https://github.com/sajanv88)! - A new package, for barcodes and QR codes.
  
  - `Barcode` draws bars for a scanner, in seventeen kinds: Code 128, GS1-128, Code 39 with and without its check character, EAN-13, EAN-8, UPC-A, UPC-E, ITF, ITF-14, MSI with and without its check digits, Codabar and Pharmacode. The value is written under the bars, and an EAN or a UPC is drawn the way it's printed on a product, with taller bars at its ends and middle.
  - `QRCode` draws a QR code at one of four levels of error correction, with room in the middle for an `overlay`: a logo, or `QRCodeSwissCross` for a Swiss QR-bill.
  - Both are SVG with no state and no `"use client"`, so a server component renders them as plain markup. Both stay black on white in a dark theme and in forced colors, because that's what scans.
  - A value a code can't hold is drawn as an empty box with a line through it, or as your `fallback`, and never as a code that reads as something else. `encodeBarcode` and `encodeQRCode` say whether a value can be encoded, without a browser.
  - `saveCode`, `codeToBlob` and `codeToSvg` turn a code on the page into an SVG or a PNG file.
  - The bars are worked out by `jsbarcode` and the squares by `uqr`. Both are dependencies, and neither has dependencies of its own.

### Patch Changes

- Updated dependencies [[`a533ceb`](https://github.com/Nuvraxis/nuvui/commit/a533ceb07066fbf4324af1e59a47bbe1a3022605), [`54da14b`](https://github.com/Nuvraxis/nuvui/commit/54da14bad36f5cb70aabfed872e55bfbf6a9ea3e), [`c473abb`](https://github.com/Nuvraxis/nuvui/commit/c473abba2b75289298fde9f901f712dda2be3f53), [`baa088b`](https://github.com/Nuvraxis/nuvui/commit/baa088b5070cf8fbec4c1517652c4da94b6aeb53), [`11890f4`](https://github.com/Nuvraxis/nuvui/commit/11890f422f7d2844a4aebb3e60f6fd1311432a80), [`4e67dd6`](https://github.com/Nuvraxis/nuvui/commit/4e67dd6368fb7914f4df6d75de10c3f67d631adc)]:
  - @nuvui/react@0.4.0
