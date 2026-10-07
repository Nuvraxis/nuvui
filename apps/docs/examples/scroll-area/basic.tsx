import { ScrollArea } from "@nuvui/react";

const releases = Array.from(
  { length: 30 },
  (_, index) => `Release 2.${30 - index}`,
);

export default function Example() {
  return (
    <ScrollArea
      aria-label="Releases"
      style={{
        width: "100%",
        maxWidth: 260,
        height: 200,
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <ul
        style={{
          margin: 0,
          padding: "8px 16px",
          listStyle: "none",
          fontSize: 14,
        }}
      >
        {releases.map((release) => (
          <li key={release} style={{ paddingBlock: 6 }}>
            {release}
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}
