"use client";

import { createDataTableHook, DataTable } from "@nuvui/table";
import {
  createSortedRowModel,
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
} from "@tanstack/react-table";
import { type Person, people } from "./people";

// In an app this is a module of its own, and every table imports from it.
const { useDataTable, createColumnHelper } = createDataTableHook({
  features: tableFeatures({
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns: { text: sortFn_text },
  }),
});

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.accessor("name", { header: "Name" }),
  helper.accessor("team", { header: "Team" }),
  helper.accessor("role", { header: "Role" }),
]);
const firstSix = people.slice(0, 6);

export default function Example() {
  const table = useDataTable({ columns, data: firstSix });

  return <DataTable table={table} aria-label="People" rowHeader="name" />;
}
