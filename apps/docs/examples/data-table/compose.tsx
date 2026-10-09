"use client";

import {
  DataTableContent,
  DataTablePagination,
  DataTableRoot,
} from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { type Person, people } from "./people";

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.accessor("name", { header: "Name" }),
  helper.accessor("team", { header: "Team" }),
  helper.accessor("role", { header: "Role" }),
]);

export default function Example() {
  const table = useDataTable({
    columns,
    data: people,
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
  });

  return (
    <DataTableRoot table={table} rowHeader="name">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h3 id="team-heading" style={{ margin: 0, fontWeight: 600 }}>
          Team
        </h3>
        <table.Filter />
      </div>
      <DataTableContent aria-labelledby="team-heading" striped />
      <DataTablePagination pageSizes={[]} />
    </DataTableRoot>
  );
}
