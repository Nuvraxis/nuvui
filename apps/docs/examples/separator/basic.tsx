import { Separator } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ width: "100%", maxWidth: 320, fontSize: 14 }}>
      <p style={{ margin: 0 }}>Signed in as ada@example.com</p>
      <Separator style={{ marginBlock: 12 }} />
      <p style={{ margin: 0, color: "var(--color-muted-foreground)" }}>
        Last sign-in on 4 July, from Oslo.
      </p>
    </div>
  );
}
