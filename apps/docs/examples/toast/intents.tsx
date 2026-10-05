"use client";

import { Button, toast } from "@nuvui/react";

export default function Example() {
  return (
    <>
      <Button intent="secondary" onClick={() => toast("3 files selected")}>
        Neutral
      </Button>
      <Button
        intent="secondary"
        onClick={() => toast("Invitation sent", { intent: "success" })}
      >
        Success
      </Button>
      <Button
        intent="secondary"
        onClick={() =>
          toast("Couldn't send the invitation", {
            intent: "danger",
            description: "Check the address and try again.",
          })
        }
      >
        Danger
      </Button>
    </>
  );
}
