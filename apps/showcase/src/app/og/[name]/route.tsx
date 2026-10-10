import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { pages, site } from "@/lib/site";

export const dynamic = "force-static";

// The file name a page's image has: /og/home.png for the home page.
const nameOf = (path: string) =>
  `${path === "/" ? "home" : path.slice(1).replaceAll("/", "-")}.png`;

// The picture a link to a page shows when it's shared. One for each page of
// this app, written as a file when the site is built. The colors are the
// default dark theme's, written out: an image has no stylesheet.
export async function GET(
  _request: Request,
  { params }: RouteContext<"/og/[name]">,
) {
  const { name } = await params;
  const page = pages.find((entry) => nameOf(entry.path) === name);
  if (!page) notFound();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        backgroundColor: "#030712",
        color: "#f9fafb",
      }}
    >
      <div style={{ display: "flex", fontSize: 36, fontWeight: 600 }}>
        {site.name}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700 }}>
          {page.path === "/"
            ? "React components for enterprise applications"
            : page.title}
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#d1d5dc" }}>
          {page.description}
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}

export function generateStaticParams() {
  return pages.map((page) => ({ name: nameOf(page.path) }));
}
