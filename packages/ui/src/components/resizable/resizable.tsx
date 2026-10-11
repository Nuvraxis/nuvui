"use client";

import { useComposedRefs } from "@radix-ui/react-compose-refs";
import {
  createContext,
  forwardRef,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Group,
  type GroupImperativeHandle,
  type GroupProps,
  type Layout,
  type LayoutChangedMeta,
  Panel,
  type PanelImperativeHandle,
  type PanelProps,
  type PanelSize,
  Separator,
  type SeparatorProps,
} from "react-resizable-panels";
import { cx } from "../../utils/cx";
import { useScrollRegion } from "../../utils/use-scroll-region";

// How wide the part of a handle that takes a press is, whatever is drawn.
// A finger gets the size every other control here has for one.
const target = { coarse: 44, fine: 10 };

// Whether the whole set is disabled, which each handle has to say for
// itself: the library stops them moving and leaves them looking usable.
const DisabledContext = createContext(false);

export interface ResizableOwnProps {
  /**
   * Which way the panels are set out: side by side, or one above another.
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
  /**
   * The size of each panel at first, by its `id`, as a share of 100. For
   * putting back sizes you saved. Without it each panel's `defaultSize`
   * is used.
   */
  defaultLayout?: Layout;
  /**
   * Called with every panel's size while they change: for each pixel of
   * a drag, many times a second.
   */
  onLayoutChange?: (layout: Layout) => void;
  /**
   * Called once the sizes have settled: when a drag ends, or a key is
   * pressed. This is the one to save from.
   */
  onLayoutChanged?: (layout: Layout, meta: LayoutChangedMeta) => void;
  /**
   * Panels that can't be resized. The handles stay where they are and
   * can't be moved or reached with Tab.
   * @default false
   */
  disabled?: boolean;
  /** A ref to read every panel's size from, and to set them. */
  groupRef?: Ref<GroupImperativeHandle | null>;
}

export interface ResizableProps
  extends ResizableOwnProps,
    Omit<GroupProps, keyof ResizableOwnProps | "elementRef"> {}

/**
 * Panels with a handle between them to drag. Put `ResizablePanel`s in it
 * with a `ResizableHandle` between each two. It fills what it's in, so
 * give that a height.
 */
export const Resizable = forwardRef<HTMLDivElement, ResizableProps>(
  function Resizable(
    {
      defaultLayout,
      onLayoutChanged,
      groupRef,
      disabled = false,
      className,
      ...props
    },
    ref,
  ) {
    const group = useRef<GroupImperativeHandle | null>(null);
    // Whether the sizes were there to begin with, and whether anyone has
    // changed them since.
    const late = useRef(defaultLayout === undefined);
    const touched = useRef(false);

    // Saved sizes can arrive after the panels are drawn: a page drawn on a
    // server doesn't have what the browser kept. They're put in place the
    // once, unless someone has resized the panels in the meantime.
    useLayoutEffect(() => {
      if (!late.current || defaultLayout === undefined) return;
      late.current = false;
      if (!touched.current) group.current?.setLayout(defaultLayout);
    }, [defaultLayout]);

    return (
      <DisabledContext.Provider value={disabled}>
        <Group
          elementRef={ref}
          disabled={disabled}
          groupRef={useComposedRefs(groupRef, group)}
          defaultLayout={defaultLayout}
          onLayoutChanged={(layout, meta) => {
            if (meta.isUserInteraction) touched.current = true;
            onLayoutChanged?.(layout, meta);
          }}
          resizeTargetMinimumSize={target}
          className={cx("nuv-resizable", className)}
          {...props}
        />
      </DisabledContext.Provider>
    );
  },
);

/** Where sizes are kept: the browser's storage, or anything shaped like it. */
export interface ResizableStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export interface UseResizableLayoutOptions {
  /** A name for these panels, which their sizes are kept under. */
  id: string;
  /**
   * Where to keep them. Anything with `getItem` and `setItem`.
   * @default localStorage
   */
  storage?: ResizableStorage;
}

