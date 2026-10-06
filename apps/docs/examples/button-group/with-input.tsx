import { Button, ButtonGroup, Input } from "@nuvui/react";

export default function Example() {
  return (
    <ButtonGroup style={{ inlineSize: "100%", maxInlineSize: 360 }}>
      <Input type="email" aria-label="Email" placeholder="you@example.com" />
      <Button>Subscribe</Button>
    </ButtonGroup>
  );
}
