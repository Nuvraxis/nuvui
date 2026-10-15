"use client";

import { Button, burstConfetti } from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl } from "./controls";

const counts = ["40", "80", "150"] as const;
const palettes = ["theme", "two colors"] as const;
const two = ["var(--color-primary)", "var(--color-warning)"];

export function ConfettiPlayground() {
  const [count, setCount] = useState<(typeof counts)[number]>("80");
  const [palette, setPalette] = useState<(typeof palettes)[number]>("theme");

  const colors = palette === "theme" ? undefined : two;
  const options = [
    count === "80" ? "" : `count: ${count}`,
    colors ? `colors: ["var(--color-primary)", "var(--color-warning)"]` : "",
  ].filter(Boolean);
  const code = `<Button onClick={(event) => burstConfetti(event.currentTarget${
    options.length > 0 ? `, { ${options.join(", ")} }` : ""
  })}>
  Publish
</Button>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="count"
            value={count}
            options={counts}
            onChange={setCount}
          />
          <SelectControl
            label="colors"
            value={palette}
            options={palettes}
            onChange={setPalette}
          />
        </>
      }
    >
      <Button
        onClick={(event) =>
          burstConfetti(event.currentTarget, {
            count: Number(count),
            colors,
          })
        }
      >
        Publish
      </Button>
    </Playground>
  );
}
