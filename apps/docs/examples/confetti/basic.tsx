"use client";

import { Button, burstConfetti } from "@nuvui/react";

export default function Example() {
  return (
    <Button onClick={(event) => burstConfetti(event.currentTarget)}>
      Publish
    </Button>
  );
}
