// global.css has to come first. It sets the cascade layer order that the
// library's stylesheet then slots into.
import "./global.css";
import "@nuvui/react/styles.css";
import "@nuvui/date-picker/styles.css";
import "@nuvui/table/styles.css";
import "@nuvui/charts/styles.css";
// Every preset, for the examples on the Theming page and its editor.
import "@nuvui/react/themes/ink.css";
import "@nuvui/react/themes/ledger.css";
import "@nuvui/react/themes/meadow.css";
import "@nuvui/react/themes/ember.css";
import "@nuvui/react/themes/high-contrast.css";
import { Toaster } from "@nuvui/react";
import type { Metadata } from "next";
import { Provider } from "@/components/provider";
import { SiteHeader } from "@/components/site-header";
import { Telemetry } from "@/components/telemetry";
import { baseMetadata, viewport } from "@/lib/seo";
import { telemetry } from "@/lib/telemetry";

export const metadata: Metadata = baseMetadata;
export { viewport };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // next-themes sets the theme on <html> before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Provider>
          <SiteHeader />
          {children}
        </Provider>
        {/* One for the whole site. The examples on the Toast page call
            toast() and this is where they show up. */}
        <Toaster />
        {telemetry.enabled && <Telemetry />}
      </body>
    </html>
  );
}
