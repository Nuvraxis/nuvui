"use client";

import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { type Person, people } from "./people";

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.expand(),
  helper.accessor("name", { header: "Name" }),
  helper.accessor("team", { header: "Team" }),
  helper.accessor("role", { header: "Role" }),
]);
const firstSix = people.slice(0, 6);

export default function Example() {
  const table = useDataTable({
    columns,
    data: firstSix,
    getRowCanExpand: () => true,
  });

  return (
    <DataTable
      table={table}
      aria-label="People"
      rowHeader="name"
      toolbar={false}
      pagination={false}
      renderDetail={(row) => (
        <dl style={{ display: "grid", gap: 4, margin: 0 }}>
          <div>
            <dt style={{ display: "inline", fontWeight: 500 }}>Email: </dt>
            <dd style={{ display: "inline", margin: 0 }}>
              {row.original.email}
            </dd>
          </div>
          <div>
            <dt style={{ display: "inline", fontWeight: 500 }}>Joined: </dt>
            <dd style={{ display: "inline", margin: 0 }}>
              {row.original.joined}
            </dd>
          </div>
        </dl>
      )}
    />
  );
}
