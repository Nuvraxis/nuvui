import { Badge } from "@nuvui/react";

export default function Example() {
  return (
    <>
      <Badge variant="outline">Draft</Badge>
      <Badge variant="outline" intent="primary">
        New
      </Badge>
      <Badge variant="outline" intent="success">
        Paid
      </Badge>
      <Badge variant="outline" intent="warning">
        Due soon
      </Badge>
      <Badge variant="outline" intent="danger">
        Overdue
      </Badge>
    </>
  );
}
