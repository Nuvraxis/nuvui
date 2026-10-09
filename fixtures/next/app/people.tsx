"use client";

// A data table is made with a hook, so it's in a client component. The
// page, a server component, renders it with rows it has as plain data.
import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";

export interface Person {
  id: string;
  name: string;
  team: string;
}

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.select(),
  helper.accessor("name", { header: "Name" }),
  helper.accessor("team", { header: "Team" }),
]);

export function People({ people }: { people: Person[] }) {
  const table = useDataTable({
    columns,
    data: people,
    getRowId: (person) => person.id,
    initialState: { sorting: [{ id: "name", desc: false }] },
  });
  return <DataTable table={table} caption="People" rowHeader="name" />;
}
