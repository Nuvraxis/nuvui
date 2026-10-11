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
