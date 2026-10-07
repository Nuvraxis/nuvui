import {
  Button,
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyTitle,
} from "@nuvui/react";

export default function Example() {
  return (
    <Empty style={{ width: "100%" }}>
      <EmptyTitle asChild>
        <h4>Nothing matches "nrothwind"</h4>
      </EmptyTitle>
      <EmptyDescription>
        Check the spelling, or search all customers instead of only the active
        ones.
      </EmptyDescription>
      <EmptyActions>
        <Button intent="secondary">Clear the search</Button>
      </EmptyActions>
    </Empty>
  );
}
