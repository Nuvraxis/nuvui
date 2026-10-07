"use client";

import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { type Person, people } from "./people";

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.select(),
  helper.accessor("name", { header: "Name" }),
  helper.accessor("email", { header: "Email" }),
  helper.accessor("team", { header: "Team" }),
  helper.accessor("role", { header: "Role" }),
  helper.accessor("joined", { header: "Joined" }),
  helper.accessor("seats", { header: "Seats", meta: { align: "end" } }),
]);
const firstSix = people.slice(0, 6);

export default function Example() {
  const table = useDataTable({
    columns,
    data: firstSix,
    getRowId: (person) => person.id,
    initialState: {
      columnPinning: { start: ["select", "name"], end: ["seats"] },
    },
  });

  return (
    // Narrow, so there's something to scroll on a wide screen too.
    <div style={{ maxInlineSize: "30rem", marginInline: "auto" }}>
      <DataTable
        table={table}
        aria-label="People"
        rowHeader="name"
        toolbar={false}
        pagination={false}
      />
    </div>
  );
}
