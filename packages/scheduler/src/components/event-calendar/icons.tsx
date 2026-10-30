export function Chevron({
  direction,
  className,
}: {
  direction: "previous" | "next";
  className: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={`${className} ${className}--${direction}`}
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d={
          direction === "previous"
            ? "M10 3.5 5.5 8l4.5 4.5"
            : "M6 3.5 10.5 8 6 12.5"
        }
      />
    </svg>
  );
}
