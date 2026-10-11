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
