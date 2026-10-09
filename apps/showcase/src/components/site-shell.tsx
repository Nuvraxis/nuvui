import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// What goes around a page of the site: the header, the page, the footer. A
// block's preview is a page with none of it, which is why this isn't in the
// root layout.
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="content" className="site-page__main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
