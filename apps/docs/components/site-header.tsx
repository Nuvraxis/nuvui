"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation, site } from "@/lib/site";

const link =
  "inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-sm font-medium text-fd-muted-foreground transition-colors hover:text-fd-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring aria-[current=page]:text-fd-foreground aria-[current=page]:underline aria-[current=page]:underline-offset-8 md:min-h-9";

// The website's header, on the docs' pages. The website is another app at
// the root of the same address, and this is the way back to it: the same
// name, the same links in the same order.
export function SiteHeader() {
  const pathname = usePathname();
  // The component pages are a section of their own in the header. Every
  // other page of this app is "Docs".
  const section = pathname.startsWith("/components") ? "components" : "docs";

  return (
    <header
      id="site-header"
      className="border-fd-border bg-fd-background/80 top-0 z-40 border-b backdrop-blur-md md:sticky"
    >
      <div className="mx-auto flex h-14 max-w-(--fd-layout-width,97rem) items-center gap-2 px-4 md:gap-6">
        {/* A plain link: the router would put this app's base path on it. */}
        <a
          href="/"
          className="focus-visible:outline-fd-ring inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
          >
            <rect width="24" height="24" rx="6" fill="currentColor" />
            <path
              d="M8 16.5v-5a4 4 0 0 1 8 0v5"
              className="stroke-fd-background"
              strokeWidth="2.25"
              strokeLinecap="round"
            />
          </svg>
          {site.name}
        </a>
        <nav
          aria-label="Site"
          // On a phone the links don't fit, and the row scrolls sideways.
          className="-mx-1 min-w-0 flex-1 overflow-x-auto px-1 [scrollbar-width:none]"
        >
          <ul className="flex items-center gap-1">
            {navigation.map((item) => (
              <li key={item.href} className="flex">
                {item.docs ? (
                  <Link
                    href={item.docs.path}
                    className={link}
                    aria-current={
                      item.docs.section === section ? "page" : undefined
                    }
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a href={item.href} className={link}>
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <a
          href={site.repo}
          className="text-fd-muted-foreground hover:text-fd-foreground focus-visible:outline-fd-ring hidden size-9 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 md:inline-flex"
        >
          <span className="sr-only">GitHub repository</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
          </svg>
        </a>
      </div>
    </header>
  );
}
