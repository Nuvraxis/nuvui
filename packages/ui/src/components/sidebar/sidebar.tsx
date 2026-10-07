"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Slot } from "@radix-ui/react-slot";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  createContext,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useDirection } from "../../direction/direction";
import { cx } from "../../utils/cx";
import { useShortcut } from "../../utils/use-shortcut";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip/tooltip";

// The md breakpoint, which is where the stylesheet starts showing the
// sidebar in the page. Below it the sidebar is a panel over the page.
const desktop = "(min-width: 48rem)";

function subscribeToWidth(onChange: () => void) {
  const query = window.matchMedia(desktop);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// On the server the width isn't known. It renders as a desktop, and the
// stylesheet keeps that out of sight on a phone until this has run there.
function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribeToWidth,
    () => !window.matchMedia(desktop).matches,
    () => false,
  );
}

function readCookie(name: string): boolean | undefined {
  const prefix = `${encodeURIComponent(name)}=`;
  const found = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));
  if (!found) return undefined;
  return found.slice(prefix.length) !== "false";
}

function writeCookie(name: string, open: boolean) {
  // A year. It's a preference, with nothing in it that identifies anyone.
  // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API isn't in Firefox or Safari
  document.cookie = `${encodeURIComponent(name)}=${open}; path=/; max-age=31536000; SameSite=Lax`;
}

export interface SidebarContextValue {
  /** Whether the sidebar in the page is expanded or collapsed. */
  state: "expanded" | "collapsed";
  /** Whether the sidebar in the page is expanded. */
  open: boolean;
  /** Expands or collapses the sidebar in the page, and remembers it. */
  setOpen: (open: boolean) => void;
  /** Whether the panel that stands in for the sidebar on a phone is open. */
  openMobile: boolean;
  /** Opens or closes that panel. Nothing is remembered. */
  setOpenMobile: (open: boolean) => void;
  /** Whether the screen is narrow enough for that panel to be in use. */
  isMobile: boolean;
  /** Opens or closes whichever of the two is in use. */
  toggleSidebar: () => void;
}

interface InternalContextValue extends SidebarContextValue {
  /** False until a remembered state has been applied, so that isn't animated. */
  animated: boolean;
  /** What gets focus back when the panel on a phone closes. */
  returnFocus: { current: HTMLElement | null };
}

const SidebarContext = createContext<InternalContextValue | null>(null);

function useInternal(part: string): InternalContextValue {
  const sidebar = useContext(SidebarContext);
  if (!sidebar) throw new Error(`${part} has to be inside a SidebarProvider.`);
  return sidebar;
}

/** The sidebar's state, and the functions that change it. */
export function useSidebar(): SidebarContextValue {
  const {
    animated: _animated,
    returnFocus: _returnFocus,
    ...sidebar
  } = useInternal("useSidebar");
  return sidebar;
}

export interface SidebarProviderOwnProps {
  /** Whether the sidebar is expanded, when you control it. */
  open?: boolean;
  /**
   * Whether the sidebar starts expanded, when you don't control it. On a
   * server, read the cookie and pass what it says, so the page arrives in
   * the state it was left in.
   * @default true
   */
  defaultOpen?: boolean;
  /** Called when the sidebar expands or collapses. */
  onOpenChange?: (open: boolean) => void;
  /**
   * The cookie the state is remembered in, as `true` or `false`. Pass `null`
   * to store nothing.
   * @default "nuv-sidebar"
   */
  cookieName?: string | null;
  /**
   * A key that expands and collapses the sidebar when pressed with Ctrl, or
   * with Command on a Mac. Pass `null` for no shortcut.
   * @default "b"
   */
  shortcut?: string | null;
}

export interface SidebarProviderProps
  extends SidebarProviderOwnProps,
    HTMLAttributes<HTMLDivElement> {}

/**
 * Holds the sidebar's state, and lays the sidebar and the page out side by
 * side. Put the `Sidebar` and a `SidebarMain` inside it.
 */