// Nothing tells the page that storage has changed, and nothing needs to.
const never = () => () => {};

// What was kept, if it's sizes and nothing else.
function sizesFrom(kept: string | null): Layout | undefined {
  if (!kept) return undefined;
  try {
    const layout: unknown = JSON.parse(kept);
    if (
      layout &&
      typeof layout === "object" &&
      Object.values(layout).every((size) => typeof size === "number")
    ) {
      return layout as Layout;
    }
  } catch {
    // Not ours, or cut short. The panels start from their own sizes.
  }
  return undefined;
}

const sameSizes = (a: Layout, b: Layout) =>
  Object.keys(a).length === Object.keys(b).length &&
  Object.entries(a).every(
    ([id, size]) => Math.abs(size - (b[id] ?? Number.NaN)) < 0.01,
  );

/**
 * Keeps the sizes of a `Resizable`'s panels between visits. Give what it
 * returns to the `Resizable`, and give every panel an `id`.
 */
export function useResizableLayout({ id, storage }: UseResizableLayoutOptions) {
  const key = `nuv-resizable:${id}`;
  // Storage can be missing, on a server, or refused, in a private window.
  // Either way there's nothing saved.
  const read = () => {
    try {
      return (storage ?? localStorage).getItem(key);
    } catch {
      return null;
    }
  };
  // The browser's storage isn't there on a server, so the first draw in
  // the browser has to go without it too, to match. A storage of yours is
  // taken to say the same in both places, as a cookie would.
  const saved = useSyncExternalStore(never, read, storage ? read : () => null);

  const defaultLayout = useMemo(() => sizesFrom(saved), [saved]);
  // Whether the panels have got to what was kept, or someone has moved
  // them since.
  const caughtUp = useRef(false);

  const onLayoutChanged = useCallback(
    (layout: Layout, meta?: LayoutChangedMeta) => {
      // What was asked for, before a narrow window squeezed it: a wider
      // one should get it back.
      const sizes = meta?.requestedLayout ?? layout;
      try {
        const store = storage ?? localStorage;
        // The panels say their sizes as soon as they're drawn. On a page
        // from a server that's before they've been given the kept ones,
        // and keeping what they say would lose those.
        if (!caughtUp.current && !meta?.isUserInteraction) {
          const kept = sizesFrom(store.getItem(key));
          if (kept && !sameSizes(kept, sizes)) return;
        }
        caughtUp.current = true;
        store.setItem(key, JSON.stringify(sizes));
      } catch {
        // Missing, full, or refused. The sizes last as long as the page.
      }
    },
    [key, storage],
  );

  return { defaultLayout, onLayoutChanged };
}

export interface ResizablePanelOwnProps {
  /**
   * What the panel is known by in a layout. Give one to every panel whose
   * size you save or set.
   */
  id?: string;
  /**
   * The panel's size at first. A number is pixels, and a string is a
   * share of the whole (`"30%"`) or a length (`"20rem"`). Without it the
   * panels share the room equally.
   */
  defaultSize?: number | string;
  /**
   * The least it can be, written the same way.
   * @default "0%"
   */
  minSize?: number | string;
  /**
   * The most it can be.
   * @default "100%"
   */
  maxSize?: number | string;
  /**
   * Whether the panel folds away when it's dragged to well under its
   * `minSize`. Enter on the handle after it folds it and opens it again.
   * @default false
   */
  collapsible?: boolean;
  /**
   * How much of a folded panel is left showing.
   * @default "0%"
   */
  collapsedSize?: number | string;
  /** Called with the panel's size, in pixels and as a share, when it changes. */
  onResize?: (
    size: PanelSize,
    id: string | number | undefined,
    before: PanelSize | undefined,
  ) => void;
  /**
   * A ref to fold the panel and open it from, to resize it, and to ask
   * whether it's folded.
   */
  panelRef?: Ref<PanelImperativeHandle | null>;
  /**
   * A panel that keeps its size, whatever is dragged.
   * @default false
   */
  disabled?: boolean;
}

export interface ResizablePanelProps
  extends ResizablePanelOwnProps,
    Omit<PanelProps, keyof ResizablePanelOwnProps | "elementRef"> {}

