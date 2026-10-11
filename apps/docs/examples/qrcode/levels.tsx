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
