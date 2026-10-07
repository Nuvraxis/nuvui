import { Button, VisuallyHidden } from "@nuvui/react";

export default function Example() {
  return (
    <Button intent="secondary">
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8.5h6l.5-8.5" />
      </svg>
      <VisuallyHidden>Delete the invoice</VisuallyHidden>
    </Button>
  );
}
