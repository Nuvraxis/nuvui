<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/barcodes/qrcode.mdx. Don't edit it here: run `pnpm skill`. -->

# QRCode

A QR code drawn as SVG, with four levels of error correction and room in the middle for a logo or the Swiss cross.

Use a QR code to hand something to a phone: the address of a page, a ticket, a payment, the details to join a network. A camera reads it from a screen or from paper, at an angle and in poor light. For a scanner at a till or in a warehouse, use a [barcode](barcode.md).

```tsx
import { QRCode } from "@nuvui/barcodes";

export default function Example() {
  return (
    <QRCode
      value="https://nuvui.nuvraxis.com/docs"
      aria-label="Open the nuvui docs"
    />
  );
}
```

## Install

```sh
pnpm add @nuvui/barcodes @nuvui/react
```

## Import

```tsx
import { QRCode } from "@nuvui/barcodes";
```

The styles come from `@nuvui/barcodes/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Barcodes](index.md) covers that.

```tsx
<QRCode value="https://example.com/orders/1042" aria-label="Open order 1042" />
```

## What it holds

`value` is text, and a QR code doesn't care what the text means. What happens when it's scanned is decided by how the text starts, and by the phone:

| The value | What a phone offers to do |
| --- | --- |
| `https://example.com/orders/1042` | Open the page. |
| `mailto:help@example.com` | Write an email. |
| `tel:+15555550100` | Call the number. |
| `sms:+15555550100` | Write a message. |
| `geo:47.3769,8.5417` | Show the place on a map. |
| `WIFI:T:WPA;S:Office;P:the password;;` | Join the network. |
| A vCard, starting `BEGIN:VCARD` | Add the contact. |

These forms are the phones' and not this component's: it encodes whatever you give it. Any text works, in any script.

The longer the value, the more squares the code has and the smaller each is at the same size. A short address reads from across a room. A paragraph has to be held close. Where you can, put an address in the code and the long text at the address.

## Size

`size` is the width and the height in pixels, with the empty edge. A phone needs each square to be a few pixels across, so a long value wants a larger code.

`quietZone` is the empty space around the code, in its squares. The standard asks for four, and cameras find the code by it. Only lower it if the code sits on a light ground with nothing near it.

In a space narrower than `size` the code shrinks to fit and stays square.

## Error correction

Part of a QR code is spare, so that it still reads with a corner torn off or a mark across it. `errorCorrection` says how much: `"L"`, `"M"`, `"Q"` or `"H"`, for about 7, 15, 25 and 30 percent of the code. More of it means more squares for the same value.

```tsx
import { QRCode } from "@nuvui/barcodes";

const levels = [
  { level: "L", lost: "About 7%" },
  { level: "M", lost: "About 15%" },
  { level: "Q", lost: "About 25%" },
  { level: "H", lost: "About 30%" },
] as const;

export default function Example() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
      {levels.map(({ level, lost }) => (
        <figure key={level} style={{ margin: 0 }}>
          <QRCode
            value="https://nuvui.nuvraxis.com/docs"
            errorCorrection={level}
            size={128}
            aria-label={`The docs, at level ${level}`}
          />
          <figcaption style={{ marginBlockStart: "0.5rem" }}>
            {level}: {lost}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
```

`"M"` is the default and suits a screen. Go higher for a code that's printed and handled, such as a label on a crate, and lower only to keep a long value's squares large enough to read.

## Something over the middle

`overlay` draws over the middle of the code: a logo, most often. It's SVG, drawn in a box 100 by 100, on a ground the color of the code's own. An `<image>` works, and so do shapes.

