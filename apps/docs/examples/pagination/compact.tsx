import {
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
  paginationRange,
} from "@nuvui/react";

const page = 7;
const count = 20;

export default function Example() {
  return (
    <Pagination>
      <PaginationList>
        <PaginationItem>
          <PaginationPrevious href={`#page-${page - 1}`} />
        </PaginationItem>
        {paginationRange({ page, count, siblings: 0 }).map((entry) => (
          <PaginationItem key={entry}>
            {typeof entry === "number" ? (
              <PaginationLink
                href={`#page-${entry}`}
                aria-label={`Page ${entry}`}
                active={entry === page}
              >
                {entry}
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext href={`#page-${page + 1}`} />
        </PaginationItem>
      </PaginationList>
    </Pagination>
  );
}
