<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/barcodes/barcode.mdx. Don't edit it here: run `pnpm skill`. -->

# Barcode

Bars for a scanner, drawn as SVG. Code 128, Code 39, EAN, UPC, ITF, MSI, Codabar and Pharmacode, with the value written underneath.

Use a barcode where a handheld or a fixed scanner reads it: a product at a till, a parcel's label, a shelf in a stock room, a patient's wristband. For a phone's camera, and for an address or any longer text, use a [QR code](qrcode.md).

```tsx
import { Barcode } from "@nuvui/barcodes";

export default function Example() {
  return <Barcode value="ORD-2026-001042" aria-label="Order ORD-2026-001042" />;
}
```

## Install

```sh
pnpm add @nuvui/barcodes @nuvui/react
```

## Import

```tsx
import { Barcode } from "@nuvui/barcodes";
```

The styles come from `@nuvui/barcodes/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Barcodes](index.md) covers that.

```tsx
<Barcode value="ORD-2026-001042" aria-label="Order ORD-2026-001042" />
```

## Kinds

`type` says which kind of barcode to draw. Which one you need is decided by whatever reads it: a retail till wants an EAN or a UPC, a carrier's label a Code 128. Without `type` it's Code 128, which holds any text a keyboard can type and is the shortest for most values.

```tsx
import { Barcode, type BarcodeType } from "@nuvui/barcodes";

const kinds: Array<{ type: BarcodeType; name: string; value: string }> = [
  { type: "ean13", name: "EAN-13", value: "590123412345" },
  { type: "upca", name: "UPC-A", value: "12345678901" },
  { type: "code39", name: "Code 39", value: "PART-4410" },
  { type: "itf14", name: "ITF-14", value: "1234567890123" },
  { type: "codabar", name: "Codabar", value: "A40156B" },
  { type: "pharmacode", name: "Pharmacode", value: "1234" },
];

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: "1.5rem",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 16rem), 1fr))",
        inlineSize: "100%",
      }}
    >
      {kinds.map(({ type, name, value }) => (
        <figure key={type} style={{ margin: 0 }}>
          <Barcode type={type} value={value} aria-label={`${name}: ${value}`} />
          <figcaption style={{ marginBlockStart: "0.5rem" }}>{name}</figcaption>
        </figure>
      ))}
    </div>
  );
}
```

| `type` | What it holds | Where it's used |
| --- | --- | --- |
| `"code128"` | Any ASCII text. Runs of digits are packed two to a symbol. | Labels in shipping and stock rooms, and anything of your own. |
| `"gs1-128"` | The same, marked as GS1's. The value is the application identifiers and their data, without the brackets. | Cartons and pallets in a supply chain. |
| `"code39"` | Capitals, digits, the space and `-` `.` `$` `/` `+` `%`. Small letters are made capitals. | Older systems, in industry and defense. |
| `"code39-mod43"` | The same, with a check character added. | Where a Code 39 has to be checked. |
| `"ean13"` | Twelve digits, and the thirteenth is worked out. Or thirteen, and the last is checked. | Retail outside North America, and books. |
| `"ean8"` | Seven digits, or eight with the check digit. | Small packets. |
| `"upca"` | Eleven digits, or twelve with the check digit. | Retail in North America. |
| `"upce"` | Six digits, or eight with the number system first and the check digit last. | Small packets in North America. |
| `"itf"` | Digits, an even number of them. | Cartons. |
| `"itf14"` | Thirteen digits, or fourteen with the check digit. | A carton's number, printed on corrugated board. |
| `"msi"` | Digits. | Shelves and stock in shops. |
| `"msi-mod10"`, `"msi-mod11"`, `"msi-mod1010"`, `"msi-mod1110"` | Digits, with one or two check digits added, each worked out the way its name says. | The same, checked. |
| `"codabar"` | Digits and `-` `$` `:` `/` `.` `+`, between a start and a stop letter from A to D. Without the letters, both are A. | Libraries, blood banks and couriers' older forms. |
| `"pharmacode"` | A whole number from 3 to 131070. | Packaging lines for medicines. |

Where a check digit is worked out, it's part of what's drawn, what's written underneath and what the barcode is named.

`barcodeTypes` is the list of these as an array, for a select of your own.

## Size

`barWidth` is the width of the narrowest bar in pixels, and every other bar and space is a whole number of those. `height` is the height of the bars. The barcode's width follows from the two and from the value: a longer value is a wider barcode.

```tsx
import { Barcode } from "@nuvui/barcodes";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: "1.5rem", justifyItems: "start" }}>
      <Barcode value="SHELF-12" barWidth={1} height={32} textSize={12} />
      <Barcode value="SHELF-12" />
      <Barcode value="SHELF-12" barWidth={3} height={96} showText={false} />
    </div>
  );
}
```

Keep `barWidth` a whole number. A bar that's a pixel and a half wide is drawn with a gray edge, and a scanner reads widths. The same goes for a barcode squeezed by its container: it shrinks to fit a narrow space and keeps its shape, and a shrunk barcode may not scan. Give it room, or a smaller `barWidth`, or a shorter value.

`quietZone` is the empty space at each end, in narrowest bars. Scanners find a barcode by that space, and most kinds ask for ten. Only lower it if the barcode sits on a light ground with nothing near it.

## The text underneath

The value is written under the bars, so that someone can type it in when it won't scan. `showText={false}` leaves it out. `text` writes something else there, such as the same number in groups, and doesn't change what a scanner reads.

```tsx
import { Barcode } from "@nuvui/barcodes";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: "1.5rem", justifyItems: "start" }}>
      <Barcode
        type="gs1-128"
        value="0109501101530003"
        text="(01) 09501101530003"
        aria-label="Trade item 09501101530003"
      />
      <Barcode
        type="ean13"
        value="590123412345"
        flat
        aria-label="Item 5901234123457"
      />
    </div>
  );
}
```

An EAN or a UPC writes its digits the way they're printed on a product: in groups between taller bars, with the first digit outside. `flat` gives one line of digits under bars of one height. `text` doesn't apply to those four kinds.

## A value that can't be a barcode

A letter in an EAN, a check digit that's wrong, an odd number of digits in an ITF, a value that's empty: none of these is drawn as bars. What's drawn is an empty box with a line through it, the size the barcode would have been, so the page keeps its shape and nothing scans.

```tsx
import { Barcode } from "@nuvui/barcodes";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: "1.5rem", justifyItems: "start" }}>
      <Barcode
        type="ean13"
        value="5901-2341"
        aria-label="An item whose number can't be a barcode"
      />
      <Barcode
        type="ean13"
        value="5901-2341"
        fallback={
          <p style={{ margin: 0 }}>
            This item's number, 5901-2341, isn't an EAN-13. Type it in at the
            till.
          </p>
        }
      />
    </div>
  );
}
```

`fallback` puts something of yours there instead. `fallback={null}` draws nothing.

To know before drawing, call the encoder. It gives `null` for a value its kind doesn't take:

```tsx
import { encodeBarcode } from "@nuvui/barcodes";

