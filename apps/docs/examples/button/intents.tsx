import { Button } from "@nuvui/react";

export default function Example() {
  return (
    <>
      <Button intent="primary">Save</Button>
      <Button intent="secondary">Cancel</Button>
      <Button intent="ghost">Skip for now</Button>
      <Button intent="danger">Delete</Button>
    </>
  );
}
