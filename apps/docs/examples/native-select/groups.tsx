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
      <Label htmlFor="native-zone">Time zone</Label>
      <NativeSelect id="native-zone" defaultValue="Europe/Oslo">
        <optgroup label="Europe">
          <option value="Europe/Lisbon">Lisbon</option>
          <option value="Europe/Oslo">Oslo</option>
        </optgroup>
        <optgroup label="Asia">
          <option value="Asia/Colombo">Colombo</option>
          <option value="Asia/Tokyo">Tokyo</option>
        </optgroup>
      </NativeSelect>
    </div>
  );
}
