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
