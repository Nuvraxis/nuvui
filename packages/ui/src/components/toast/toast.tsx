"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
  type ReactNode,
  useSyncExternalStore,
} from "react";
import { cx } from "../../utils/cx";

export interface ToastAction {
  /** The text on the button. */
  label: ReactNode;
  /**
   * Another way to do the same thing, for screen reader users, who may not
   * reach the button before the toast has gone. For example "Undo with
   * Ctrl+Z".
   */
  altText: string;
  /** Called when the button is pressed. The toast closes afterwards. */
  onClick: () => void;
}

export interface ToastOptions {
  /**
   * Pass the id of a toast that's already showing to replace it instead of
   * adding another.
   */
  id?: string;
  /** A second line under the title. */
  description?: ReactNode;
  /**
   * Colors the toast's edge. A `"danger"` toast also interrupts a screen
   * reader to be read out at once. The others wait until it's quiet.
   * @default "neutral"
   */
  intent?: "neutral" | "success" | "danger";
  /**
   * How long the toast stays, in milliseconds. `Infinity` keeps it until
   * it's dismissed. Without this, the Toaster's `duration` applies.
   */
  duration?: number;
  /** A button in the toast, such as "Undo". */
  action?: ToastAction;
}

interface ToastEntry extends ToastOptions {
  id: string;
  title: ReactNode;
  open: boolean;
}

interface Store {
  toasts: readonly ToastEntry[];
  listeners: Set<() => void>;
  count: number;
}

// The package ships as both ESM and CommonJS, and one app can end up loading
// both. Keeping the list on globalThis means toast() from one copy still
// reaches a Toaster from the other.
const storeKey = Symbol.for("@nuvui/react/toast");

function getStore(): Store {
  const scope = globalThis as unknown as Record<symbol, Store | undefined>;
  let store = scope[storeKey];
  if (!store) {
    store = { toasts: [], listeners: new Set(), count: 0 };
    scope[storeKey] = store;
  }
  return store;
}

function update(toasts: readonly ToastEntry[]) {
  const store = getStore();
  store.toasts = toasts;
  for (const listener of store.listeners) listener();
}

function subscribe(listener: () => void) {
  const { listeners } = getStore();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => getStore().toasts;
const noToasts: readonly ToastEntry[] = [];
const getServerSnapshot = () => noToasts;

// A closed toast stays in the list this long, so its exit animation can
// finish before it's removed.
const removeDelay = 1000;

function close(id: string) {
  const { toasts } = getStore();
  if (!toasts.some((item) => item.id === id && item.open)) return;

  update(
    toasts.map((item) => (item.id === id ? { ...item, open: false } : item)),
  );
  setTimeout(() => {
    // Kept if it was shown again under the same id in the meantime.
    update(getStore().toasts.filter((item) => item.id !== id || item.open));
  }, removeDelay);
}

function show(title: ReactNode, options: ToastOptions = {}): string {
  // There's nowhere to show a toast during a server render, and a list kept
  // on the server would be shared between requests.
  if (typeof window === "undefined") return options.id ?? "";

  const store = getStore();
  store.count += 1;
  const id = options.id ?? `nuv-toast-${store.count}`;
  const entry: ToastEntry = { ...options, id, title, open: true };

  update(
    store.toasts.some((item) => item.id === id)
      ? store.toasts.map((item) => (item.id === id ? entry : item))
      : [...store.toasts, entry],
  );
  return id;
}

function dismiss(id?: string) {
  const store = getStore();
  const matches = (item: ToastEntry) => id === undefined || item.id === id;

  // With no Toaster on the page there's no exit animation to wait for.
  if (store.listeners.size === 0) {
    update(store.toasts.filter((item) => !matches(item)));
    return;
  }
  for (const item of store.toasts.filter(matches)) close(item.id);
}

export interface ToastFunction {
  /**
   * Shows a toast and returns its id. There has to be a `<Toaster />`
   * somewhere on the page to show it in.
   */
  (title: ReactNode, options?: ToastOptions): string;
  /** Closes the toast with this id. With no id, closes all of them. */
  dismiss: (id?: string) => void;
}

export const toast: ToastFunction = Object.assign(show, { dismiss });

type ViewportProps = ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>;

export interface ToasterOwnProps {
  /**
   * Where toasts appear once the screen is at least 40rem wide. On a
   * narrower screen they span its width, and only the top or bottom part of
   * this applies.
   * @default "bottom-end"
   */
  position?:
    | "top-start"
    | "top-center"
    | "top-end"
    | "bottom-start"
    | "bottom-center"
    | "bottom-end";
  /**
   * How long a toast stays, in milliseconds, unless it sets its own.
   * @default 5000
   */
  duration?: number;
  /**
   * Accessible name of the close button on each toast. Translate it with
   * the rest of your interface.
   * @default "Close"
   */
  closeLabel?: string;
  /**
   * What a screen reader says before the text of each toast. Translate it
   * with the rest of your interface.
   * @default "Notification"
   */
  toastLabel?: string;
  /**
   * The direction a toast is swiped in to dismiss it.
   * @default "right"
   */
  swipeDirection?: ToastPrimitive.ToastProviderProps["swipeDirection"];
}

export interface ToasterProps extends ToasterOwnProps, ViewportProps {}

export const Toaster = forwardRef<
  ElementRef<typeof ToastPrimitive.Viewport>,
  ToasterProps
>(function Toaster(
  {
    position = "bottom-end",
    duration = 5000,
    closeLabel = "Close",
    toastLabel = "Notification",
    swipeDirection = "right",
    className,
    ...props
  },
  ref,
) {
  const toasts = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [block, inline] = position.split("-");

  return (
    <ToastPrimitive.Provider
      duration={duration}
      label={toastLabel}
      swipeDirection={swipeDirection}
    >
      {toasts.map(({ id, title, description, intent, action, ...item }) => (
        <ToastPrimitive.Root
          key={id}
          className={cx("nuv-toast", `nuv-toast--${intent ?? "neutral"}`)}
          open={item.open}
          duration={item.duration}
          // Radix reads a "foreground" toast out at once and leaves a
          // "background" one until the screen reader is idle.
          type={intent === "danger" ? "foreground" : "background"}
          onOpenChange={(open) => {
            if (!open) close(id);
          }}
        >
          <div className="nuv-toast__content">
            <ToastPrimitive.Title className="nuv-toast__title">
              {title}
            </ToastPrimitive.Title>
            {description ? (
              <ToastPrimitive.Description className="nuv-toast__description">
                {description}
              </ToastPrimitive.Description>
            ) : null}
          </div>
          {action ? (
            <ToastPrimitive.Action
              className="nuv-toast__action"
              altText={action.altText}
              onClick={action.onClick}
            >
              {action.label}
            </ToastPrimitive.Action>
          ) : null}
          <ToastPrimitive.Close
            className="nuv-toast__close"
            aria-label={closeLabel}
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
            >
              <path d="M3.5 3.5l9 9m0-9l-9 9" />
            </svg>
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport
        ref={ref}
        className={cx(
          "nuv-toaster",
          `nuv-toaster--${block}`,
          `nuv-toaster--${inline}`,
          className,
        )}
        {...props}
      />
    </ToastPrimitive.Provider>
  );
});
