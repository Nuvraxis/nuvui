"use client";

import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { type Person, people } from "./people";

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.accessor("name", { header: "Name" }),
  helper.accessor("team", { header: "Team" }),
  helper.accessor("joined", { header: "Joined" }),
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
      pageSizes={[5, 10, 25]}
    />
  );
}
