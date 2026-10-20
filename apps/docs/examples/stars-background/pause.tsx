"use client";

import { StarsBackground } from "@nuvui/backgrounds/stars-background";
import { Button } from "@nuvui/react";
import { useState } from "react";

// Anything that moves for more than five seconds needs a way to stop it.
// The button keeps its name, and says whether it's pressed.
export default function Example() {
  const [paused, setPaused] = useState(false);

  return (
    <StarsBackground
      paused={paused}
      scrim="soft"
      className="grid min-h-64 w-full content-between justify-items-start gap-6 rounded-lg p-6"
    >
      <h2 className="m-0 text-2xl font-semibold">Quarterly review</h2>
      <Button
        intent="secondary"
        size="sm"
        aria-pressed={paused}
        onClick={() => setPaused((now) => !now)}
      >
        Pause the background
      </Button>
    </StarsBackground>
  );
}
