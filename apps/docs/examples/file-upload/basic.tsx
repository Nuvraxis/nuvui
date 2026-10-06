import { FileUpload, Label } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        inlineSize: "100%",
        maxInlineSize: 420,
      }}
    >
      <Label htmlFor="upload-contract">Signed contract</Label>
      <FileUpload id="upload-contract" name="contract" />
    </div>
  );
}
