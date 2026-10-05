import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label htmlFor="fruit">Fruit</label>
      <Select>
        <SelectTrigger id="fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="cherry">Cherry</SelectItem>
          <SelectItem value="grape" disabled>
            Grape
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
