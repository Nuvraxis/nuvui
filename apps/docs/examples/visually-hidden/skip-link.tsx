import { Button, VisuallyHidden } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <VisuallyHidden focusable>
        <Button asChild intent="secondary">
          <a href="#skip-link-target">Skip to the article</a>
        </Button>
      </VisuallyHidden>
      <Button>Press Tab from the button before this one</Button>
      <p
        id="skip-link-target"
        tabIndex={-1}
        style={{ margin: 0, fontSize: 14 }}
      >
        The article starts here.
      </p>
    </div>
  );
}
