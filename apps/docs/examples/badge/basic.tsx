import { Badge } from "@nuvui/react";

export default function Example() {
  return (
    <>
      <Badge>Draft</Badge>
      <Badge intent="primary">New</Badge>
      <Badge intent="success">Paid</Badge>
      <Badge intent="warning">Due soon</Badge>
      <Badge intent="danger">Overdue</Badge>
    </>
  );
}
