"use client";

import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { DataTableVirtual } from "@nuvui/table/virtual";
import { manyPeople, type Person } from "./people";

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.select(),
  helper.accessor("name", { header: "Name" }),
  helper.accessor("email", { header: "Email" }),
  helper.accessor("team", { header: "Team" }),
  helper.accessor("seats", { header: "Seats", meta: { align: "end" } }),
]);
const tenThousand = manyPeople(10_000);

export default function Example() {
  const table = useDataTable({
    columns,
    data: tenThousand,
    getRowId: (person) => person.id,
    // The ready-made hook has pages. One page holds every row here.
    initialState: {
      pagination: { pageIndex: 0, pageSize: tenThousand.length },
    },
  });

  return (
    <DataTableVirtual
      table={table}
      caption="Ten thousand people"
      rowHeader="name"
      height={360}
      pagination={false}
    />
  );
}
