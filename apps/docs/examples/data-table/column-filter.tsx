"use client";

import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { type Person, people } from "./people";

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.accessor("name", {
    // A header of your own has no text for the column chooser and the
    // screen reader labels to use, so the column is given a label.
    meta: { label: "Name" },
    header: ({ header }) => (
      <>
        <header.ColumnHeader />
        <header.ColumnFilter placeholder="Filter" />
      </>
    ),
  }),
  helper.accessor("team", {
    meta: { label: "Team" },
    header: ({ header }) => (
      <>
        <header.ColumnHeader />
        <header.ColumnFilter placeholder="Filter" />
      </>
    ),
  }),
  helper.accessor("role", { header: "Role" }),
]);

export default function Example() {
  const table = useDataTable({
    columns,
    data: people,
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
  });

  return (
    <DataTable
      table={table}
      aria-label="People"
      rowHeader="name"
      toolbar={false}
    />
  );
}
