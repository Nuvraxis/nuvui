"use client";

import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";

interface Folder {
  name: string;
  size: string;
  children?: Folder[];
}

const folders: Folder[] = [
  {
    name: "Design",
    size: "1.2 GB",
    children: [
      { name: "Logos", size: "220 MB" },
      {
        name: "Screens",
        size: "980 MB",
        children: [
          { name: "Phone", size: "410 MB" },
          { name: "Desktop", size: "570 MB" },
        ],
      },
    ],
  },
  { name: "Contracts", size: "86 MB" },
  {
    name: "Reports",
    size: "340 MB",
    children: [{ name: "2026", size: "340 MB" }],
  },
];

const helper = createColumnHelper<Folder>();
const columns = helper.columns([
  helper.accessor("name", {
    header: "Name",
    cell: ({ cell, getValue }) => (
      <>
        <cell.ExpandToggle /> {getValue()}
      </>
    ),
  }),
  helper.accessor("size", { header: "Size", meta: { align: "end" } }),
]);

export default function Example() {
  const table = useDataTable({
    columns,
    data: folders,
    getSubRows: (folder) => folder.children,
    initialState: { expanded: { 0: true } },
  });

  return (
    <DataTable
      table={table}
      aria-label="Folders"
      rowHeader="name"
      toolbar={false}
      pagination={false}
    />
  );
}
