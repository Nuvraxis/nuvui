import "@nuvui/react/styles.css";
import "@nuvui/react/themes/ink.css";
import type { ReactNode } from "react";

export const metadata = { title: "nuvui in a Next.js app" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="system" data-preset="ink">
      <body>{children}</body>
    </html>
  );
}
