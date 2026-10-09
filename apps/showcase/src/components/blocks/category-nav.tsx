import Link from "next/link";
import { blocksHome, categories, categoryPath } from "@/lib/blocks";

// The list of categories, on every blocks page. The page says which one it
// is, so this needs nothing from the browser.
export function CategoryNav({ current }: { current?: string }) {
  return (
    <nav className="site-families" aria-label="Block categories">
      <ul className="site-families__list">
        <li>
          <Link
            href={blocksHome}
            className="site-families__link"
            aria-current={current ? undefined : "page"}
          >
            All
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={categoryPath(category)}
              className="site-families__link"
              aria-current={category.slug === current ? "page" : undefined}
            >
              {category.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
