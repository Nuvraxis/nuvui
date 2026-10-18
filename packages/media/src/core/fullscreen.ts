// Safari before 16.4 has only the prefixed forms, and the iPhone has no
// fullscreen for an element at all, only for a video, in its own player.
interface PrefixedDocument {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
}
interface PrefixedElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}
interface PrefixedVideo {
  webkitEnterFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
}

export function fullscreenElement(): Element | null {
  const doc = document as Document & PrefixedDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

/** Whether an element can be made fullscreen here, or failing that, the video. */
export function canFullscreen(video: HTMLVideoElement | null): boolean {
  if (typeof document === "undefined") return false;
  const doc = document as Document & PrefixedDocument;
  return Boolean(
    doc.fullscreenEnabled ||
      doc.webkitFullscreenEnabled ||
      (video as (HTMLVideoElement & PrefixedVideo) | null)
        ?.webkitEnterFullscreen,
  );
}

export async function enterFullscreen(
  element: HTMLElement,
  video: HTMLVideoElement | null,
): Promise<void> {
  const el = element as HTMLElement & PrefixedElement;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen({ navigationUI: "hide" });
      return;
    }
    if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
      return;
    }
  } catch {
    // Refused, for example when not started by a press. Fall through to the
    // video's own fullscreen where there is one.
  }
  (
    video as (HTMLVideoElement & PrefixedVideo) | null
  )?.webkitEnterFullscreen?.();
}

export async function exitFullscreen(): Promise<void> {
  const doc = document as Document & PrefixedDocument;
  try {
    if (doc.exitFullscreen) await doc.exitFullscreen();
    else await doc.webkitExitFullscreen?.();
  } catch {
    // Already out of it.
  }
}
