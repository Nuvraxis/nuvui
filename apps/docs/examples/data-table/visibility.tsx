"use client";

import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { type Person, people } from "./people";

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  // Always there, and so not in the list.
  helper.accessor("name", { header: "Name", enableHiding: false }),
  helper.accessor("email", { header: "Email" }),
  helper.accessor("team", { header: "Team" }),
  helper.accessor("role", { header: "Role" }),
  helper.accessor("joined", { header: "Joined" }),
]);
const firstSix = people.slice(0, 6);

export default function Example() {
  const table = useDataTable({
    columns,
    data: firstSix,
    // Hidden to begin with.
    initialState: { columnVisibility: { joined: false } },
  });

  return (
    <DataTable
      table={table}
      aria-label="People"
      rowHeader="name"
      pagination={false}
    />
  );
}
