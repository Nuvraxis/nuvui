import { Button, ButtonGroup } from "@nuvui/react";

export default function Example() {
  return (
    <ButtonGroup orientation="vertical" aria-label="Zoom">
      <Button intent="secondary" aria-label="Zoom in">
        +
      </Button>
      <Button intent="secondary" aria-label="Zoom out">
        −
      </Button>
    </ButtonGroup>
  );
}
