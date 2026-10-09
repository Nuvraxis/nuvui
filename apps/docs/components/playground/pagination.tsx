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
import { Playground, SelectControl } from "./controls";

// As text, because a select works in strings.
const counts = ["5", "20", "200"] as const;
const steps = ["0", "1", "2"] as const;
const ends = ["1", "2"] as const;

export function PaginationPlayground() {
  const [count, setCount] = useState<(typeof counts)[number]>("20");
  const [siblings, setSiblings] = useState<(typeof steps)[number]>("1");
  const [boundaries, setBoundaries] = useState<(typeof ends)[number]>("1");
  const [chosen, setChosen] = useState(10);

  const total = Number(count);
  const page = Math.min(chosen, total);
  const options = [
    "page",
    `count: ${count}`,
    siblings !== "1" && `siblings: ${siblings}`,
    boundaries !== "1" && `boundaries: ${boundaries}`,
  ].filter(Boolean);
  const range = paginationRange({
    page,
    count: total,
    siblings: Number(siblings),
    boundaries: Number(boundaries),
  });
  const code = `paginationRange({ ${options.join(", ")} });
// page ${page} gives ${JSON.stringify(range)}`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="count"
            value={count}
            options={counts}
            onChange={setCount}
          />
          <SelectControl
            label="siblings"
            value={siblings}
            options={steps}
            onChange={setSiblings}
          />
          <SelectControl
            label="boundaries"
            value={boundaries}
            options={ends}
            onChange={setBoundaries}
          />
        </>
      }
    >
      <Pagination>
        <PaginationList>
          <PaginationItem>
            <PaginationPrevious asChild disabled={page === 1}>
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setChosen(page - 1)}
              >
                Previous
              </button>
            </PaginationPrevious>
          </PaginationItem>
          {range.map((entry) => (
            <PaginationItem key={entry}>
              {typeof entry === "number" ? (
                <PaginationLink asChild active={entry === page}>
                  <button
                    type="button"
                    aria-label={`Page ${entry}`}
                    onClick={() => setChosen(entry)}
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
            <PaginationNext asChild disabled={page === total}>
              <button
                type="button"
                disabled={page === total}
                onClick={() => setChosen(page + 1)}
              >
                Next
              </button>
            </PaginationNext>
          </PaginationItem>
        </PaginationList>
      </Pagination>
    </Playground>
  );
}
