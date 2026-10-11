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
