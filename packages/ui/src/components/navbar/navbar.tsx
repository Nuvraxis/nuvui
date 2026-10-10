"use client";

import { useComposedRefs } from "@radix-ui/react-compose-refs";
import { Slot } from "@radix-ui/react-slot";
import {
  type AnchorHTMLAttributes,
  createContext,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../sheet/sheet";

type Collapse = "sm" | "md" | "lg";

// The same widths as the stylesheet's breakpoints, which a script can't
// read from it.
const widths: Record<Collapse, string> = {
  sm: "(min-width: 40rem)",
  md: "(min-width: 48rem)",
  lg: "(min-width: 64rem)",
};

const CollapseContext = createContext<Collapse | null>(null);

// How far the page has to move before the bar answers, in pixels. A page
// that settles by a pixel or two shouldn't make it come and go.
const nudge = 8;

export interface NavbarOwnProps {
  /**
   * Keeps the bar at the top of the window while the page scrolls under
   * it.
   * @default false
   */
  sticky?: boolean;
  /**
   * Slides the bar out of the way while the page scrolls down, and brings
   * it back as soon as it scrolls up. It stays while focus is inside it.
   * The bar is sticky when this is on.
   * @default false
   */
  hideOnScroll?: boolean;
  /**
   * The breakpoint below which `NavbarNav` is hidden and the button of
   * `NavbarMenu` is shown: 40, 48 or 64rem.
   * @default "md"
   */
  collapse?: Collapse;
}

export interface NavbarProps
  extends NavbarOwnProps,
    HTMLAttributes<HTMLElement> {}

/**
 * The bar across the top of a site or an app: a name, the main links, and
 * a few actions. On a narrow screen the links move into a panel behind a
 * button.
 */
export const Navbar = forwardRef<HTMLElement, NavbarProps>(function Navbar(
  {
    sticky = false,
    hideOnScroll = false,
    collapse = "md",
    className,
    ...props
  },
  ref,
) {
  const bar = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!hideOnScroll) {
      setHidden(false);
      return;
    }
    let last = window.scrollY;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const now = window.scrollY;
      // Near the top there's nothing to make room for.
      if (now <= (bar.current?.offsetHeight ?? 0)) setHidden(false);
      else if (now > last + nudge) setHidden(true);
      else if (now < last - nudge) setHidden(false);
      else return;
      last = now;
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
    };
  }, [hideOnScroll]);

  return (
    <CollapseContext.Provider value={collapse}>
      <header
        ref={useComposedRefs(ref, bar)}
        data-hidden={hidden ? "" : undefined}
        className={cx(
          "nuv-navbar",
          `nuv-navbar--collapse-${collapse}`,
          (sticky || hideOnScroll) && "nuv-navbar--sticky",
          className,
        )}
        {...props}
      />
    </CollapseContext.Provider>
  );
});

export type NavbarBrandProps = HTMLAttributes<HTMLDivElement>;

/** The name or the logo, at the start of the bar. Put a link in it. */
export const NavbarBrand = forwardRef<HTMLDivElement, NavbarBrandProps>(
  function NavbarBrand({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-navbar__brand", className)}
        {...props}
      />
    );
  },
);

export interface NavbarNavOwnProps {
  /**
   * Render the single child element instead of a `nav`, and give it this
   * part's classes and props. For a child that's a `nav` already, such as
   * a `NavigationMenu`.
   * @default false
   */
  asChild?: boolean;
}

export interface NavbarNavProps
  extends NavbarNavOwnProps,
    HTMLAttributes<HTMLElement> {}

/**
 * The main links, in the bar. A `nav`, so give it a name. It's hidden
 * below the bar's `collapse` breakpoint, where `NavbarMenu` has the links.
 */
export const NavbarNav = forwardRef<HTMLElement, NavbarNavProps>(
  function NavbarNav({ asChild = false, className, ...props }, ref) {
    const Element = asChild ? Slot : "nav";
    return (
      <Element
        ref={ref}
        className={cx("nuv-navbar__nav", className)}
        {...props}
      />
    );
  },
);

export type NavbarActionsProps = HTMLAttributes<HTMLDivElement>;

/** What's at the far end of the bar at every width: buttons, a menu. */
export const NavbarActions = forwardRef<HTMLDivElement, NavbarActionsProps>(
  function NavbarActions({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx("nuv-navbar__actions", className)}
        {...props}
      />
    );
  },
);

export interface NavbarLinkOwnProps {
  /**
   * Marks the link as the page that's open. A screen reader says so, and
   * the link is drawn stronger and underlined.
   * @default false
   */
  current?: boolean;
  /**
   * Render the single child element instead of an `a`, and give it the
   * link's classes and props. This is how you use your router's link.
   * @default false
   */
  asChild?: boolean;
}

export interface NavbarLinkProps
  extends NavbarLinkOwnProps,
    AnchorHTMLAttributes<HTMLAnchorElement> {}

/** A link in `NavbarNav`, or in the panel of `NavbarMenu`. */
export const NavbarLink = forwardRef<HTMLAnchorElement, NavbarLinkProps>(
  function NavbarLink(
    { current = false, asChild = false, className, ...props },
    ref,
  ) {
    const Element = asChild ? Slot : "a";
    return (
      <Element
        ref={ref}
        aria-current={current ? "page" : undefined}
        className={cx("nuv-navbar__link", className)}
        {...props}
      />
    );
  },
);

export interface NavbarMenuOwnProps {
  /**
   * Accessible name of the button, and the title of the panel it opens.
   * Translate it with the rest of your interface.
   * @default "Menu"
   */
  label?: string;
  /**
   * Accessible name of the button that closes the panel. Translate it
   * with the rest of your interface.
   * @default "Close"
   */
  closeLabel?: string;
  /**
   * The edge of the screen the panel is attached to.
   * @default "end"
   */
  side?: "start" | "end";
  /** What's in the panel: the links, and anything else. */
  children?: ReactNode;
}

export type NavbarMenuProps = NavbarMenuOwnProps;

/**
 * The button that's in the bar below its `collapse` breakpoint, and the
 * panel it opens. Following a link in the panel closes it. Put it where
 * the button should be, usually last in `NavbarActions`.
 */
export function NavbarMenu({
  label = "Menu",
  closeLabel = "Close",
  side = "end",
  children,
}: NavbarMenuProps) {
  const collapse = useContext(CollapseContext);
  if (!collapse) throw new Error("NavbarMenu has to be inside a Navbar.");
  const [open, setOpen] = useState(false);

  // The button goes when the screen is wide enough for the links to be in
  // the bar, and a panel with no button to close it shouldn't stay.
  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia(widths[collapse]);
    const close = () => {
      if (query.matches) setOpen(false);
    };
    query.addEventListener("change", close);
    return () => query.removeEventListener("change", close);
  }, [open, collapse]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="nuv-navbar__toggle" aria-label={label}>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        >
          <path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" />
        </svg>
      </SheetTrigger>
      <SheetContent
        side={side}
        size="sm"
        closeLabel={closeLabel}
        // It has a title and nothing more to say about itself.
        aria-describedby={undefined}
      >
        <SheetHeader>
          <SheetTitle>{label}</SheetTitle>
        </SheetHeader>
        <SheetBody>
          {/* A link that's followed takes the panel with it, which matters
              when it leads to a part of the page that's already open. */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: it listens for presses of the links inside it, and is nothing to press itself */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: Enter on a link is a click */}
          <div
            className="nuv-navbar__menu"
            onClick={(event) => {
              if ((event.target as Element).closest("a[href]")) setOpen(false);
            }}
          >
            {children}
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
