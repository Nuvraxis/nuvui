import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label htmlFor="city">Nearest office</label>
      <Select defaultValue="lisbon">
        <SelectTrigger id="city">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Europe</SelectLabel>
            <SelectItem value="berlin">Berlin</SelectItem>
            <SelectItem value="lisbon">Lisbon</SelectItem>
            <SelectItem value="oslo">Oslo</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Asia</SelectLabel>
            <SelectItem value="kochi">Kochi</SelectItem>
            <SelectItem value="osaka">Osaka</SelectItem>
            <SelectItem value="seoul">Seoul</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