```tsx
import { QRCode } from "@nuvui/barcodes";

// Drawn in a box 100 by 100. A picture of your own would be
// <image href="/logo.svg" width="100" height="100" />.
const logo = (
  <>
    <rect
      x="10"
      y="10"
      width="80"
      height="80"
      rx="18"
      style={{ fill: "var(--color-blue-600)" }}
    />
    <path
      d="M32 68V32l36 36V32"
      strokeWidth="9"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ fill: "none", stroke: "var(--color-white)" }}
    />
  </>
);

export default function Example() {
  return (
    <QRCode
      value="https://nuvui.nuvraxis.com/docs"
      size={200}
      overlay={logo}
      aria-label="Open the nuvui docs"
    />
  );
}
```

```tsx
<QRCode
  value="https://example.com"
  overlay={<image href="/logo.svg" width="100" height="100" />}
/>
```

The squares under it are lost, and the error correction is what makes up for them. So with an `overlay` and no `errorCorrection` of your own, the level is `"H"`.

`overlaySize` is how much of the code's side the overlay takes, a fifth by default and never more than three tenths. Nothing checks that a code with an overlay still reads. A fifth at `"H"` leaves a good margin. Scan the code you ship, on more than one phone.

### The Swiss cross

A Swiss QR-bill's code has the Swiss cross in its middle. `QRCodeSwissCross` draws it, black with a white cross whatever the code's colors are. The standard for QR-bills asks for error correction `"M"` and a cross 7 mm wide on a code of 46 mm, which is an `overlaySize` of 0.152.

```tsx
import { QRCode, QRCodeSwissCross } from "@nuvui/barcodes";

// The lines a QR-bill's code holds, cut short. A real one has about
// thirty, set out in the Swiss payment standards.
const bill = [
  "SPC",
  "0200",
  "1",
  "CH4431999123000889012",
  "S",
  "Robert Schneider AG",
  "Rue du Lac",
  "1268",
  "2501",
  "Biel",
  "CH",
].join("\n");

export default function Example() {
  return (
    <QRCode
      value={bill}
      size={200}
      errorCorrection="M"
      overlaySize={0.152}
      overlay={<QRCodeSwissCross />}
      aria-label="Payment part of the bill for Robert Schneider AG"
    />
  );
}
```

What the code of a QR-bill has to hold, line by line, is in the Swiss payment standards. This component draws it and doesn't check it.

## A value that can't be a QR code

An empty value isn't drawn as a code, and neither is one that's more than a QR code holds: about 2,950 bytes at `"L"` and 1,270 at `"H"`. What's drawn is an empty box with a line through it, the size the code would have been.

```tsx
import { QRCode } from "@nuvui/barcodes";

export default function Example() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1.5rem",
        alignItems: "center",
      }}
    >
      <QRCode value="" size={128} aria-label="A ticket with no code" />
      <QRCode
        value=""
        fallback={<p style={{ margin: 0 }}>This ticket has no code yet.</p>}
      />
    </div>
  );
}
```

`fallback` puts something of yours there instead, and `fallback={null}` draws nothing. To know before drawing, call the encoder, which gives `null` for a value that can't be encoded:

```tsx
import { encodeQRCode } from "@nuvui/barcodes";

const encoding = encodeQRCode(text, { errorCorrection: "Q" });
// encoding.size is how many squares there are along a side.
```

## Saving it as a file

