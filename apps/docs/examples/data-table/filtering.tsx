"use client";

import { NativeSelect } from "@nuvui/react";
import { DataTable, DataTableToolbar } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { type Person, people } from "./people";

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.accessor("name", { header: "Name" }),
  helper.accessor("email", { header: "Email" }),
  helper.accessor("team", { header: "Team" }),
  // Matched whole. Left to itself a text column matches part of a word,
  // and "Editor" isn't part of anything else, but "Admin" could be.
  helper.accessor("role", { header: "Role", filterFn: "equals" }),
]);

export default function Example() {
  const table = useDataTable({
    columns,
    data: people,
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
  });
  const role = table.getColumn("role");

  return (
    <DataTable
      table={table}
      aria-label="People"
      rowHeader="name"
      toolbar={
        <DataTableToolbar>
          <table.Filter />
          <NativeSelect
            aria-label="Role"
            value={(role?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              role?.setFilterValue(event.target.value || undefined)
            }
          >
            <option value="">Every role</option>
            <option>Admin</option>
            <option>Editor</option>
            <option>Viewer</option>
          </NativeSelect>
        </DataTableToolbar>
      }
    />
  );
}
