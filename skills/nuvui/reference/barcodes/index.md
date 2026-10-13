<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/barcodes/index.mdx. Don't edit it here: run `pnpm skill`. -->

# Barcodes

The @nuvui/barcodes package. Barcodes in seventeen kinds and QR codes, drawn as SVG, installed next to @nuvui/react.

Barcodes and QR codes are a package of their own, `@nuvui/barcodes`. It has two components:

| Component | What it is |
| --- | --- |
| [Barcode](barcode.md) | Bars for a scanner at a till, a warehouse door or a pharmacy: Code 128, Code 39, EAN, UPC, ITF, MSI, Codabar and Pharmacode. |
| [QRCode](qrcode.md) | A square code for a phone's camera, with four levels of error correction and room for a logo in the middle. |

It's separate from `@nuvui/react` because of what it brings with it. Working out the bars is [JsBarcode](https://github.com/lindell/JsBarcode)'s job and working out a QR code's squares is [uqr](https://github.com/unjs/uqr)'s. An app that only wants buttons and dialogs shouldn't have to install, review and update either.

## Install

```sh
pnpm add @nuvui/barcodes @nuvui/react
```

`@nuvui/react` is a peer dependency: the codes take their colors and their font from its tokens. `jsbarcode` and `uqr` come along as ordinary dependencies, and neither has dependencies of its own. You don't install them yourself.

Only the encoders are used. The drawing is done here, so that a code is markup like any other component and not a canvas.

## Load the styles

Import the package's stylesheet once, after the core's:

```tsx title="app/layout.tsx"
import "@nuvui/react/styles.css";
import "@nuvui/barcodes/styles.css";
```

It's a few rules: the colors, the font of the text under a barcode, and the size a code shrinks to in a narrow space. Both files open with the same line naming the cascade layers, so the order you import them in doesn't decide which rule wins. To load one component's styles on their own, there's `@nuvui/barcodes/css/barcode.css` and `@nuvui/barcodes/css/qrcode.css`.

## Use a component

```tsx
import { Barcode, QRCode } from "@nuvui/barcodes";

export default function Page() {
  return (
    <>
      <Barcode value="ORD-2026-001042" aria-label="Order ORD-2026-001042" />
      <QRCode value="https://example.com/orders/1042" aria-label="Open the order" />
    </>
  );
}
```

Each component also has an entry of its own, `@nuvui/barcodes/barcode` and `@nuvui/barcodes/qrcode`. A page that shows only QR codes can import from the second and leave every barcode's tables out of its bundle, whatever the bundler does with unused code.

## Black on white, in every theme

A code keeps dark bars on a light ground when the rest of the page goes dark. A scanner reads the difference between the two, and many scanners don't read a light code on a dark ground at all. So the two colors are the palette's black and white and not the theme's foreground and background, and they stay as they are where the browser forces its own colors.

Both have a variable to change them. If you do, keep the bars much darker than the ground, keep the ground light, and try the result with the scanners your codes meet.

## Check a value before it's drawn

Not every value can be every kind of code: an EAN-13 is digits only, with a check digit that has to be right. Each component draws [an empty box with a line through it](barcode.md#a-value-that-cant-be-a-barcode) for a value it can't encode, and never a code that reads as something else.

To find out without drawing, the encoders are exported. They need no browser, so they run in a form's validation, in a server action or in a script:

```tsx
import { encodeBarcode, encodeQRCode } from "@nuvui/barcodes";

encodeBarcode("590123412345", "ean13")?.text; // "5901234123457", with its check digit
encodeBarcode("5901-2341", "ean13"); // null
encodeQRCode("https://example.com")?.version; // 2
```

## Save a code as a file

`saveCode` downloads a code that's on the page as an SVG or a PNG. It takes the code's element, which each component gives through `ref`:

```tsx
"use client";

import { QRCode, saveCode } from "@nuvui/barcodes";
import { useRef } from "react";

export function Ticket() {
  const code = useRef<SVGSVGElement>(null);
  return (
    <>
      <QRCode ref={code} value="https://example.com/t/8841" aria-label="Ticket 8841" />
      <button
        type="button"
        onClick={() => code.current && saveCode(code.current, { name: "ticket-8841", format: "png" })}
      >
        Save
      </button>
    </>
  );
}
```

| Function | What it gives |
| --- | --- |
| `saveCode(code, { name, format, scale })` | Nothing: it starts a download named `name` with the format's ending. |
| `codeToBlob(code, { format, scale })` | The file's contents, to upload or to put in an email. |
| `codeToSvg(code)` | The SVG as text. |

`format` is `"svg"`, the default, or `"png"`. An SVG stays sharp at any size and is the one to print from. A PNG is `scale` times the size the code was made at, four times unless you say.

The file stands by itself: the colors and the font the stylesheet gives the code are written into it, and its name on the page becomes its title. A picture laid over a QR code is fetched and put into the file. If it's on another site that doesn't allow that, it's left out of a PNG.

There's no PDF. That would need a PDF library in every app that uses this package. An SVG goes into a PDF from any tool that makes one, and a page with a code on it prints.

These three are also at `@nuvui/barcodes/save`.

## Server components

Neither component has state, and neither needs a browser to work out or to draw a code. They carry no `"use client"`, so a code rendered in a server component is plain SVG in the HTML and sends no script.

`saveCode` and the other two functions for files do need a browser. Call them from a client component, in answer to a press.

## What's not here

- **Other two-dimensional codes:** Data Matrix, PDF417 and Aztec.
- **Code 93, and the EAN add-ons** of two and five digits printed beside a book's or a magazine's barcode.
- **Reading a code** with a camera. These draw codes.
- **Drawing on a canvas.** An SVG scales and prints sharply and can be styled, and `codeToBlob` gives a PNG where a picture is wanted.
