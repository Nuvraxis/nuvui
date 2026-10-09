// The site's mark: a square with an arch in it, for the n of the name. It
// takes the color of the text around it, and the arch shows the page.
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="site-logo"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
    >
      <rect width="24" height="24" rx="6" fill="currentColor" />
      <path
        className="site-logo__arch"
        d="M8 16.5v-5a4 4 0 0 1 8 0v5"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
    </svg>
  );
}