export const SidebarProvider = forwardRef<HTMLDivElement, SidebarProviderProps>(
  function SidebarProvider(
    {
      open: openProp,
      defaultOpen = true,
      onOpenChange,
      cookieName = "nuv-sidebar",
      shortcut = "b",
      className,
      ...props
    },
    ref,
  ) {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = useState(false);
    const [animated, setAnimated] = useState(false);
    const returnFocus = useRef<HTMLElement | null>(null);
    const [open, setOpenState] = useControllableState({
      prop: openProp,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
      caller: "SidebarProvider",
    });

    const setOpen = useCallback(
      (next: boolean) => {
        setOpenState(next);
        if (cookieName) writeCookie(cookieName, next);
      },
      [setOpenState, cookieName],
    );

    // What was remembered, for a page whose server didn't read the cookie.
    // Only once, and only when the state is this component's to set.
    const controlled = openProp !== undefined;
    // biome-ignore lint/correctness/useExhaustiveDependencies: runs once, on purpose
    useEffect(() => {
      if (cookieName && !controlled) {
        const remembered = readCookie(cookieName);
        if (remembered !== undefined) setOpenState(remembered);
      }
      // A frame later, so the change above is drawn without a transition.
      const frame = requestAnimationFrame(() => setAnimated(true));
      return () => cancelAnimationFrame(frame);
    }, []);

    // A panel left open on a phone shouldn't be waiting, still open, the
    // next time the screen is that narrow.
    useEffect(() => {
      if (!isMobile) setOpenMobile(false);
    }, [isMobile]);

    const toggleSidebar = useCallback(() => {
      if (isMobile) setOpenMobile((current) => !current);
      else setOpen(!open);
    }, [isMobile, open, setOpen]);
    useShortcut(shortcut, toggleSidebar);

    const sidebar = useMemo<InternalContextValue>(
      () => ({
        state: open ? "expanded" : "collapsed",
        open,
        setOpen,
        openMobile,
        setOpenMobile,
        isMobile,
        toggleSidebar,
        animated,
        returnFocus,
      }),
      [open, setOpen, openMobile, isMobile, toggleSidebar, animated],
    );

    return (
      <SidebarContext.Provider value={sidebar}>
        <div
          ref={ref}
          className={cx("nuv-sidebar-layout", className)}
          {...props}
        />
      </SidebarContext.Provider>
    );
  },
);

// The side of the sidebar a part is in, while that sidebar is down to its
// strip of icons. Null the rest of the time.
const RailContext = createContext<"start" | "end" | null>(null);

export interface SidebarOwnProps {
  /**
   * The edge of the screen the sidebar is on. `"start"` is the left edge in
   * a left-to-right layout and the right edge in a right-to-left one. Put
   * the sidebar before or after `SidebarMain` to match.
   * @default "start"
   */
  side?: "start" | "end";
  /**
   * What collapsing does. `"icon"` leaves a strip of icons, `"offcanvas"`
   * takes the sidebar off the screen, and with `"none"` it can't be
   * collapsed. On a phone it's a panel over the page whichever this is.
   * @default "icon"
   */
  collapsible?: "icon" | "offcanvas" | "none";
  /**
   * The sidebar's name, for screen readers: of the navigation landmark it
   * is in the page, and of the panel it becomes on a phone. Translate it
   * with the rest of your interface.
   * @default "Sidebar"
   */
  label?: string;
  /**
   * Accessible name of the button that closes that panel. Translate it with
   * the rest of your interface.
   * @default "Close"
   */
  closeLabel?: string;
  /**
   * The element the panel is rendered into on a phone. Set this when it
   * should pick up a `data-theme` from a section of the page.
   * @default document.body
   */
  container?: DialogPrimitive.DialogPortalProps["container"];
}

export interface SidebarProps
  extends SidebarOwnProps,
    HTMLAttributes<HTMLElement> {}

/**
 * The sidebar. In the page it's a `nav` element, so everything in it is
 * inside a landmark with a name. On a phone it's a dialog.
 */
