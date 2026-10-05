import { Button } from "@nuvui/react";

export default function Example() {
  return (
    <>
      <Button disabled>Save changes</Button>
      <Button intent="secondary" disabled>
        Cancel
      </Button>
    </>
  );
}
