import "@nuvui/react/styles.css";
import "@nuvui/react/themes/ink.css";
import "@nuvui/date-picker/styles.css";
import "@nuvui/table/styles.css";
import "@nuvui/charts/styles.css";
import "@nuvui/barcodes/styles.css";
import "@nuvui/chat/styles.css";
import "@nuvui/kanban/styles.css";
import "@nuvui/editor/styles.css";
import "@nuvui/emoji/styles.css";
import "@nuvui/map/styles.css";
import "@nuvui/flow/styles.css";
import "@nuvui/media/styles.css";
import "@nuvui/backgrounds/styles.css";
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