export const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  {
    side = "start",
    collapsible = "icon",
    label = "Sidebar",
    closeLabel = "Close",
    container,
    className,
    children,
    ...props
  },
  ref,
) {
  const sidebar = useInternal("Sidebar");

  if (sidebar.isMobile) {
    return (
      <DialogPrimitive.Root
        open={sidebar.openMobile}
        onOpenChange={sidebar.setOpenMobile}
      >
        <DialogPrimitive.Portal container={container}>
          <DialogPrimitive.Overlay className="nuv-sidebar__overlay" />
          <DialogPrimitive.Content
            ref={ref as React.Ref<HTMLDivElement>}
            className={cx(
              "nuv-sidebar",
              `nuv-sidebar--${side}`,
              "nuv-sidebar--mobile",
              className,
            )}
            // Radix asks for a description, or for this to say there's
            // none.
            aria-describedby={undefined}
            // Radix's dialog gives focus back to its own trigger part, and
            // this one is opened from elsewhere, so it would be left on the
            // page as a whole. What had focus before gets it back. Safari
            // doesn't give a button focus when it's clicked, which is why
            // the trigger also says it was the one used.
            onOpenAutoFocus={() => {
              const active = document.activeElement;
              if (active instanceof HTMLElement && active !== document.body) {
                sidebar.returnFocus.current = active;
              }
            }}
            onCloseAutoFocus={() => {
              const element = sidebar.returnFocus.current;
              sidebar.returnFocus.current = null;
              if (element?.isConnected) element.focus();
            }}
            {...props}
          >
            <DialogPrimitive.Title className="nuv-sidebar__title">
              {label}
            </DialogPrimitive.Title>
            <div className="nuv-sidebar__bar">
              <DialogPrimitive.Close
                className="nuv-sidebar__close"
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
              </DialogPrimitive.Close>
            </div>
            {children}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  const collapsed = collapsible !== "none" && !sidebar.open;
  const rail = collapsed && collapsible === "icon";

  return (
    <nav
      ref={ref}
      aria-label={label}
      className={cx(
        "nuv-sidebar",
        `nuv-sidebar--${side}`,
        rail && "nuv-sidebar--rail",
        collapsed && collapsible === "offcanvas" && "nuv-sidebar--hidden",
        className,
      )}
      data-state={collapsed ? "collapsed" : "expanded"}
      data-animated={sidebar.animated ? "" : undefined}
      {...props}
    >
      <RailContext.Provider value={rail ? side : null}>
        {children}
      </RailContext.Provider>
    </nav>
  );
});

export interface SidebarTriggerOwnProps {
  /**
   * Accessible name of the button. Translate it with the rest of your
   * interface.
   * @default "Toggle sidebar"
   */
  label?: string;
  /**
   * Render the single child element instead of the built-in button, and
   * give it the button's props. Use it to make a `Button` the trigger.
   * @default false
   */
  asChild?: boolean;
}

export interface SidebarTriggerProps
  extends SidebarTriggerOwnProps,
    ButtonHTMLAttributes<HTMLButtonElement> {}

/** A button that expands and collapses the sidebar. */
export const SidebarTrigger = forwardRef<
  HTMLButtonElement,
  SidebarTriggerProps
>(function SidebarTrigger(
  {
    label = "Toggle sidebar",
    asChild = false,
    className,
    onClick,
    children,
    ...props
  },
  ref,
) {
  const sidebar = useInternal("SidebarTrigger");
  const expanded = sidebar.isMobile ? sidebar.openMobile : sidebar.open;
  const shared = {
    ref,
    "aria-expanded": expanded,
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      sidebar.returnFocus.current = event.currentTarget;
      sidebar.toggleSidebar();
    },
    ...props,
  };

  if (asChild) {
    return (
      <Slot className={className} {...shared}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      className={cx("nuv-sidebar__trigger", className)}
      {...shared}
    >
      {children ?? (
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
          <rect x="2" y="2.75" width="12" height="10.5" rx="2" />
          <path d="M6 2.75v10.5" />
        </svg>
      )}
    </button>
  );
});

export interface SidebarMainOwnProps {
  /**
   * Render the single child element instead of a `main`, and give it the
   * class and props. A page has one `main` element, so use this when yours
   * is somewhere else.
   * @default false
   */
  asChild?: boolean;
}

export interface SidebarMainProps
  extends SidebarMainOwnProps,
    HTMLAttributes<HTMLElement> {}

/** The page next to the sidebar. It renders a `main` element. */
export const SidebarMain = forwardRef<HTMLElement, SidebarMainProps>(
  function SidebarMain({ asChild = false, className, ...props }, ref) {
    const Element = asChild ? Slot : "main";
    return (
      <Element
        ref={ref}
        className={cx("nuv-sidebar-layout__main", className)}
        {...props}
      />
    );
  },
);

export type SidebarHeaderProps = HTMLAttributes<HTMLDivElement>;

/** Stays at the top of the sidebar while the content under it scrolls. */
export const SidebarHeader = forwardRef<HTMLDivElement, SidebarHeaderProps>(
  function SidebarHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-sidebar__header", className)}
        {...props}
      />
    );
  },
);

