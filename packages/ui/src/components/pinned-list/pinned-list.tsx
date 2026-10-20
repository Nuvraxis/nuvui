"use client";

import { useComposedRefs } from "@radix-ui/react-compose-refs";
import {
  createContext,
  Fragment,
  forwardRef,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type ReactNode,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";

/** What changed, for `onPinnedChange`. */
export interface PinnedListChange {
  /** The item whose pin was pressed. */
  value: string;
  /** Whether it's pinned now. */
  pinned: boolean;
}

export interface PinnedListOwnProps {
  /** The items' ids, in their order. Both groups keep this order. */
  items: string[];
  /** The ids that are pinned, when you keep them yourself. */
  pinned?: string[];
  /**
   * The ids pinned to begin with, when the list keeps them.
   * @default []
   */
  defaultPinned?: string[];
  /** Called when a pin is pressed, with the ids that are pinned now. */
  onPinnedChange?: (pinned: string[], change: PinnedListChange) => void;
  /**
   * Draws one item: a `PinnedListItem`, given its id and whether it's
   * pinned.
   */
  children: (value: string, pinned: boolean) => ReactNode;
  /** Whether the pins can't be pressed. */
  disabled?: boolean;
  /**
   * The name over the pinned items. Translate it with the rest of your
   * interface.
   * @default "Pinned"
   */
  pinnedLabel?: string;
  /**
   * The name over the rest.
   * @default "Everything else"
   */
  restLabel?: string;
  /**
   * The name of an item's pin, given the item's label. Whether it's
   * pressed is said apart from the name.
   * @default (label) => `Pin ${label}`
   */
  pinLabel?: (label: string) => string;
  /**
   * What a screen reader is told when an item is pinned.
   * @default (label) => `Pinned ${label}`
   */
  pinnedMessage?: (label: string) => string;
  /**
   * What a screen reader is told when an item is unpinned.
   * @default (label) => `Unpinned ${label}`
   */
  unpinnedMessage?: (label: string) => string;
}

export interface PinnedListProps
  extends PinnedListOwnProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof PinnedListOwnProps> {}

interface PinnedListContextValue {
  pinned: Set<string>;
  disabled: boolean;
  pinLabel: (label: string) => string;
  toggle: (value: string, label: string) => void;
}

const PinnedListContext = createContext<PinnedListContextValue | null>(null);

// Where each item and each group's name was, before a move, by key.
type Places = Map<string, DOMRect>;

const placed = (root: HTMLElement) =>
  root.querySelectorAll<HTMLElement>("[data-pinned-list-key]");

function measure(root: HTMLElement): Places {
  const places: Places = new Map();
  for (const element of placed(root)) {
    places.set(
      element.dataset.pinnedListKey as string,
      element.getBoundingClientRect(),
    );
  }
  return places;
}

// A duration from the stylesheet, such as "250ms" or "0.25s".
function milliseconds(value: string, fallback: number) {
  const number = Number.parseFloat(value);
  if (Number.isNaN(number)) return fallback;
  return value.trim().endsWith("ms") ? number : number * 1000;
}

const itemKey = (value: string) => `item:${value}`;

/**
 * A list in two groups: what's pinned at the top, and the rest under it.
 * Each item has a pin, and pressing it moves the item to the other group,
 * sliding over the others while they make room.
 */
export const PinnedList = forwardRef<HTMLDivElement, PinnedListProps>(
  function PinnedList(
    {
      items,
      pinned: pinnedProp,
      defaultPinned = [],
      onPinnedChange,
      children,
      disabled = false,
      pinnedLabel = "Pinned",
      restLabel = "Everything else",
      pinLabel = (label) => `Pin ${label}`,
      pinnedMessage = (label) => `Pinned ${label}`,
      unpinnedMessage = (label) => `Unpinned ${label}`,
      className,
      ...props
    },
    ref,
  ) {
    const [ownPinned, setOwnPinned] = useState(defaultPinned);
    const pinned = pinnedProp ?? ownPinned;
    const pinnedSet = new Set(pinned);
    const [message, setMessage] = useState("");
    const id = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const merged = useComposedRefs(ref, rootRef);
    // Set when a pin is pressed, and read once the list has moved.
    const move = useRef<{
      value: string;
      places: Places;
      focused: boolean;
    } | null>(null);

    const toggle = (value: string, label: string) => {
      const root = rootRef.current;
      const item = root?.querySelector(
        `[data-pinned-list-key="${CSS.escape(itemKey(value))}"]`,
      );
      if (root) {
        // Where everything is now, mid-slide if a move is still running,
        // so the next one starts from what's on the screen.
        const places = measure(root);
        for (const element of placed(root)) {
          for (const animation of element.getAnimations()) animation.cancel();
        }
        move.current = {
          value,
          places,
          focused: Boolean(item?.contains(document.activeElement)),
        };
      }

      const now = !pinnedSet.has(value);
      const next = now
        ? [...pinned, value]
        : pinned.filter((each) => each !== value);
      setOwnPinned(next);
      setMessage((now ? pinnedMessage : unpinnedMessage)(label));
      onPinnedChange?.(next, { value, pinned: now });
    };

    const pinnedKey = pinned.join("\n");
    // biome-ignore lint/correctness/useExhaustiveDependencies: runs once for each change of what's pinned
    useLayoutEffect(() => {
      const root = rootRef.current;
      const last = move.current;
      move.current = null;
      if (!root || !last) return;

      // The item is in the other group now, a new element, and the focus
      // that was on its pin went with the old one.
      const key = CSS.escape(itemKey(last.value));
      const item = root.querySelector<HTMLElement>(
        `[data-pinned-list-key="${key}"]`,
      );
      if (last.focused) {
        item?.querySelector<HTMLElement>(".nuv-pinned-list__pin")?.focus();
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      const style = getComputedStyle(root);
      const timing = {
        duration: milliseconds(
          style.getPropertyValue("--nuv-pinned-list-duration") ||
            style.getPropertyValue("--nuv-duration-slow"),
          250,
        ),
        easing:
          style.getPropertyValue("--nuv-pinned-list-easing").trim() ||
          style.getPropertyValue("--ease-out").trim() ||
          "ease-out",
      };

      // Each one is drawn where it was, and slides to where it is.
      for (const element of placed(root)) {
        const was = last.places.get(element.dataset.pinnedListKey as string);
        if (!was) {
          // A group's name that wasn't there before.
          element.animate([{ opacity: 0 }, { opacity: 1 }], timing);
          continue;
        }
        const is = element.getBoundingClientRect();
        const x = was.left - is.left;
        const y = was.top - is.top;
        if (!x && !y) continue;
        const moving = element === item;
        if (moving) element.dataset.moving = "";
        const animation = element.animate(
          [{ transform: `translate(${x}px, ${y}px)` }, { transform: "none" }],
          timing,
        );
        if (moving) {
          const done = () => {
            delete element.dataset.moving;
          };
          animation.addEventListener("finish", done);
          animation.addEventListener("cancel", done);
        }
      }
    }, [pinnedKey]);

    const groups = [
      {
        name: "pinned",
        label: pinnedLabel,
        values: items.filter((value) => pinnedSet.has(value)),
      },
      {
        name: "rest",
        label: restLabel,
        values: items.filter((value) => !pinnedSet.has(value)),
      },
    ];

    return (
      <PinnedListContext.Provider
        value={{ pinned: pinnedSet, disabled, pinLabel, toggle }}
      >
        <div
          ref={merged}
          className={cx("nuv-pinned-list", className)}
          {...props}
        >
          {groups.map((group) =>
            group.values.length ? (
              <div
                key={group.name}
                className="nuv-pinned-list__group"
                data-group={group.name}
              >
                <div
                  id={`${id}-${group.name}`}
                  className="nuv-pinned-list__label"
                  data-pinned-list-key={`label:${group.name}`}
                >
                  {group.label}
                </div>
                <ul
                  className="nuv-pinned-list__items"
                  aria-labelledby={`${id}-${group.name}`}
                >
                  {group.values.map((value) => (
                    <Fragment key={value}>
                      {children(value, group.name === "pinned")}
                    </Fragment>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
          {/* On the page from the start: a region that arrives with its
              text already in it often isn't read. */}
          <div role="status" className="nuv-pinned-list__status">
            {message}
          </div>
        </div>
      </PinnedListContext.Provider>
    );
  },
);

export interface PinnedListItemOwnProps {
  /** The item's id, one of the list's `items`. */
  value: string;
  /**
   * The item's name, for its pin and for what a screen reader is told
   * when it moves.
   */
  label: string;
  /** What's in the item, beside its pin. */
  children?: ReactNode;
}

export interface PinnedListItemProps
  extends PinnedListItemOwnProps,
    Omit<LiHTMLAttributes<HTMLLIElement>, keyof PinnedListItemOwnProps> {}

const pin = "M6 2h4v5l2 2.5H4L6 7z";

/**
 * One item in a `PinnedList`: what you put in it, and a pin at its end.
 * It can hold links and buttons of its own.
 */
export const PinnedListItem = forwardRef<HTMLLIElement, PinnedListItemProps>(
  function PinnedListItem(
    { value, label, children, className, ...props },
    ref,
  ) {
    const context = useContext(PinnedListContext);
    if (!context) {
      throw new Error("PinnedListItem has to be inside a PinnedList.");
    }
    const pinned = context.pinned.has(value);

    return (
      <li
        ref={ref}
        className={cx("nuv-pinned-list__item", className)}
        data-pinned-list-key={itemKey(value)}
        data-state={pinned ? "pinned" : "unpinned"}
        {...props}
      >
        <div className="nuv-pinned-list__content">{children}</div>
        <button
          type="button"
          className="nuv-pinned-list__pin"
          aria-label={context.pinLabel(label)}
          aria-pressed={pinned}
          disabled={context.disabled}
          onClick={() => context.toggle(value, label)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Filled while it's pinned, so the state shows in the shape
                and not only in the color. */}
            <path d={pin} fill={pinned ? "currentColor" : "none"} />
            <path d="M8 9.5v4.5" />
          </svg>
        </button>
      </li>
    );
  },
);
