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
