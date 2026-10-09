"use client";

import {
  DataTable,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { useState } from "react";
import { type Person, people } from "@/examples/data-table/people";
import { CheckboxControl, Playground, SelectControl } from "./controls";

const layouts = ["auto", "fixed"] as const;
const firstFive = people.slice(0, 5);

export function TablePlayground() {
  const [striped, setStriped] = useState(false);
  const [stickyHeader, setStickyHeader] = useState(false);
  const [hidden, setHidden] = useState(false);

  const props = [striped && "striped", stickyHeader && "stickyHeader"].filter(
    Boolean,
  );
  const code = [
    stickyHeader
      ? '<TableContainer style={{ maxBlockSize: "12rem" }}>'
      : "<TableContainer>",
    `  <Table${props.map((prop) => ` ${prop}`).join("")}>`,
    `    <TableCaption${hidden ? " visuallyHidden" : ""}>People</TableCaption>`,
    "    ...",
    "  </Table>",
    "</TableContainer>",
  ].join("\n");

  return (
    <Playground
      code={code}
      controls={
        <>
          <CheckboxControl
            label="striped"
            checked={striped}
            onChange={setStriped}
          />
          <CheckboxControl
            label="stickyHeader"
            checked={stickyHeader}
            onChange={setStickyHeader}
          />
          <CheckboxControl
            label="visuallyHidden (caption)"
            checked={hidden}
            onChange={setHidden}
          />
        </>
      }
    >
      <div className="w-full min-w-0">
        <TableContainer
          aria-label="People"
          style={stickyHeader ? { maxBlockSize: "12rem" } : undefined}
        >
          <Table striped={striped} stickyHeader={stickyHeader}>
            <TableCaption visuallyHidden={hidden}>People</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Team</TableHead>
                <TableHead align="end">Seats</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {firstFive.map((person) => (
                <TableRow key={person.id}>
                  <TableCell rowHeader>{person.name}</TableCell>
                  <TableCell>{person.team}</TableCell>
                  <TableCell align="end">{person.seats}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </Playground>
  );
}

const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.select(),
  helper.accessor("name", { header: "Name", size: 200 }),
  helper.accessor("email", { header: "Email", size: 240 }),
  helper.accessor("team", { header: "Team", size: 160 }),
  helper.accessor("seats", {
    header: "Seats",
    size: 120,
    meta: { align: "end" },
  }),
]);

export function DataTablePlayground() {
  const [layout, setLayout] = useState<(typeof layouts)[number]>("auto");
  const [striped, setStriped] = useState(false);
  const [stickyHeader, setStickyHeader] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captionHidden, setCaptionHidden] = useState(false);

  const table = useDataTable({
    columns,
    data: people,
    getRowId: (person) => person.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
  });

  const props = [
    "table={table}",
    'caption="People"',
    captionHidden && "captionHidden",
    'rowHeader="name"',
    layout !== "auto" && `layout="${layout}"`,
    striped && "striped",
    stickyHeader && "stickyHeader",
    loading && "loading",
  ].filter(Boolean);
  const code = `<DataTable\n${props.map((prop) => `  ${prop}`).join("\n")}\n/>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="layout"
            value={layout}
            options={layouts}
            onChange={setLayout}
          />
          <CheckboxControl
            label="striped"
            checked={striped}
            onChange={setStriped}
          />
          <CheckboxControl
            label="stickyHeader"
            checked={stickyHeader}
            onChange={setStickyHeader}
          />
          <CheckboxControl
            label="captionHidden"
            checked={captionHidden}
            onChange={setCaptionHidden}
          />
          <CheckboxControl
            label="loading"
            checked={loading}
            onChange={setLoading}
          />
        </>
      }
    >
      <div
        className="w-full min-w-0"
        style={
          stickyHeader
            ? ({ "--nuv-table-container-max-height": "14rem" } as object)
            : undefined
        }
      >
        <DataTable
          table={table}
          caption="People"
          captionHidden={captionHidden}
          rowHeader="name"
          layout={layout}
          striped={striped}
          stickyHeader={stickyHeader}
          loading={loading}
        />
      </div>
    </Playground>
  );
}
