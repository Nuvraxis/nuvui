"use client";

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
import { useState } from "react";

const count = 20;

export default function Example() {
  const [page, setPage] = useState(1);

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <Pagination>
        <PaginationList>
          <PaginationItem>
            <PaginationPrevious asChild disabled={page === 1}>
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
            </PaginationPrevious>
          </PaginationItem>
          {paginationRange({ page, count }).map((entry) => (
            <PaginationItem key={entry}>
              {typeof entry === "number" ? (
                <PaginationLink asChild active={entry === page}>
                  <button
                    type="button"
                    aria-label={`Page ${entry}`}
                    onClick={() => setPage(entry)}
                  >
                    {entry}
                  </button>
                </PaginationLink>
              ) : (
                <PaginationEllipsis />
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext asChild disabled={page === count}>
              <button
                type="button"
                disabled={page === count}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </PaginationNext>
          </PaginationItem>
        </PaginationList>
      </Pagination>
      <p style={{ margin: 0, fontSize: 14 }}>
        Page {page} of {count}
      </p>
    </div>
  );
}
