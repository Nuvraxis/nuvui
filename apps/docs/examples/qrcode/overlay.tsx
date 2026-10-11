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
