import { Label, PasswordInput } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <Label htmlFor="password-current">Password</Label>
      <PasswordInput id="password-current" />
    </div>
  );
}