export type SidebarFooterProps = HTMLAttributes<HTMLDivElement>;

/** Stays at the bottom of the sidebar. */
export const SidebarFooter = forwardRef<HTMLDivElement, SidebarFooterProps>(
  function SidebarFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-sidebar__footer", className)}
        {...props}
      />
    );
  },
);

export type SidebarContentProps = HTMLAttributes<HTMLDivElement>;

/** The part between the header and the footer. It scrolls when it's long. */
export const SidebarContent = forwardRef<HTMLDivElement, SidebarContentProps>(
  function SidebarContent({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-sidebar__content", className)}
        {...props}
      />
    );
  },
);

export type SidebarSeparatorProps = HTMLAttributes<HTMLDivElement>;

export const SidebarSeparator = forwardRef<
  HTMLDivElement,
  SidebarSeparatorProps
>(function SidebarSeparator({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cx("nuv-sidebar__separator", className)}
      {...props}
    />
  );
});

interface GroupContextValue {
  labelId: string;
  setLabelled: (labelled: boolean) => void;
}

const GroupContext = createContext<GroupContextValue | null>(null);

export type SidebarGroupProps = HTMLAttributes<HTMLDivElement>;

/** A set of menu items, with a `SidebarGroupLabel` over them if they need one. */
export const SidebarGroup = forwardRef<HTMLDivElement, SidebarGroupProps>(
  function SidebarGroup({ className, ...props }, ref) {
    const labelId = useId();
    const [labelled, setLabelled] = useState(false);
    const group = useMemo(() => ({ labelId, setLabelled }), [labelId]);

    return (
      <GroupContext.Provider value={group}>
        <div
          ref={ref}
          // A group with a label is one to a screen reader as well. Without
          // a label there'd be nothing to call it.
          {...(labelled ? { role: "group", "aria-labelledby": labelId } : null)}
          className={cx("nuv-sidebar__group", className)}
          {...props}
        />
      </GroupContext.Provider>
    );
  },
);

export type SidebarGroupLabelProps = HTMLAttributes<HTMLDivElement>;

export const SidebarGroupLabel = forwardRef<
  HTMLDivElement,
  SidebarGroupLabelProps
>(function SidebarGroupLabel({ className, ...props }, ref) {
  const group = useContext(GroupContext);
  const setLabelled = group?.setLabelled;
  useEffect(() => {
    setLabelled?.(true);
    return () => setLabelled?.(false);
  }, [setLabelled]);

  return (
    <div
      ref={ref}
      id={group?.labelId}
      className={cx("nuv-sidebar__group-label", className)}
      {...props}
    />
  );
});

export type SidebarMenuProps = HTMLAttributes<HTMLUListElement>;

/** A list of items. It renders a `ul`. */
export const SidebarMenu = forwardRef<HTMLUListElement, SidebarMenuProps>(
  function SidebarMenu({ className, ...props }, ref) {
    return (
      <ul ref={ref} className={cx("nuv-sidebar__menu", className)} {...props} />
    );
  },
);

export type SidebarMenuItemProps = HTMLAttributes<HTMLLIElement>;

export const SidebarMenuItem = forwardRef<HTMLLIElement, SidebarMenuItemProps>(
  function SidebarMenuItem({ className, ...props }, ref) {
    return (
      <li
        ref={ref}
        className={cx("nuv-sidebar__menu-item", className)}
        {...props}
      />
    );
  },
);

export interface SidebarMenuButtonOwnProps {
  /**
   * Marks the item as the page that's open. It's drawn differently, and a
   * screen reader calls it the current page.
   * @default false
   */
  active?: boolean;
  /**
   * Shown next to the button while the sidebar is down to its icons, where
   * the button's text is out of sight. Usually the same text.
   */
  tooltip?: ReactNode;
  /**
   * Render the single child element instead of a `button`, and give it the
   * button's classes and props. This is how you make an item a link.
   * @default false
   */
  asChild?: boolean;
}

