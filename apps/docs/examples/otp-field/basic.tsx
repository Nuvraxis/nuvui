import { Label, OtpField } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
      <Label asChild>
        <span id="otp-basic-label">Verification code</span>
      </Label>
      <OtpField aria-labelledby="otp-basic-label" />
    </div>
  );
}