Give the code a `ref` and pass its element to `saveCode`. [Barcodes](index.md#save-a-code-as-a-file) has the rest.

```tsx
"use client";

import { QRCode, saveCode } from "@nuvui/barcodes";
import { Button } from "@nuvui/react";
import { useRef } from "react";

export default function Example() {
  const code = useRef<SVGSVGElement>(null);

  function save(format: "svg" | "png") {
    if (code.current) saveCode(code.current, { name: "nuvui-docs", format });
  }

  return (
    <div style={{ display: "grid", gap: "1rem", justifyItems: "start" }}>
      <QRCode
        ref={code}
        value="https://nuvui.nuvraxis.com/docs"
        aria-label="Open the nuvui docs"
      />
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

## QRCode props

QRCode also takes the attributes of an `<svg>`, and `ref` goes to it.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` (required) | `string` |  | What the code holds: an address, most often, or any text. |
| `size` | `number` | `160` | The width and the height, in pixels, with the empty edge. |
| `errorCorrection` | `"H" \| "L" \| "M" \| "Q"` |  | How much of the code can be lost and still be read, from `"L"`, about 7%, to `"H"`, about 30%. Left out, it's `"M"`, or `"H"` when there's an `overlay`, which covers part of the code. |
| `quietZone` | `number` | `4` | The empty space around the code, counted in its squares. A scanner finds the code by it, and the standard asks for four. |
| `overlay` | `ReactNode` |  | Something drawn over the middle, such as a logo. It's SVG, drawn in a box 100 by 100: an `<image>`, shapes of your own, or `<QRCodeSwissCross />`. The squares under it are lost, which the error correction makes up for. |
| `overlaySize` | `number` | `0.2` | How much of the code's side the overlay takes, from 0.1 to 0.3. More than a fifth and some phones stop reading it: try the code you ship. |
| `fallback` | `ReactNode` |  | What's drawn when the value can't be a QR code: nothing to encode, or more than one holds. Without it there's an empty box with a line through it, which no scanner reads as anything. |

`QRCodeSwissCross` takes the attributes of an SVG `<g>`.

## Accessibility

A QR code has nothing to press and nothing to focus.

### What the component handles

- It's an `<svg>` with `role="img"`, so a screen reader meets one picture and not a thousand squares.
- It has a name. Without `aria-label` or `aria-labelledby`, the name is the value.
- The squares stay black on white in a dark theme and where the browser forces colors, because that's what a camera reads.

### What you need to handle

- Name it for what scanning it does: "Open order 1042". A long address read out letter by letter helps nobody.
- Never make a QR code the only way to get what it holds. Someone reading the page on the phone they'd scan with can't scan it, and neither can someone who can't see it. Put a link, or the text, next to it.
- An `<image>` in `overlay` is part of the picture and needs no name of its own.
- If you change the colors, keep the squares dark and the ground light, and scan it.

## CSS variables

Set any of these on the code, or on anything around it.

```css
.ticket {
  --nuv-qrcode-fg: var(--color-gray-950);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-qrcode-bg` | `var(--color-white)` | Color of the ground, under the code and under the overlay. White in every theme by default. Keep it light. |
| `--nuv-qrcode-fg` | `var(--color-black)` | Color of the squares. Black in every theme by default. Keep it much darker than the ground. |
| `--nuv-qrcode-invalid` | `var(--color-danger)` | Color of the edge and the line of a code that can't be drawn. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-qrcode` | QRCode: the svg. |
| `.nuv-qrcode__cross-arms` | QRCodeSwissCross: the white cross. |
| `.nuv-qrcode__cross-ground` | QRCodeSwissCross: its black square. |
| `.nuv-qrcode__ground` | The rectangle behind the squares, and the one behind the overlay. |
| `.nuv-qrcode__mark` | The edge and the line through a code that can't be drawn. |
| `.nuv-qrcode__overlay` | The box in the middle that `overlay` is drawn in. |
| `.nuv-qrcode__squares` | The dark squares, as one path. |

A code has `data-error-correction`, its level, and `data-version`, a number from 1 to 40 that says how many squares it has: 21 along a side at version 1, and four more with each version. One that can't be drawn has `data-invalid` instead.

## Server components

QRCode has no `"use client"`. Rendered in a server component, it's SVG in the HTML and sends no script. `saveCode` needs a browser, so the button that calls it is in a client component.

## Do and don't

**Do**

- Scan the code you ship, at the size and on the surface it will be seen.
- Keep the value short. Put an address in the code and the rest at the address.
- Say next to the code what scanning it does.

**Don't**

- Don't put a code on a photograph or a pattern. Leave it its white, and space around it.
- Don't put something secret in one. Anyone who can see it can read it.
- Don't use it on a page people open on their phones without a link beside it.
