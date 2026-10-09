import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@nuvui/react";

export default function Example() {
  return (
    <Collapsible style={{ width: "100%", maxWidth: 360 }}>
      <CollapsibleTrigger asChild>
        <Button intent="secondary">Show the error details</Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p style={{ margin: 0, paddingBlockStart: 12, fontSize: 14 }}>
          The request to /api/orders timed out after 30 seconds. Request ID
          7f3a-22c1.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
