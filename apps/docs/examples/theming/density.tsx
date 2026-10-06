import { Button } from "@nuvui/react";

const densities = ["compact", "default", "comfortable"];

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {densities.map((density) => (
        <div
          key={density}
          data-density={density}
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <code style={{ inlineSize: "7rem" }}>{density}</code>
          <Button size="sm">Small</Button>
          <Button>Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      ))}
    </div>
  );
}
