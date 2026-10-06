import { Label, NativeSelect } from "@nuvui/react";

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
      <Label htmlFor="native-country">Country</Label>
      <NativeSelect id="native-country" defaultValue="">
        <option value="" disabled>
          Pick a country
        </option>
        <option value="dk">Denmark</option>
        <option value="fi">Finland</option>
        <option value="no">Norway</option>
        <option value="se">Sweden</option>
      </NativeSelect>
    </div>
  );
}