export interface SidebarMenuButtonProps
  extends SidebarMenuButtonOwnProps,
    ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * An item's button or link. Put the icon first and the text after it: the
 * icon is what's left when the sidebar collapses.
 */
export const SidebarMenuButton = forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps
>(function SidebarMenuButton(
  { active = false, tooltip, asChild = false, className, type, ...props },
  ref,
) {
  const sidebar = useInternal("SidebarMenuButton");
  const direction = useDirection();
  const [hinted, setHinted] = useState(false);
  const rail = useContext(RailContext);

  const Element = asChild ? Slot : "button";
  const button = (
    <Element
      ref={ref}
      // The HTML default is "submit", which fires a surrounding form.
      type={asChild ? undefined : (type ?? "button")}
      aria-current={active ? "page" : undefined}
      data-active={active ? "" : undefined}
      className={cx("nuv-sidebar__menu-button", className)}
      {...props}
    />
  );

  if (tooltip === undefined || tooltip === null || tooltip === false) {
    return button;
  }

  // The tooltip is always in the tree and only opens on the strip of icons.
  // Adding and removing it would make the button a new element each time
  // the sidebar collapsed, and a new element doesn't have the focus the old
  // one had.
  const towardsPage =
    (rail ?? "start") === "start"
      ? direction === "rtl"
        ? "left"
        : "right"
      : direction === "rtl"
        ? "right"
        : "left";

  return (
    <Tooltip
      open={hinted && rail !== null && !sidebar.isMobile}
      onOpenChange={setHinted}
    >
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side={towardsPage}>{tooltip}</TooltipContent>
    </Tooltip>
  );
});

export type SidebarMenuBadgeProps = HTMLAttributes<HTMLSpanElement>;

/** A count or a short note at the end of an item's row. */
export const SidebarMenuBadge = forwardRef<
  HTMLSpanElement,
  SidebarMenuBadgeProps
>(function SidebarMenuBadge({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      className={cx("nuv-sidebar__menu-badge", className)}
      {...props}
    />
  );
});

export type SidebarMenuSubProps = HTMLAttributes<HTMLUListElement>;

/** A list of pages under an item. It's hidden on the strip of icons. */
export const SidebarMenuSub = forwardRef<HTMLUListElement, SidebarMenuSubProps>(
  function SidebarMenuSub({ className, ...props }, ref) {
    return (
      <ul
        ref={ref}
        className={cx("nuv-sidebar__menu-sub", className)}
        {...props}
      />
    );
  },
);

export type SidebarMenuSubItemProps = HTMLAttributes<HTMLLIElement>;

export const SidebarMenuSubItem = forwardRef<
  HTMLLIElement,
  SidebarMenuSubItemProps
>(function SidebarMenuSubItem({ className, ...props }, ref) {
  return (
    <li
      ref={ref}
      className={cx("nuv-sidebar__menu-sub-item", className)}
      {...props}
    />
  );
});

export interface SidebarMenuSubButtonOwnProps {
  /**
   * Marks the item as the page that's open.
   * @default false
   */
  active?: boolean;
  /**
   * Render the single child element instead of a link, and give it the
   * link's classes and props. Use it for your router's link.
   * @default false
   */
  asChild?: boolean;
}

export interface SidebarMenuSubButtonProps
  extends SidebarMenuSubButtonOwnProps,
    AnchorHTMLAttributes<HTMLAnchorElement> {}

/** A link in a `SidebarMenuSub`. */
export const SidebarMenuSubButton = forwardRef<
  HTMLAnchorElement,
  SidebarMenuSubButtonProps
>(function SidebarMenuSubButton(
  { active = false, asChild = false, className, ...props },
  ref,
) {
  const Element = asChild ? Slot : "a";
  return (
    <Element
      ref={ref}
      aria-current={active ? "page" : undefined}
      data-active={active ? "" : undefined}
      className={cx("nuv-sidebar__menu-sub-button", className)}
      {...props}
    />
  );
});
