"use client";

import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { type Person, people } from "./people";

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.accessor("name", { header: "Name" }),
  helper.accessor("team", { header: "Team" }),
  // Not something to sort by.
  helper.accessor("email", { header: "Email", enableSorting: false }),
  helper.accessor("seats", { header: "Seats", meta: { align: "end" } }),
]);
const firstEight = people.slice(0, 8);

export default function Example() {
  const table = useDataTable({
    columns,
    data: firstEight,
    initialState: { sorting: [{ id: "name", desc: false }] },
  });

  return (
    <DataTable
      table={table}
      aria-label="People, sorted by name"
      rowHeader="name"
      toolbar={false}
      pagination={false}
    />
  );
}
