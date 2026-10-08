// The library's stylesheets, then this site's own. The library's rules are
// in cascade layers and this site's aren't, so the site's win wherever both
// set the same thing, whichever order they load in.
import "@nuvui/react/styles.css";
import "@nuvui/table/styles.css";
import "@nuvui/charts/styles.css";
import "@/styles/index.scss";
import { Toaster } from "@nuvui/react/toast";
import type { Metadata } from "next";
import { Hydrated } from "@/components/hydrated";
import { site } from "@/lib/site";
import { siteThemeScript } from "@/lib/site-theme";
import { themeScript } from "@/lib/theme";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name}: React components on Radix UI, styled with SCSS`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    siteName: site.name,
    type: "website",
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The script below sets data-theme before React is there, to the
    // visitor's own choice, which the server can't know.
    <html lang="en" data-theme="system" suppressHydrationWarning>
      <head>
        <script
          // The theme has to be in place before the first paint, so this
          // can't wait for a script that loads. The text is a constant of
          // ours, with nothing from outside in it.
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <script
          // The same goes for a theme made on the Themes page and put on
          // the whole site. This one is a constant of ours too. The CSS it
          // puts in place is what that page stored.
          dangerouslySetInnerHTML={{ __html: siteThemeScript }}
        />
      </head>
      <body className="site-page">
        {/* The header and the footer are a layout further in, around the
            site's own pages. A block's preview has neither. */}
        {children}
        <Toaster />
        <Hydrated />
      </body>
    </html>
  );
}
