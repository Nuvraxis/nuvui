"use client";

import { OtpField } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [sent, setSent] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSent(String(new FormData(event.currentTarget).get("pin")));
      }}
      style={{ display: "grid", gap: 12, justifyItems: "start" }}
    >
      <OtpField
        aria-label="Four digit PIN"
        name="pin"
        length={4}
        type="password"
        autoComplete="off"
        autoSubmit
      />
      <output aria-live="polite">
        {sent
          ? `Submitted a ${sent.length} digit PIN.`
          : "Nothing submitted yet."}
      </output>
    </form>
  );
}
