import { Button } from "@nuvui/react/button";
import type { Metadata } from "next";
import Link from "next/link";
import { docs } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

// The one 404 page of the whole site. A static host serves it for any
// address that has no file, the docs' addresses included.
export default function NotFound() {
  return (
    <section className="site-hero">
      <h1 className="site-hero__title">There's no page here</h1>
      <p className="site-hero__lead">
        The address may be mistyped, or the page may have moved.
      </p>
      <div className="site-hero__actions">
        <Button asChild>
          <Link href="/">Go to the home page</Link>
        </Button>
        <Button asChild intent="secondary">
          <a href={docs.home}>Go to the docs</a>
        </Button>
      </div>
    </section>
  );
}
