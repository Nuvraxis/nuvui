"use client";

import { ToggleGroup, ToggleGroupItem } from "@nuvui/react";
import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { useState } from "react";
import { type Person, people } from "./people";

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.accessor("name", { header: "Name" }),
  helper.accessor("team", { header: "Team" }),
  helper.accessor("role", { header: "Role" }),
]);
const rows = people.slice(0, 4);
const none: Person[] = [];

type State = "rows" | "first load" | "reload" | "empty" | "error";

export default function Example() {
  const [state, setState] = useState<State>("first load");
  const table = useDataTable({
    columns,
    data: state === "rows" || state === "reload" ? rows : none,
  });

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <ToggleGroup
        type="single"
        aria-label="State"
        value={state}
        onValueChange={(value) => value && setState(value as State)}
      >
        <ToggleGroupItem value="rows">Rows</ToggleGroupItem>
        <ToggleGroupItem value="first load">First load</ToggleGroupItem>
        <ToggleGroupItem value="reload">Reload</ToggleGroupItem>
        <ToggleGroupItem value="empty">Empty</ToggleGroupItem>
        <ToggleGroupItem value="error">Error</ToggleGroupItem>
      </ToggleGroup>
      <DataTable
        table={table}
        aria-label="People"
        rowHeader="name"
        toolbar={false}
        pagination={false}
        loading={state === "first load" || state === "reload"}
        loadingRows={4}
        error={state === "error"}
        onRetry={() => setState("first load")}
        empty="Nobody has been invited yet."
      />
    </div>
  );
}
