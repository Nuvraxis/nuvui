import { Checkbox, Label } from "@nuvui/react";

export default function Example() {
  return (
    <Label style={{ "--nuv-label-gap": "8px" } as never}>
      <Checkbox />
      Remember this device
    </Label>
  );
}
