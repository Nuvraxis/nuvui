"use client";

import { FireworksBackground } from "@nuvui/backgrounds/fireworks-background";
import { Button } from "@nuvui/react";
import { useState } from "react";

// Fireworks for a moment worth it, and not before.
export default function Example() {
  const [published, setPublished] = useState(false);
  const content = (
    <div className="grid justify-items-center gap-4 text-center">
      <h2 className="m-0 text-2xl font-semibold">
        {published ? "Published" : "Ready to publish"}
      </h2>
      <Button
        intent={published ? "secondary" : "primary"}
        onClick={() => setPublished((now) => !now)}
      >
        {published ? "Start again" : "Publish"}
      </Button>
    </div>
  );
  const frame = "grid min-h-64 w-full place-items-center rounded-lg p-8";

  return published ? (
    <FireworksBackground className={frame}>{content}</FireworksBackground>
  ) : (
    <div className={frame}>{content}</div>
  );
}
