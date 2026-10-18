import type { ReactNode } from "react";

// Drawn for this package on a 20 by 20 grid. Filled shapes say so; the
// rest are lines in the text's color.
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="nuv-media-icon"
      viewBox="0 0 20 20"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const PlayIcon = () => (
  <Icon>
    <path d="M6.5 4.5v11l8.5-5.5-8.5-5.5Z" fill="currentColor" />
  </Icon>
);

export const PauseIcon = () => (
  <Icon>
    <path
      d="M6 4.5h2.5v11H6zM11.5 4.5H14v11h-2.5z"
      fill="currentColor"
      stroke="none"
    />
  </Icon>
);

export const ReplayIcon = () => (
  <Icon>
    <path d="M4.5 10a5.5 5.5 0 1 0 1.7-4" />
    <path d="M5.5 3v3.5H9" />
  </Icon>
);

const speaker = "M3.5 8h2.5l3.5-3v10l-3.5-3H3.5z";

export const VolumeIcon = ({ level }: { level: "high" | "low" | "off" }) => (
  <Icon>
    <path d={speaker} fill="currentColor" />
    {level === "off" ? (
      <path d="m12.5 8 4 4m0-4-4 4" />
    ) : (
      <>
        <path d="M12.5 8a2.8 2.8 0 0 1 0 4" />
        {level === "high" && <path d="M14.5 6a5.6 5.6 0 0 1 0 8" />}
      </>
    )}
  </Icon>
);

export const FullscreenIcon = ({ exit }: { exit: boolean }) => (
  <Icon>
    <path
      d={
        exit
          ? "M7.5 3.5v4h-4M16.5 7.5h-4v-4M12.5 16.5v-4h4M3.5 12.5h4v4"
          : "M3.5 7.5v-4h4M12.5 3.5h4v4M16.5 12.5v4h-4M7.5 16.5h-4v-4"
      }
    />
  </Icon>
);

export const PictureInPictureIcon = () => (
  <Icon>
    <rect x="3" y="4.5" width="14" height="11" rx="1.5" />
    <rect
      x="10"
      y="9.5"
      width="5"
      height="4"
      rx="0.5"
      fill="currentColor"
      stroke="none"
    />
  </Icon>
);

export const CaptionsIcon = () => (
  <Icon>
    <rect x="2.75" y="4.75" width="14.5" height="10.5" rx="1.5" />
    <path d="M9 8.7a1.7 1.7 0 1 0 0 2.6M14 8.7a1.7 1.7 0 1 0 0 2.6" />
  </Icon>
);

export const SettingsIcon = () => (
  <Icon>
    <path d="M3.5 6h13M3.5 10h13M3.5 14h13" />
    <circle cx="12.5" cy="6" r="1.75" fill="currentColor" />
    <circle cx="7" cy="10" r="1.75" fill="currentColor" />
    <circle cx="13.5" cy="14" r="1.75" fill="currentColor" />
  </Icon>
);

export const SkipIcon = ({ ahead }: { ahead: boolean }) => (
  <Icon>
    {ahead ? (
      <>
        <path d="M15.5 10a5.5 5.5 0 1 1-1.7-4" />
        <path d="M14.5 3v3.5H11" />
      </>
    ) : (
      <>
        <path d="M4.5 10a5.5 5.5 0 1 0 1.7-4" />
        <path d="M5.5 3v3.5H9" />
      </>
    )}
  </Icon>
);
