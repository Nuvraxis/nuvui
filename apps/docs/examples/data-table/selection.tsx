"use client";

import { Button } from "@nuvui/react";
import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { useState } from "react";
import { type Person, people } from "./people";

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.select(),
  helper.accessor("name", { header: "Name" }),
  helper.accessor("email", { header: "Email" }),
  helper.accessor("role", { header: "Role" }),
]);

export default function Example() {
  const [rows, setRows] = useState(() => people.slice(0, 8));
  const table = useDataTable({
    columns,
    data: rows,
    // Selection is kept by id. Without this it would be kept by position,
    // and removing a row would move the ticks to other people.
    getRowId: (person) => person.id,
  });

  function remove(ids: string[]) {
    setRows((current) => current.filter((person) => !ids.includes(person.id)));
    // The table doesn't forget a row because it's gone from the data.
    table.resetRowSelection(true);
  }

  return (
    <DataTable
      table={table}
      aria-label="People"
      rowHeader="name"
      toolbar={false}
      pagination={false}
      bulkActions={(selected) => (
        <Button
          size="sm"
          intent="danger"
          onClick={() => remove(selected.map((row) => row.id))}
        >
          Remove
        </Button>
      )}
    />
  );
}