const encoding = encodeBarcode(sku, "ean13");
if (!encoding) return <p>{sku} isn't an EAN-13.</p>;
```

Use it in a form's validation as well, so that a value that can't be printed is turned away when it's typed and not when a label is wanted.

## Saving it as a file

Give the barcode a `ref` and pass its element to `saveCode`. [Barcodes](index.md#save-a-code-as-a-file) has the rest.

```tsx
"use client";

import { Barcode, saveCode } from "@nuvui/barcodes";
import { Button } from "@nuvui/react";
import { useRef } from "react";

export default function Example() {
  const code = useRef<SVGSVGElement>(null);

  function save(format: "svg" | "png") {
    if (code.current) saveCode(code.current, { name: "parcel-7781", format });
  }

  return (
    <div style={{ display: "grid", gap: "1rem", justifyItems: "start" }}>
      <Barcode ref={code} value="PARCEL-7781" aria-label="Parcel 7781" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <Button intent="secondary" onClick={() => save("svg")}>
          Save as SVG
        </Button>
        <Button intent="secondary" onClick={() => save("png")}>
          Save as PNG
        </Button>
      </div>
    </div>
  );
}
```

## Props

Barcode also takes the attributes of an `<svg>`, and `ref` goes to it.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` (required) | `string` |  | What the barcode holds. |
| `type` | `"codabar" \| "code128" \| "code39" \| "code39-mod43" \| "ean13" \| "ean8" \| "gs1-128" \| "itf" \| "itf14" \| "msi" \| "msi-mod10" \| "msi-mod1010" \| "msi-mod11" \| "msi-mod1110" \| "pharmacode" \| "upca" \| "upce"` | `"code128"` | The kind of barcode. Each takes its own values: an EAN-13 is twelve or thirteen digits, a Code 39 is capitals, digits and a few signs, and a Code 128 is any ASCII text. |
| `barWidth` | `number` | `2` | The width of the narrowest bar, in pixels. A scanner needs it to be a whole number of the screen's or the printer's dots. |
| `height` | `number` | `64` | The height of the bars, in pixels. The text is under that. |
| `quietZone` | `number` | `10` | The empty space at each end, counted in narrowest bars. A scanner finds the barcode by it, and most kinds ask for ten. |
| `showText` | `boolean` | `true` | Writes the value under the bars, for someone to type when it won't scan. |
| `text` | `string` |  | Written under the bars in place of the value: the same number with spaces in it, say. An EAN or a UPC writes its own digits whatever this is. |
| `textSize` | `number` | `14` | The size of the text, in pixels. |
| `flat` | `boolean` | `false` | An EAN or a UPC with every bar the same height and its digits in one line, in place of the usual look with taller bars at the ends and in the middle. |
| `fallback` | `ReactNode` |  | What's drawn when the value can't be a barcode of this kind. Without it there's an empty box with a line through it, which no scanner reads as anything. |

