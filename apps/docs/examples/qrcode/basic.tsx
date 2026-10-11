import { QRCode } from "@nuvui/barcodes";

export default function Example() {
  return (
    <QRCode
      value="https://nuvui.nuvraxis.com/docs"
      aria-label="Open the nuvui docs"
    />
  );
}
