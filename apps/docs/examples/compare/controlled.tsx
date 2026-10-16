"use client";

import { Button, ButtonGroup, Compare } from "@nuvui/react";
import { useState } from "react";
import { kitchenAfter, kitchenBefore } from "./pictures";

export default function Example() {
  const [position, setPosition] = useState(50);

  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 560 }}>
      <Compare
        position={position}
        onPositionChange={setPosition}
        before={
          <img src={kitchenBefore} alt="The kitchen with its old cabinets" />
        }
        after={
          <img src={kitchenAfter} alt="The kitchen with new wooden cabinets" />
        }
      />
      <ButtonGroup aria-label="Move the divider">
        <Button intent="secondary" onClick={() => setPosition(100)}>
          All before
        </Button>
        <Button intent="secondary" onClick={() => setPosition(50)}>
          Half
        </Button>
        <Button intent="secondary" onClick={() => setPosition(0)}>
          All after
        </Button>
      </ButtonGroup>
      <p style={{ margin: 0, color: "var(--color-muted-foreground)" }}>
        {Math.round(position)}% before
      </p>
    </div>
  );
}
