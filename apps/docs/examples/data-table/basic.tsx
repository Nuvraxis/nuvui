"use client";

import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { type Person, people } from "./people";

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.accessor("name", { header: "Name" }),
  helper.accessor("email", { header: "Email" }),
  helper.accessor("role", { header: "Role" }),
  helper.accessor("seats", { header: "Seats", meta: { align: "end" } }),
]);

export default function Example() {
  const table = useDataTable({
    columns,
    data: people,
    getRowId: (person) => person.id,
  });

  return <DataTable table={table} caption="People" rowHeader="name" />;
}
