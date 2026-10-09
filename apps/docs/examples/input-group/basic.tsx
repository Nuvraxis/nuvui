import { Input, InputGroup, InputGroupAddon, Label } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 360,
      }}
    >
      <Label htmlFor="group-site">Website</Label>
      <InputGroup>
        <InputGroupAddon>https://</InputGroupAddon>
        <Input id="group-site" placeholder="example.com" />
      </InputGroup>
    </div>
  );
}