## Accessibility

A barcode has nothing to press and nothing to focus.

### What the component handles

- It's an `<svg>` with `role="img"`, so a screen reader meets one picture and not a hundred shapes.
- It has a name. Without `aria-label` or `aria-labelledby`, the name is the value with any check digit, which is what a person would type.
- The text under the bars is drawn at the size you set, 14 pixels by default, in black on white.
- The bars stay black on white in a dark theme and where the browser forces colors, because that's what scans. The contrast between them is as high as it goes.

### What you need to handle

- Name it for what it's for: "Order 1042", not only the digits. A screen reader's user wants to know which barcode this is.
- Never make a barcode the only way to get what it holds. Someone who can't scan it, because of the screen, the scanner or their sight, needs the value as text they can read and copy. The text underneath does that for a short value. For a long one, put it on the page.
- If you change the colors, keep the bars dark and the ground light, and try it with a real scanner.

## On small screens

A barcode is as wide as its value makes it, and a long Code 128 at two pixels a bar is wider than a phone. It shrinks to its container's width, which keeps the page from scrolling sideways. A shrunk barcode has bars that aren't whole pixels, and may not scan off the screen. For a phone, use `barWidth={1}`, a shorter value, or a [QR code](qrcode.md), which holds more in less room.

## CSS variables

Set any of these on the barcode, or on anything around it.

```css
.label {
  --nuv-barcode-font: var(--font-sans);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-barcode-bg` | `var(--color-white)` | Color of the ground. White in every theme by default. Keep it light. |
| `--nuv-barcode-fg` | `var(--color-black)` | Color of the bars and the text. Black in every theme by default. Keep it much darker than the ground. |
| `--nuv-barcode-font` | `var(--font-mono)` | Font of the text under the bars. |
| `--nuv-barcode-invalid` | `var(--color-danger)` | Color of the edge and the line of a barcode that can't be drawn. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-barcode` | Barcode: the svg. |
| `.nuv-barcode__bars` | The bars, as one path. |
| `.nuv-barcode__ground` | The rectangle behind the bars. |
| `.nuv-barcode__mark` | The edge and the line through a barcode that can't be drawn. |
| `.nuv-barcode__text` | A line of text under the bars. An EAN or a UPC has several. |

A barcode has `data-type`, its kind. One that can't be drawn has `data-invalid` instead.

## Server components

Barcode has no `"use client"`. Rendered in a server component, it's SVG in the HTML and sends no script. `saveCode` needs a browser, so the button that calls it is in a client component.

## Do and don't

**Do**

- Print one and scan it with the scanner it's meant for before you ship. A screen and a printer each change what a scanner sees.
- Keep the text underneath for anything a person might have to type.
- Check values where they're entered, with `encodeBarcode`.

**Don't**

- Don't put a barcode on a colored or patterned ground. Leave it its white, and space around it.
- Don't stretch or squeeze one with CSS. Change `barWidth` and `height`.
- Don't use it for an address or a sentence. That's a [QR code](qrcode.md).
