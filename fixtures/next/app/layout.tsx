import "@nuvui/react/styles.css";
import "@nuvui/react/themes/ink.css";
// A client component from an entry of its own, used from this server
// component with nothing but plain props.
import { DirectionProvider } from "@nuvui/react/direction";
import type { ReactNode } from "react";

export const metadata = { title: "nuvui in a Next.js app" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="system" data-preset="ink">
      <body>
        <DirectionProvider dir="ltr">{children}</DirectionProvider>
      </body>
    </html>
  );
}
