import { Button } from "@nuvui/react";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/", images: "/og/docs/image.png" },
};

export default function HomePage() {
  return (
    // HomeLayout already renders the <main> landmark.
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: site.name,
          description: site.description,
          url: site.url,
        }}
      />
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        React components on Radix UI, styled with plain SCSS
      </h1>
      <p className="text-fd-muted-foreground text-lg">
        {site.name} wraps Radix primitives and styles them with BEM class names
        and CSS custom properties. The stylesheet ships as a normal CSS file, so
        it works with server components and needs no build plugin.
      </p>
      <p className="text-fd-muted-foreground">
        It's early. There are thirty-four components so far, and nothing has
        been published to the registry yet.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/docs">Get started</Link>
        </Button>
        <Button asChild size="lg" intent="secondary">
          <Link href="/docs/components/button">See the components</Link>
        </Button>
      </div>
    </div>
  );
}
