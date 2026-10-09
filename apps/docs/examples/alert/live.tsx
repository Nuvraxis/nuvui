"use client";

import { Alert, AlertDescription, AlertTitle, Button } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [failed, setFailed] = useState(false);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        justifyItems: "start",
        width: "100%",
        maxWidth: 480,
      }}
    >
      <Button onClick={() => setFailed((value) => !value)}>
        {failed ? "Clear the error" : "Save with an error"}
      </Button>
      {failed ? (
        <Alert intent="danger" style={{ width: "100%" }}>
          <AlertTitle>The changes weren't saved</AlertTitle>
          <AlertDescription>
            The server didn't answer. Try again in a moment.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
