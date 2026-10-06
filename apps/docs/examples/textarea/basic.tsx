import { Label, Textarea } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 400,
      }}
    >
      <Label htmlFor="textarea-notes">Notes for the driver</Label>
      <Textarea
        id="textarea-notes"
        placeholder="Gate code, where to leave it"
      />
    </div>
  );
}
