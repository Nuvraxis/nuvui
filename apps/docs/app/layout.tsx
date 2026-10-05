// global.css has to come first. It sets the cascade layer order that the
// library's stylesheet then slots into.
import "./global.css";
import "@nuvui/react/styles.css";
import { Toaster } from "@nuvui/react";
import type { Metadata } from "next";
import { Provider } from "@/components/provider";
import { site } from "@/lib/site";

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
    // next-themes sets the theme on <html> before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Provider>{children}</Provider>
        {/* One for the whole site. The examples on the Toast page call
            toast() and this is where they show up. */}
        <Toaster />
      </body>
    </html>
  );
}
