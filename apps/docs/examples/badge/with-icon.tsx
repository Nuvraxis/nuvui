import { Badge, VisuallyHidden } from "@nuvui/react";

export default function Example() {
  return (
    <>
      <Badge intent="success">
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 6.5l2.25 2.25L9.5 3.5" />
        </svg>
        Verified
      </Badge>
      <Badge intent="danger">
        12
        <VisuallyHidden> failed jobs</VisuallyHidden>
      </Badge>
    </>
  );
}
