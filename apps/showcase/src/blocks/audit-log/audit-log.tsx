"use client";

import { type DateRange, DateRangePicker } from "@nuvui/date-picker";
import { Button } from "@nuvui/react";
import { DataTable, DataTableToolbar } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { Download } from "lucide-react";
import "./audit-log.scss";

// Made-up people and events. Nothing here is real data.

interface Entry {
  id: string;
  // The time where the reader is, with no time zone in it. From a server
  // it would be an instant, turned into this when it's read.
  at: string;
  who: string;
  event: string;
  subject: string;
  from: string;
}

const entries: Entry[] = (
  [
    ["2026-10-08T09:42", "Grace Hopper", "Approved an invoice", "INV-2041"],
    ["2026-10-08T08:55", "Alan Turing", "Refunded an order", "ORD-7228"],
    ["2026-10-07T16:31", "Ada Lovelace", "Changed the plan", "Business"],
    ["2026-10-07T11:04", "Ada Lovelace", "Signed in", "Chrome on Windows"],
    ["2026-10-06T14:20", "Katherine Johnson", "Invited", "dorothy@example.com"],
    ["2026-10-06T11:02", "Edsger Dijkstra", "Exported a report", "September"],
    ["2026-10-03T17:45", "Grace Hopper", "Changed a role", "Alan Turing"],
    ["2026-10-02T09:12", "Alan Turing", "Created a token", "Reporting"],
    ["2026-09-30T15:38", "Ada Lovelace", "Updated the card", "Ending in 4242"],
    ["2026-09-29T10:07", "Edsger Dijkstra", "Deleted a project", "Old site"],
    ["2026-09-26T13:50", "Katherine Johnson", "Signed in", "Safari on macOS"],
    ["2026-09-24T08:30", "Grace Hopper", "Revoked a token", "Old reporting"],
  ] as const
).map(([at, who, event, subject], index) => ({
  id: `entry-${index + 1}`,
  at,
  who,
  event,
  subject,
  from: `203.0.113.${(index * 37) % 200}`,
}));

const time = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

// The day after, at midnight: the end of a range takes in its whole last
// day.
const after = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

const helper = createColumnHelper<Entry>();
const columns = helper.columns([
  helper.accessor("at", {
    header: "Time",
    enableHiding: false,
    enableGlobalFilter: false,
    cell: (cell) => (
      <time dateTime={cell.getValue()}>
        {time.format(new Date(cell.getValue()))}
      </time>
    ),
    // The filter is the range from the date fields. Either end may be
    // missing while it's being picked.
    filterFn: (row, _column, range: DateRange) => {
      const at = new Date(row.original.at);
      return (
        (!range.from || at >= range.from) && (!range.to || at < after(range.to))
      );
    },
  }),
  helper.accessor("who", { header: "Person" }),
  helper.accessor("event", { header: "Event" }),
  helper.accessor("subject", { header: "Subject" }),
  helper.accessor("from", { header: "Address" }),
]);

export default function AuditLog() {
  const table = useDataTable({
    columns,
    data: entries,
    getRowId: (entry) => entry.id,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 5 },
      sorting: [{ id: "at", desc: true }],
      // Hidden to begin with, and in the list of columns to show.
      columnVisibility: { from: false },
    },
  });

  const at = table.getColumn("at");
  const range = (at?.getFilterValue() as DateRange | undefined) ?? null;

  return (
    <main className="audit-log">
      <header className="audit-log__head">
        <div className="audit-log__about">
          <h1 className="audit-log__title">Audit log</h1>
          <p className="audit-log__text">
            Who did what in this workspace, kept for a year.
          </p>
        </div>
        <Button intent="secondary">
          <Download aria-hidden="true" size={16} />
          Export
        </Button>
      </header>
      <DataTable
        table={table}
        aria-label="Audit log"
        getRowLabel={(row) => `${row.original.event}, ${row.original.who}`}
        toolbar={
          <DataTableToolbar>
            <table.Filter />
            <div className="audit-log__dates">
              <DateRangePicker
                aria-label="Dates"
                value={range}
                // No day at either end is no filter at all.
                onValueChange={(value) =>
                  at?.setFilterValue(
                    value?.from || value?.to ? value : undefined,
                  )
                }
              />
            </div>
            <span className="audit-log__gap" />
            <table.ColumnChooser />
          </DataTableToolbar>
        }
      />
    </main>
  );
}
