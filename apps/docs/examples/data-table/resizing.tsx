"use client";

import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { type Person, people } from "./people";

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.accessor("name", { header: "Name", size: 200, minSize: 120 }),
  helper.accessor("email", { header: "Email", size: 240, minSize: 120 }),
  helper.accessor("team", { header: "Team", size: 140, maxSize: 240 }),
  // This one keeps its width.
  helper.accessor("role", { header: "Role", size: 120, enableResizing: false }),
]);
const firstSix = people.slice(0, 6);

export default function Example() {
  const table = useDataTable({ columns, data: firstSix });

  return (
    <DataTable
      table={table}
      aria-label="People"
      rowHeader="name"
      layout="fixed"
      toolbar={false}
      pagination={false}
    />
  );
}
