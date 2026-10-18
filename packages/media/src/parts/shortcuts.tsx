"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@nuvui/react/dialog";
import { Kbd } from "@nuvui/react/kbd";
import type { MediaLabels } from "../core/labels";

/** Keys and what they do, as the shortcuts sheet lists them. */
export type ShortcutList = [keys: string[], what: string][];

export const videoShortcuts = (
  labels: MediaLabels,
  skip: number,
): ShortcutList => [
  [["Space", "K"], labels.shortcutPlay],
  [["J"], labels.skipBack(skip)],
  [["L"], labels.skipAhead(skip)],
  [["←", "→"], `${labels.skipBack(5)}, ${labels.skipAhead(5)}`],
  [["↑", "↓"], labels.shortcutVolume],
  [["M"], labels.shortcutMute],
  [["F"], labels.shortcutFullscreen],
  [["C"], labels.shortcutCaptions],
  [["0", "9"], labels.shortcutJump],
  [["<", ">"], labels.shortcutSpeed],
  [[",", "."], labels.shortcutFrame],
  [["?"], labels.shortcutShortcuts],
];

export const audioShortcuts = (
  labels: MediaLabels,
  back: number,
  ahead: number,
): ShortcutList => [
  [["Space", "K"], labels.shortcutPlay],
  [["J"], labels.skipBack(back)],
  [["L"], labels.skipAhead(ahead)],
  [["←", "→"], `${labels.skipBack(5)}, ${labels.skipAhead(5)}`],
  [["↑", "↓"], labels.shortcutVolume],
  [["M"], labels.shortcutMute],
  [["0", "9"], labels.shortcutJump],
  [["<", ">"], labels.shortcutSpeed],
  [["?"], labels.shortcutShortcuts],
];

/** The sheet of keyboard shortcuts, opened inside the player so it's seen in fullscreen. */
export function MediaShortcuts({
  open,
  onOpenChange,
  labels,
  list,
  container,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: MediaLabels;
  list: ShortcutList;
  container: { current: HTMLElement | null };
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        container={container.current}
        className="nuv-media-shortcuts"
      >
        <DialogTitle>{labels.shortcuts}</DialogTitle>
        <DialogDescription className="nuv-media-hidden">
          {labels.shortcutShortcuts}
        </DialogDescription>
        <dl className="nuv-media-shortcuts__list">
          {list.map(([keys, what]) => (
            <div key={what} className="nuv-media-shortcuts__row">
              <dt>
                {keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </dt>
              <dd>{what}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
