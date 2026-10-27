// The site's mark: an N and a diamond on a dark square. Its colors are the
// brand's, written out, and the same in a light theme and a dark one. The
// square's edge keeps it apart from a dark page.
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="site-logo"
      viewBox="28 28 160 160"
      width={size}
      height={size}
      fill="none"
    >
      <rect x="28" y="28" width="160" height="160" rx="24" fill="#1F2122" />
      <rect
        x="28.75"
        y="28.75"
        width="158.5"
        height="158.5"
        rx="23.25"
        stroke="#F2A33C"
        strokeOpacity="0.3"
        strokeWidth="1.5"
      />
      <path
        d="M78.3874 142V73.84H95.9554L120.915 116.56V73.84H137.619V142H119.955L95.0914 101.104V142H78.3874Z"
        fill="#F2A33C"
      />
      <rect
        x="144"
        y="50"
        width="18"
        height="18"
        rx="4"
        transform="rotate(-45 144 50)"
        fill="#F2A33C"
      />
    </svg>
  );
}
