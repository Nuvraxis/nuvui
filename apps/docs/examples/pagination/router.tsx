import {
  Pagination,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
} from "@nuvui/react";
import Link from "next/link";

// Stands in for a list of pages your app has. Here they're three of the
// guides on this site.
const pages = ["/docs/theming", "/docs/tailwind", "/docs/scss"];
const current = 1;

export default function Example() {
  return (
    <Pagination aria-label="Guides">
      <PaginationList>
        <PaginationItem>
          <PaginationPrevious asChild>
            <Link href={pages[current - 1] ?? "/docs"}>Previous</Link>
          </PaginationPrevious>
        </PaginationItem>
        {pages.map((href, index) => (
          <PaginationItem key={href}>
            <PaginationLink asChild active={index === current}>
              <Link href={href} aria-label={`Guide ${index + 1}`}>
                {index + 1}
              </Link>
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext asChild>
            <Link href={pages[current + 1] ?? "/docs"}>Next</Link>
          </PaginationNext>
        </PaginationItem>
      </PaginationList>
    </Pagination>
  );
}
