import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { blockCount } from "@/lib/blocks";
import { chartCount } from "@/lib/charts";
import { addOnCount } from "@/lib/packages";
import { pages, site } from "@/lib/site";

export const dynamic = "force-static";

// The file name a page's image has: /og/home.png for the home page.
const nameOf = (path: string) =>
  `${path === "/" ? "home" : path.slice(1).replaceAll("/", "-")}.png`;

// Next runs with the app folder as the working directory. These two are the
// home page's faces, as plain files: what draws an image can't read a
// variable font, or the woff2 files the page loads. Each is its font pinned
// to one width and weight.
const app = path.join(process.cwd(), "src", "app");
const fonts = path.join(app, "og", "fonts");
const display = readFile(path.join(fonts, "archivo-expanded-semibold.ttf"));
const reading = readFile(path.join(fonts, "martian-mono-medium.ttf"));
const logo = readFile(path.join(app, "icon.svg"), "base64");

// The default dark theme, written out: an image has no stylesheet.
const colors = {
  background: "#0a0a0a",
  foreground: "#fafafa",
  muted: "#a1a1a1",
  border: "#262626",
  primary: "#fdc700",
  primaryForeground: "#0a0a0a",
};

// The home page's headline, a line at a time, as the page breaks it.
const headline = [
  "Business software,",
  "built once,",
  "consistent everywhere.",
];

const titleBlock = [
  { label: "Part", value: site.packageName },
  { label: "Scale", value: "1:1" },
  { label: "License", value: "MIT" },
  { label: "Components", value: "79" },
  { label: "Add-ons", value: String(addOnCount) },
  { label: "Blocks", value: String(blockCount) },
  { label: "Charts", value: String(chartCount) },
];

// The bench from the home page, small: a real control's height at its real
// size, between calipers.
function Specimen() {
  return (
    <div
      style={{
        position: "absolute",
        top: 169,
        right: 64,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 44,
          padding: "0 28px",
          borderRadius: 9,
          backgroundColor: colors.primary,
          color: colors.primaryForeground,
          fontFamily: "Reading",
          fontSize: 18,
        }}
      >
        Approve
      </div>
      <div
        style={{
          display: "flex",
          width: 14,
          height: 44,
          borderTop: `2px solid ${colors.primary}`,
          borderRight: `2px solid ${colors.primary}`,
          borderBottom: `2px solid ${colors.primary}`,
        }}
      />
      <div style={{ display: "flex", fontFamily: "Reading", fontSize: 24 }}>
        44 px
      </div>
    </div>
  );
}

// The picture a link to a page shows when it's shared. One for each page of
// this app, written as a file when the site is built.
export async function GET(
  _request: Request,
  { params }: RouteContext<"/og/[name]">,
) {
  const { name } = await params;
  const page = pages.find((entry) => nameOf(entry.path) === name);
  if (!page) notFound();
  const home = page.path === "/";

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: colors.background,
        backgroundImage: `linear-gradient(to right, ${colors.border} 1px, transparent 1px), linear-gradient(to bottom, ${colors.border} 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
        color: colors.foreground,
        fontFamily: "Display",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "56px 64px 0",
          fontSize: 32,
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: drawn into a picture, with no page to load it */}
        <img
          src={`data:image/svg+xml;base64,${await logo}`}
          alt=""
          width={44}
          height={44}
        />
        {site.name}
      </div>
      {home ? <Specimen /> : null}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 22,
          padding: "0 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            color: colors.primary,
            fontFamily: "Reading",
            fontSize: 25,
          }}
        >
          React components for enterprise applications
        </div>
        {home ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 72,
              lineHeight: 1.06,
              letterSpacing: -2,
            }}
          >
            {headline.map((line) => (
              <div key={line} style={{ display: "flex" }}>
                {line}
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 60,
                lineHeight: 1.06,
                letterSpacing: -1.5,
              }}
            >
              {page.title}
            </div>
            <div
              style={{
                // A long description is cut, not left to fill the picture.
                display: "block",
                lineClamp: 3,
                color: colors.muted,
                fontFamily: "Reading",
                fontSize: 22,
                lineHeight: 1.5,
              }}
            >
              {page.description}
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          borderTop: `2px solid ${colors.border}`,
          backgroundColor: colors.background,
          fontFamily: "Reading",
        }}
      >
        {titleBlock.map(({ label, value }, index) => (
          <div
            key={label}
            style={{
              display: "flex",
              flexDirection: "column",
              flexGrow: index === 0 ? 2 : 1,
              gap: 8,
              padding: index === 0 ? "22px 24px 24px 64px" : "22px 24px 24px",
              borderLeft: index === 0 ? "none" : `2px solid ${colors.border}`,
            }}
          >
            <div style={{ display: "flex", color: colors.muted, fontSize: 16 }}>
              {label}
            </div>
            <div style={{ display: "flex", fontSize: 22 }}>{value}</div>
          </div>
        ))}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Display", data: await display, weight: 600 },
        { name: "Reading", data: await reading, weight: 500 },
      ],
    },
  );
}

export function generateStaticParams() {
  return pages.map((page) => ({ name: nameOf(page.path) }));
}
