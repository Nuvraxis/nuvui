import { Input, Label } from "@nuvui/react";

const field = { display: "grid", gap: 6 };

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 20,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <div style={field}>
        <Label htmlFor="state-disabled" data-disabled="">
          Disabled
        </Label>
        <Input id="state-disabled" disabled defaultValue="Ada Lovelace" />
      </div>
      <div style={field}>
        <Label htmlFor="state-readonly">Read-only</Label>
        <Input id="state-readonly" readOnly defaultValue="INV-0042" />
      </div>
      <div style={field}>
        <Label htmlFor="state-invalid">Invalid</Label>
        <Input
          id="state-invalid"
          type="email"
          aria-invalid
          aria-describedby="state-invalid-error"
          defaultValue="ada@"
        />
        <span
          id="state-invalid-error"
          style={{ color: "var(--color-danger)", fontSize: 14 }}
        >
          Enter an email address, like ada@example.com.
        </span>
      </div>
    </div>
  );
}
