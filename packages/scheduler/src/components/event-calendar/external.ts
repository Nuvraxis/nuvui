import type { DragEvent } from "react";
import type { EventColor } from "../../core/events";

/** The type an item dragged into the calendar is carried as. */
export const eventType = "application/x-nuvui-event";

/**
 * Something elsewhere on the page that becomes an event when it's dropped
 * on the calendar. Anything else in it, such as your own id for it, is
 * copied onto the event.
 */
export interface ExternalEvent {
  title: string;
  /**
   * Minutes it lasts when it's dropped on a time. The calendar's
   * `defaultDuration` by default.
   */
  duration?: number;
  /** It takes the whole day it's dropped on, wherever it's dropped. */
  allDay?: boolean;
  color?: EventColor;
  description?: string;
  [field: string]: unknown;
}

// What's being dragged, while it is. The browser only hands over a drag's
// data on the drop, and the calendar draws where it would go before that.
let dragging: ExternalEvent | null = null;

export function draggedItem(): ExternalEvent | null {
  return dragging;
}

/**
 * Props for an element of your own that can be dragged onto the calendar,
 * to be added as an event. A browser's own drag and drop, which a mouse
 * can do and a finger or the keyboard can't, so offer another way too.
 */
export function eventDragProps(item: ExternalEvent) {
  return {
    draggable: true,
    onDragStart: (event: DragEvent<HTMLElement>) => {
      dragging = item;
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData(eventType, JSON.stringify(item));
      event.dataTransfer.setData("text/plain", item.title);
    },
    onDragEnd: () => {
      dragging = null;
    },
  };
}
