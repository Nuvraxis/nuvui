"use client";

import {
  DataTable,
  type DataTableRequest,
  DataTableToolbar,
  useDataTableRequest,
} from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { useEffect, useState } from "react";
import { type Person, people } from "./people";

interface Page {
  rows: Person[];
  total: number;
}

// Stands in for your API. It filters, sorts and cuts out one page, the way
// a database would, and takes half a second over it.
async function fetchPeople(request: DataTableRequest): Promise<Page> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const search = request.globalFilter.toLowerCase();
  const found = people.filter(
    (person) =>
      person.name.toLowerCase().includes(search) ||
      person.team.toLowerCase().includes(search),
  );
  const [sort] = request.sorting;
  if (sort) {
    const key = sort.id as keyof Person;
    found.sort(
      (a, b) =>
        String(a[key]).localeCompare(String(b[key]), undefined, {
          numeric: true,
        }) * (sort.desc ? -1 : 1),
    );
  }
  const { pageIndex, pageSize } = request.pagination;
  const start = pageIndex * pageSize;
  return { rows: found.slice(start, start + pageSize), total: found.length };
}

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.accessor("name", { header: "Name" }),
  helper.accessor("team", { header: "Team" }),
  helper.accessor("seats", { header: "Seats", meta: { align: "end" } }),
]);
const none: Person[] = [];

export default function Example() {
  const [request, options] = useDataTableRequest({
    pagination: { pageIndex: 0, pageSize: 5 },
  });
  const [page, setPage] = useState<Page>();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt asks again
  useEffect(() => {
    let current = true;
    setLoading(true);
    setFailed(false);
    fetchPeople(request)
      .then((result) => current && setPage(result))
      .catch(() => current && setFailed(true))
      .finally(() => current && setLoading(false));
    return () => {
      // An answer to a request that's been replaced is dropped.
      current = false;
    };
  }, [request, attempt]);

  const table = useDataTable({
    columns,
    data: page?.rows ?? none,
    rowCount: page?.total,
    getRowId: (person) => person.id,
    ...options,
  });

  return (
    <DataTable
      table={table}
      aria-label="People"
      rowHeader="name"
      loading={loading}
      error={failed}
      onRetry={() => setAttempt((count) => count + 1)}
      pageSizes={[5, 10]}
      toolbar={
        <DataTableToolbar>
          <table.Filter debounce={300} />
        </DataTableToolbar>
      }
    />
  );
}
