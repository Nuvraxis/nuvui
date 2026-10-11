"use client";

import {
  Collapsible,
  CollapsibleContent,
  type CollapsibleProps,
  CollapsibleTrigger,
} from "@nuvui/react/collapsible";
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cx } from "../../utils/cx";

export interface SourcesProps extends CollapsibleProps {}

/**
 * What a reply was drawn from: a line that says how many sources there
 * are, and opens to list them. It starts closed. Put it in a `Message`,
 * under the `MessageContent`.
 */
export const Sources = forwardRef<HTMLDivElement, SourcesProps>(
  function Sources({ className, ...props }, ref) {
    return (
      <Collapsible
        ref={ref}
        className={cx("nuv-sources", className)}
        {...props}
      />
    );
  },
);

export interface SourcesTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * The line that opens the list. Say how many there are in it: "3
 * sources".
 */
export const SourcesTrigger = forwardRef<
  HTMLButtonElement,
  SourcesTriggerProps
>(function SourcesTrigger({ className, children = "Sources", ...props }, ref) {
  return (
    <CollapsibleTrigger
      ref={ref}
      className={cx("nuv-sources__trigger", className)}
      {...props}
    >
      {children}
      <svg
        aria-hidden="true"
        className="nuv-sources__chevron"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m4 6 4 4 4-4" />
      </svg>
    </CollapsibleTrigger>
  );
});

export interface SourcesContentProps extends HTMLAttributes<HTMLOListElement> {}

/**
 * The list. It's numbered, so a number in the reply can point at its
 * source. Put a `Source` in it for each.
 */
export const SourcesContent = forwardRef<HTMLOListElement, SourcesContentProps>(
  function SourcesContent({ className, ...props }, ref) {
    return (
      <CollapsibleContent className="nuv-sources__content">
        <ol
          ref={ref}
          // biome-ignore lint/a11y/noRedundantRoles: Safari stops calling a list a list once its numbers are styled away, and saying so again brings it back
          role="list"
          className={cx("nuv-sources__list", className)}
          {...props}
        />
      </CollapsibleContent>
    );
  },
);

// The site an address is on, without the "www." that says nothing. An
// address that isn't a whole one has none.
function siteOf(href: string): string | undefined {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export interface SourceOwnProps {
  /** Where the source is. */
  href: string;
  /** What it's called: the page's title, or the document's name. */
  title: ReactNode;
  /**
   * Where it's from, in small text under the title.
   * @default The site in `href`, such as "example.com"
   */
  site?: ReactNode;
}

export interface SourceProps
  extends SourceOwnProps,
    Omit<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      keyof SourceOwnProps | "children"
    > {}

/**
 * One source: a link with its title and where it's from. It takes a
 * link's attributes, such as `target`. It goes inside a `SourcesContent`.
 */
export const Source = forwardRef<HTMLAnchorElement, SourceProps>(
  function Source({ href, title, site, className, ...props }, ref) {
    const from = site === undefined ? siteOf(href) : site;

    return (
      <li className="nuv-sources__item">
        <a
          ref={ref}
          className={cx("nuv-source", className)}
          href={href}
          {...props}
        >
          <span className="nuv-source__title">{title}</span>
          {from ? <span className="nuv-source__site">{from}</span> : null}
        </a>
      </li>
    );
  },
);
