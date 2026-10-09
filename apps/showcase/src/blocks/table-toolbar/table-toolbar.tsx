"use client";

import {
  Badge,
  Button,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@nuvui/react";
import { DataTable, DataTableToolbar } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { Ellipsis, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import "./table-toolbar.scss";

// Made-up invoices. Nothing here is real data.

const statuses = ["Paid", "Open", "Overdue", "Draft"] as const;
type Status = (typeof statuses)[number];

interface Invoice {
  id: string;
  customer: string;
  status: Status;
  due: string;
  amount: number;
}

const invoices: Invoice[] = (
  [
    ["INV-2041", "Northwind Traders", "Paid", "2026-10-02", 1840],
    ["INV-2040", "Contoso", "Open", "2026-10-21", 620],
    ["INV-2039", "Fabrikam", "Overdue", "2026-09-28", 2315],
    ["INV-2038", "Adventure Works", "Paid", "2026-09-30", 149],
    ["INV-2037", "Tailspin Toys", "Draft", "2026-11-04", 980],
    ["INV-2036", "Wingtip Toys", "Open", "2026-10-18", 455],
    ["INV-2035", "Litware", "Paid", "2026-09-22", 1270],
    ["INV-2034", "Proseware", "Overdue", "2026-09-15", 3120],
    ["INV-2033", "Northwind Traders", "Paid", "2026-09-12", 760],
    ["INV-2032", "Contoso", "Draft", "2026-11-10", 1995],
    ["INV-2031", "Fabrikam", "Open", "2026-10-25", 340],
    ["INV-2030", "Litware", "Paid", "2026-09-05", 2680],
  ] as const
).map(([id, customer, status, due, amount]) => ({
  id,
  customer,
  status,
  due,
  amount,
}));

const intents = {
  Paid: "success",
  Open: "primary",
  Overdue: "danger",
  Draft: "neutral",
} as const satisfies Record<Status, string>;

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
// The dates have no time, so they're read and written as UTC. A reader west
// of Greenwich would otherwise see the day before.
const day = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

const helper = createColumnHelper<Invoice>();

export default function TableToolbar() {
  const [rows, setRows] = useState(invoices);

  const columns = useMemo(() => {
    // Change the invoices on your server from these two.
    const pay = (id: string) =>
      setRows((current) =>
        current.map((invoice) =>
          invoice.id === id ? { ...invoice, status: "Paid" } : invoice,
        ),
      );
    const remove = (id: string) =>
      setRows((current) => current.filter((invoice) => invoice.id !== id));

    return helper.columns([
      helper.select(),
      // Always there, and so not in the list of columns to hide.
      helper.accessor("id", { header: "Invoice", enableHiding: false }),
      helper.accessor("customer", { header: "Customer" }),
      helper.accessor("status", {
        header: "Status",
        cell: (cell) => (
          <Badge intent={intents[cell.getValue()]} variant="outline">
            {cell.getValue()}
          </Badge>
        ),
        // The filter is the list of statuses that are ticked.
        filterFn: (row, _column, picked: Status[]) =>
          picked.includes(row.original.status),
      }),
      helper.accessor("due", {
        header: "Due",
        cell: (cell) => day.format(new Date(cell.getValue())),
      }),
      helper.accessor("amount", {
        header: "Amount",
        cell: (cell) => dollars.format(cell.getValue()),
        meta: { align: "end" },
      }),
      helper.display({
        id: "actions",
        header: "Actions",
        enableHiding: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                intent="ghost"
                size="sm"
                className="table-toolbar__more"
                aria-label={`Actions for ${row.original.id}`}
              >
                <Ellipsis aria-hidden="true" size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href={`#${row.original.id}`}>Open</a>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={row.original.status === "Paid"}
                onSelect={() => pay(row.original.id)}
              >
                Mark as paid
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => remove(row.original.id)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ]);
  }, []);

  const table = useDataTable({
    columns,
    data: rows,
    // Selection is kept by id, so it stays with its invoice through a sort
    // or a delete.
    getRowId: (invoice) => invoice.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
  });

  const status = table.getColumn("status");
  const picked = (status?.getFilterValue() as Status[] | undefined) ?? [];

  function payAll(ids: string[]) {
    setRows((current) =>
      current.map((invoice) =>
        ids.includes(invoice.id) ? { ...invoice, status: "Paid" } : invoice,
      ),
    );
    table.resetRowSelection(true);
  }

  function removeAll(ids: string[]) {
    setRows((current) =>
      current.filter((invoice) => !ids.includes(invoice.id)),
    );
    // The table doesn't forget a row because it's gone from the data.
    table.resetRowSelection(true);
  }

  return (
    <main className="table-toolbar">
      <header className="table-toolbar__head">
        <div className="table-toolbar__about">
          <h1 className="table-toolbar__title">Invoices</h1>
          <p className="table-toolbar__text">
            Search, filter by status, choose the columns, and act on several at
            once.
          </p>
        </div>
        <Button>
          <Plus aria-hidden="true" size={16} />
          New invoice
        </Button>
      </header>
      <DataTable
        table={table}
        aria-label="Invoices"
        rowHeader="id"
        empty="There are no invoices yet."
        toolbar={
          <DataTableToolbar>
            <table.Filter />
            <Combobox
              multiple
              value={picked}
              // No status ticked is no filter at all.
              onValueChange={(value) =>
                status?.setFilterValue(value.length > 0 ? value : undefined)
              }
            >
              <ComboboxTrigger
                aria-label="Status"
                className="table-toolbar__status"
              >
                <ComboboxValue placeholder="Any status">
                  {picked.length === 1
                    ? picked[0]
                    : `${picked.length} statuses`}
                </ComboboxValue>
              </ComboboxTrigger>
              <ComboboxContent
                aria-label="Status"
                label="Search statuses"
                searchPlaceholder="Search"
              >
                <ComboboxEmpty>No status found.</ComboboxEmpty>
                {statuses.map((name) => (
                  <ComboboxItem key={name} value={name}>
                    {name}
                  </ComboboxItem>
                ))}
              </ComboboxContent>
            </Combobox>
            <span className="table-toolbar__gap" />
            <table.ColumnChooser />
          </DataTableToolbar>
        }
        bulkActions={(selected) => (
          <>
            <Button
              size="sm"
              intent="secondary"
              onClick={() => payAll(selected.map((row) => row.id))}
            >
              Mark as paid
            </Button>
            <Button
              size="sm"
              intent="danger"
              onClick={() => removeAll(selected.map((row) => row.id))}
            >
              Delete
            </Button>
          </>
        )}
      />
    </main>
  );
}
