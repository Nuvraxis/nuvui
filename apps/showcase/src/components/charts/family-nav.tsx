import Link from "next/link";
import { families, familyPath } from "@/lib/charts";

// The list of families, on every charts page. The page says which one it
// is, so this needs nothing from the browser.
export function FamilyNav({ current }: { current?: string }) {
  return (
    <nav className="site-families" aria-label="Chart families">
      <ul className="site-families__list">
        {families.map((family) => (
          <li key={family.slug}>
            <Link
              href={familyPath(family)}
              className="site-families__link"
              aria-current={family.slug === current ? "page" : undefined}
            >
              {family.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
