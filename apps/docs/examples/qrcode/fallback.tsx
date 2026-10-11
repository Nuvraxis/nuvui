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
