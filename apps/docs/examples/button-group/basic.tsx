import { Button, ButtonGroup } from "@nuvui/react";

export default function Example() {
  return (
    <ButtonGroup aria-label="Message actions">
      <Button intent="secondary">Reply</Button>
      <Button intent="secondary">Forward</Button>
      <Button intent="secondary">Archive</Button>
    </ButtonGroup>
  );
}
