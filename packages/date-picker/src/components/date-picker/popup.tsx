"use client";

import { Dialog, DialogContent, DialogTitle } from "@nuvui/react/dialog";
import { PopoverContent } from "@nuvui/react/popover";
import type { ReactNode, RefObject } from "react";

export interface PopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A sheet across the bottom of the screen, or a panel by the field. */
  phone: boolean;
  title: string;
  closeLabel: string;
  container: Element | DocumentFragment | null | undefined;
  /** Where focus goes back to when a sheet closes. */
  trigger: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
}

// Focus goes to the day the arrow keys start from: the picked day, or today.
// Left alone, it would go to the first thing that takes focus, which is the
// button for the previous month.
function focusDay(event: Event) {
  event.preventDefault();
  const popup = event.currentTarget as HTMLElement;
  const day = popup.querySelector<HTMLElement>(
    '[role="gridcell"] button[tabindex="0"]',
  );
  (day ?? popup).focus();
}

/**
 * What the calendar opens in. The popover half is rendered inside the
 * `Popover` that DatePicker wraps its field in. The sheet is a dialog of its
 * own, with no trigger part, so it's told where to send focus back to.
 */
export function Popup({
  open,
  onOpenChange,
  phone,
  title,
  closeLabel,
  container,
  trigger,
  children,
}: PopupProps) {
  if (phone) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="nuv-date-picker__sheet"
          closeLabel={closeLabel}
          container={container}
          // The title says what this is. There's nothing more to describe.
          aria-describedby={undefined}
          onOpenAutoFocus={focusDay}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
        >
          <DialogTitle>{title}</DialogTitle>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <PopoverContent
      className="nuv-date-picker__popover"
      aria-label={title}
      align="start"
      container={container}
      onOpenAutoFocus={focusDay}
    >
      {children}
    </PopoverContent>
  );
}
