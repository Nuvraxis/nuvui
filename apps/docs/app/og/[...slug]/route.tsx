import { generateOGImage } from "fumadocs-ui/og";
import { notFound } from "next/navigation";
import { site } from "@/lib/site";
import { getPageImage, source } from "@/lib/source";

export const revalidate = false;

export async function GET(
  _request: Request,
  { params }: RouteContext<"/og/[...slug]">,
) {
  const { slug } = await params;
  // The last segment is the file name, image.png.
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  return generateOGImage({
    title: page.data.title,
    description: page.data.description,
    site: site.name,
  });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    slug: getPageImage(page).segments,
  }));
}
