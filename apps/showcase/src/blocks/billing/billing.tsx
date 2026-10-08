"use client";

import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Progress,
} from "@nuvui/react";
import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { CreditCard, Download } from "lucide-react";
import "./billing.scss";

// A made-up plan, card and invoices. Nothing here is real data.

const seats = { used: 18, included: 25 };

interface Invoice {
  id: string;
  date: string;
  amount: number;
  paid: boolean;
}

const invoices: Invoice[] = [
  { id: "INV-2041", date: "2026-10-01", amount: 522, paid: false },
  { id: "INV-1987", date: "2026-09-01", amount: 522, paid: true },
  { id: "INV-1930", date: "2026-08-01", amount: 493, paid: true },
  { id: "INV-1876", date: "2026-07-01", amount: 493, paid: true },
];

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
const columns = helper.columns([
  helper.accessor("id", { header: "Invoice" }),
  helper.accessor("date", {
    header: "Date",
    cell: (cell) => day.format(new Date(cell.getValue())),
  }),
  helper.accessor("paid", {
    header: "Status",
    cell: (cell) => (
      <Badge intent={cell.getValue() ? "success" : "warning"} variant="outline">
        {cell.getValue() ? "Paid" : "Due"}
      </Badge>
    ),
  }),
  helper.accessor("amount", {
    header: "Amount",
    cell: (cell) => dollars.format(cell.getValue()),
    meta: { align: "end" },
  }),
  helper.display({
    id: "file",
    header: "File",
    cell: ({ row }) => (
      <a
        className="billing__link"
        href={`#${row.original.id}`}
        aria-label={`Download ${row.original.id}`}
      >
        <Download aria-hidden="true" size={16} />
        Download
      </a>
    ),
  }),
]);

function Invoices() {
  const table = useDataTable({
    columns,
    data: invoices,
    getRowId: (invoice) => invoice.id,
  });

  return (
    <DataTable
      table={table}
      aria-labelledby="billing-invoices"
      rowHeader="id"
      toolbar={false}
      pagination={false}
    />
  );
}

export default function Billing() {
  return (
    <main className="billing">
      <header className="billing__head">
        <h1 className="billing__title">Billing</h1>
        <p className="billing__text">
          Your plan, how you pay for it, and what you've been charged.
        </p>
      </header>
      <div className="billing__pair">
        <Card className="billing__panel">
          <CardHeader>
            <CardDescription>Plan</CardDescription>
            <CardTitle asChild>
              <h2>Business</h2>
            </CardTitle>
            <CardAction>
              <Badge intent="primary" variant="outline">
                Monthly
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="billing__body">
            <p className="billing__price">
              <span className="billing__amount">$29</span> for each person, each
              month
            </p>
            <div className="billing__seats">
              <p className="billing__label" id="billing-seats">
                {seats.used} of {seats.included} seats used
              </p>
              <Progress
                value={seats.used}
                max={seats.included}
                aria-labelledby="billing-seats"
                getValueLabel={(value, max) => `${value} of ${max}`}
              />
            </div>
            <p className="billing__note">Renews on November 1, 2026.</p>
          </CardContent>
          <CardFooter className="billing__actions">
            <Button>Change plan</Button>
            <Button intent="secondary">Add seats</Button>
          </CardFooter>
        </Card>
        <Card className="billing__panel">
          <CardHeader>
            <CardDescription>Payment</CardDescription>
            <CardTitle asChild>
              <h2>Card ending in 4242</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="billing__body">
            <p className="billing__card">
              <CreditCard aria-hidden="true" size={20} />
              Expires 08/2028
            </p>
            <p className="billing__note">
              Invoices go to accounts@example.com on the first of the month.
            </p>
          </CardContent>
          <CardFooter className="billing__actions">
            <Button intent="secondary">Update the card</Button>
            <Button intent="ghost">Change the address</Button>
          </CardFooter>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle asChild>
            <h2 id="billing-invoices">Invoices</h2>
          </CardTitle>
          <CardDescription>The last four months.</CardDescription>
        </CardHeader>
        <CardContent>
          <Invoices />
        </CardContent>
      </Card>
    </main>
  );
}
