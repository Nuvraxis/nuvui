# @nuvui/barcodes

Barcodes and QR codes for [`@nuvui/react`](https://www.npmjs.com/package/@nuvui/react), drawn as SVG.

This is early: the package is a 0.x version, and before 1.0 a minor version may rename or remove things. The [changelog](https://nuvui.nuvraxis.com/docs/changelog) says where one does, and the [repository README](https://github.com/Nuvraxis/nuvui#readme) says where things stand.

```sh
pnpm add @nuvui/barcodes @nuvui/react
```

```tsx
import "@nuvui/react/styles.css";
import "@nuvui/barcodes/styles.css";
import { Barcode, QRCode } from "@nuvui/barcodes";

export function Label() {
  return (
    <>
      <Barcode value="590123412345" type="ean13" aria-label="Item 5901234" />
      <QRCode
        value="https://example.com/orders/1042"
        aria-label="Open order 1042"
      />
    </>
  );
}
```

## What's in it

- `Barcode`: bars for a scanner, in seventeen kinds. Code 128, GS1-128, Code 39 with and without its check character, EAN-13, EAN-8, UPC-A, UPC-E, ITF, ITF-14, MSI with and without its check digits, Codabar and Pharmacode. The value is written under the bars.
- `QRCode`: a QR code at one of four levels of error correction, with room in the middle for a logo.
- `QRCodeSwissCross`: the cross in the middle of a Swiss QR-bill's code.
- `encodeBarcode` and `encodeQRCode`: the bars and the squares as data, or `null` for a value that can't be encoded. They need no browser, so they check a value in a form or on a server.
- `saveCode`, `codeToBlob` and `codeToSvg`: a code on the page as an SVG or a PNG file.

Each component has an entry of its own, `@nuvui/barcodes/barcode` and `@nuvui/barcodes/qrcode`, so a page with only QR codes doesn't carry every barcode's tables.

## How it behaves

Both components are SVG with no state and no `"use client"`. A server component renders them as markup, and no script is sent for them.

A code is black on white in every theme, and where the browser forces colors. A scanner reads the difference between the two, and many don't read a light code on a dark ground. Two CSS variables change the colors if you have to.

A value that can't be a code of its kind, such as a letter in an EAN-13, is drawn as an empty box with a line through it, or as your `fallback`. It's never drawn as a code that reads as something else.

A code is a picture with a name. Give it `aria-label` for what it's for. Don't make a code the only way to get what it holds: put the text or a link next to it.

## Dependencies

`@nuvui/react` is a peer dependency: the codes take their colors and their font from its tokens.

The bars are worked out by [JsBarcode](https://github.com/lindell/JsBarcode) and the squares by [uqr](https://github.com/unjs/uqr). Both are MIT, both are ordinary dependencies, and neither has dependencies of its own. Only their encoders are used. The drawing is done here.

It's a package of its own so that an app which only wants buttons and dialogs doesn't have to install either.

The docs are at https://nuvui.nuvraxis.com/docs/barcodes.

## License

MIT
