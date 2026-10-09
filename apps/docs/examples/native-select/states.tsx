import { Label, NativeSelect } from "@nuvui/react";

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
        <Label htmlFor="native-disabled" data-disabled="">
          Disabled
        </Label>
        <NativeSelect id="native-disabled" disabled>
          <option>Free</option>
        </NativeSelect>
      </div>
      <div style={field}>
        <Label htmlFor="native-invalid">Invalid</Label>
        <NativeSelect
          id="native-invalid"
          aria-invalid
          aria-describedby="native-invalid-error"
          defaultValue=""
        >
          <option value="">Pick a plan</option>
          <option value="free">Free</option>
          <option value="team">Team</option>
        </NativeSelect>
        <span
          id="native-invalid-error"
          style={{ color: "var(--color-danger)", fontSize: 14 }}
        >
          Pick a plan to continue.
        </span>
      </div>
    </div>
  );
}
