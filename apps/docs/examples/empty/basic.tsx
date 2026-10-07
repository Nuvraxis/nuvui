import {
  Button,
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@nuvui/react";

export default function Example() {
  return (
    <Empty style={{ width: "100%" }}>
      <EmptyMedia>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5" />
        </svg>
      </EmptyMedia>
      <EmptyTitle>No invoices yet</EmptyTitle>
      <EmptyDescription>
        Invoices show up here once you send the first one to a customer.
      </EmptyDescription>
      <EmptyActions>
        <Button>New invoice</Button>
        <Button intent="secondary">Import from a file</Button>
      </EmptyActions>
    </Empty>
  );
}
