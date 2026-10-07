import { AspectRatio } from "@nuvui/react";

const ratios = [
  ["1 / 1", 1],
  ["4 / 3", 4 / 3],
  ["16 / 9", 16 / 9],
] as const;

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 12,
        alignItems: "start",
        width: "100%",
        maxWidth: 420,
      }}
    >
      {ratios.map(([name, ratio]) => (
        <AspectRatio key={name} ratio={ratio}>
          <div
            style={{
              display: "grid",
              placeItems: "center",
              backgroundColor: "var(--color-muted)",
              fontSize: 14,
            }}
          >
            {name}
          </div>
        </AspectRatio>
      ))}
    </div>
  );
}
