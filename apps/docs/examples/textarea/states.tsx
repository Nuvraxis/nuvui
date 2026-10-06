import { Label, Textarea } from "@nuvui/react";

const field = { display: "grid", gap: 6 };

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 20,
        inlineSize: "100%",
        maxInlineSize: 400,
      }}
    >
      <div style={field}>
        <Label htmlFor="textarea-disabled" data-disabled="">
          Disabled
        </Label>
        <Textarea
          id="textarea-disabled"
          disabled
          defaultValue="Closed to replies."
        />
      </div>
      <div style={field}>
        <Label htmlFor="textarea-invalid">Invalid</Label>
        <Textarea
          id="textarea-invalid"
          aria-invalid
          aria-describedby="textarea-invalid-error"
          defaultValue="Hi"
        />
        <span
          id="textarea-invalid-error"
          style={{ color: "var(--color-danger)", fontSize: 14 }}
        >
          Write at least 20 characters.
        </span>
      </div>
    </div>
  );
}