/**
 * One panel of a `Resizable`. It scrolls what doesn't fit. `className` goes
 * on the box around its content, and `ref` on the box that's sized.
 */
export const ResizablePanel = forwardRef<HTMLDivElement, ResizablePanelProps>(
  function ResizablePanel(
    {
      "aria-label": label,
      "aria-labelledby": labelledBy,
      onResize,
      className,
      ...props
    },
    ref,
  ) {
    const [outer, setOuter] = useState<HTMLDivElement | null>(null);
    // The box around the content, which is the one that scrolls. The
    // library draws it and takes no props for it but a class and a style.
    const content = (outer?.firstElementChild ?? null) as HTMLElement | null;
    const region = useScrollRegion(content);
    const [folded, setFolded] = useState(false);

    useEffect(() => {
      if (!content) return;
      const set = (name: string, value: string | number | undefined) =>
        value === undefined
          ? content.removeAttribute(name)
          : content.setAttribute(name, String(value));
      // A panel folded to nothing still has everything in it. Out of
      // sight, it's put out of reach of Tab and of a screen reader too.
      content.toggleAttribute("inert", folded);
      // A panel that scrolls and holds nothing to focus has to take focus
      // itself, or it can't be scrolled from the keyboard. That's when a
      // name belongs on it too.
      const stop = !folded && region.tabIndex === 0;
      set("tabindex", stop ? 0 : undefined);
      set("role", stop ? region.role : undefined);
      set("aria-label", stop ? (label ?? region["aria-label"]) : undefined);
      set(
        "aria-labelledby",
        stop ? (labelledBy ?? region["aria-labelledby"]) : undefined,
      );
    }, [content, region, folded, label, labelledBy]);

    return (
      <Panel
        elementRef={useComposedRefs(ref, setOuter)}
        onResize={(size, id, before) => {
          setFolded(size.inPixels === 0);
          onResize?.(size, id, before);
        }}
        className={cx("nuv-resizable__panel", className)}
        {...props}
      />
    );
  },
);

export interface ResizableHandleOwnProps {
  /**
   * Whether the handle shows a grip: a mark in the middle of the line
   * that says it can be dragged.
   * @default false
   */
  withGrip?: boolean;
  /**
   * A handle that can't be moved. The panels either side can still change
   * size when another handle is.
   * @default false
   */
  disabled?: boolean;
  /**
   * What a screen reader calls the handle. Say what it resizes when the
   * page has more than one.
   * @default "Resize"
   */
  "aria-label"?: string;
  /** Something of yours in place of the grip. */
  children?: ReactNode;
}

export interface ResizableHandleProps
  extends ResizableHandleOwnProps,
    Omit<SeparatorProps, keyof ResizableHandleOwnProps | "elementRef"> {}

/**
 * The line between two panels. Drag it, or give it focus and use the
 * arrow keys. It says the size of the panel before it, as a share of 100.
 */
export const ResizableHandle = forwardRef<HTMLDivElement, ResizableHandleProps>(
  function ResizableHandle(
    {
      withGrip = false,
      disabled,
      "aria-label": label,
      "aria-labelledby": labelledBy,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const all = useContext(DisabledContext);
    return (
      <Separator
        elementRef={ref}
        disabled={disabled || all}
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? label : (label ?? "Resize")}
        className={cx("nuv-resizable__handle", className)}
        {...props}
      >
        {children ??
          (withGrip ? (
            <span className="nuv-resizable__grip" aria-hidden="true">
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                width="12"
                height="12"
                fill="currentColor"
              >
                <circle cx="6" cy="3.5" r="1.25" />
                <circle cx="10" cy="3.5" r="1.25" />
                <circle cx="6" cy="8" r="1.25" />
                <circle cx="10" cy="8" r="1.25" />
                <circle cx="6" cy="12.5" r="1.25" />
                <circle cx="10" cy="12.5" r="1.25" />
              </svg>
            </span>
          ) : null)}
      </Separator>
    );
  },
);
