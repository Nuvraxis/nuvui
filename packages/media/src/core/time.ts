import type { MediaLabels } from "./labels";

const two = (n: number) => String(n).padStart(2, "0");

/**
 * A time as a clock shows it: 0:05, 4:12, 1:02:03. With `longest` an hour
 * or more, every time has hours, so the width doesn't jump.
 */
export function formatTime(seconds: number, longest = seconds): string {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return longest >= 3600 || h > 0
    ? `${h}:${two(m)}:${two(s)}`
    : `${m}:${two(s)}`;
}

/** A time in words, for a screen reader: "1 minute 5 seconds". */
export function spokenTime(seconds: number, labels: MediaLabels): string {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts = [
    h > 0 ? labels.hours(h) : "",
    m > 0 ? labels.minutes(m) : "",
    s > 0 || total === 0 ? labels.seconds(s) : "",
  ];
  return parts.filter(Boolean).join(" ");
}

/** A speed as the menu shows it: 0.5×, 1.25×. */
export const formatRate = (rate: number) => `${rate}×`;
