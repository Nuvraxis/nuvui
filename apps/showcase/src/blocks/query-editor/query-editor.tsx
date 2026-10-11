"use client";

import {
  Button,
  Resizable,
  ResizableHandle,
  ResizablePanel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  useResizableLayout,
} from "@nuvui/react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@nuvui/table";
import { Play } from "lucide-react";
import { useState } from "react";
import "./query-editor.scss";

// Made-up queries and made-up rows. Nothing here is real data, and nothing
// here runs SQL.

interface Query {
  id: string;
  name: string;
  sql: string;
  columns: string[];
  rows: string[][];
}

const queries: Query[] = [
  {
    id: "overdue",
    name: "Overdue invoices",
    sql: "select number, customer, due, amount\nfrom invoices\nwhere status = 'overdue'\norder by due;",
    columns: ["number", "customer", "due", "amount"],
    rows: [
      ["INV-2019", "Northwind", "2026-09-12", "1,240.00"],
      ["INV-2024", "Contoso", "2026-09-20", "860.00"],
      ["INV-2031", "Fabrikam", "2026-09-28", "2,115.50"],
      ["INV-2033", "Wingtip Toys", "2026-10-01", "455.00"],
    ],
  },
  {
    id: "largest",
    name: "Largest customers",
    sql: "select customer, count(*) as invoices, sum(amount) as total\nfrom invoices\ngroup by customer\norder by total desc\nlimit 5;",
    columns: ["customer", "invoices", "total"],
    rows: [
      ["Fabrikam", "14", "31,208.00"],
      ["Northwind", "11", "24,910.75"],
      ["Contoso", "9", "18,455.00"],
      ["Adventure Works", "6", "12,300.00"],
      ["Wingtip Toys", "5", "7,125.50"],
    ],
  },
  {
    id: "paid",
    name: "Paid this month",
    sql: "select number, customer, paid_on, amount\nfrom invoices\nwhere status = 'paid'\n  and paid_on >= date '2026-10-01';",
    columns: ["number", "customer", "paid_on", "amount"],
    rows: [
      ["INV-2036", "Adventure Works", "2026-10-03", "2,050.00"],
      ["INV-2038", "Northwind", "2026-10-06", "990.00"],
    ],
  },
];

const first = queries[0] as Query;

export default function QueryEditor() {
  const [chosen, setChosen] = useState(first);
  const [sql, setSql] = useState(first.sql);
  const [result, setResult] = useState(first);
  // The panels' sizes, kept in the browser for the next visit.
  const layout = useResizableLayout({ id: "query-editor" });

  function choose(id: string) {
    const query = queries.find((other) => other.id === id) ?? first;
    setChosen(query);
    setSql(query.sql);
  }

  // This would send the SQL to your server. Here it shows the rows of the
  // saved query that's chosen, whatever has been typed.
  function run() {
    setResult(chosen);
  }

  return (
    <main className="query-editor">
      <header className="query-editor__head">
        <h1 className="query-editor__title">Query</h1>
        <p className="query-editor__text">
          Drag the line between the query and its rows, or give it focus and use
          the arrow keys.
        </p>
      </header>

      <div className="query-editor__work">
        <Resizable orientation="vertical" {...layout}>
          <ResizablePanel
            id="query"
            defaultSize="45%"
            minSize="30%"
            className="query-editor__pane"
          >
            <Textarea
              aria-label="SQL"
              className="query-editor__sql"
              spellCheck={false}
              value={sql}
              onChange={(event) => setSql(event.target.value)}
            />
            <div className="query-editor__actions">
              <Select value={chosen.id} onValueChange={choose}>
                <SelectTrigger
                  aria-label="Saved query"
                  className="query-editor__saved"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {queries.map((query) => (
                    <SelectItem key={query.id} value={query.id}>
                      {query.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={run}>
                <Play aria-hidden="true" size={16} />
                Run
              </Button>
            </div>
          </ResizablePanel>
          <ResizableHandle withGrip aria-label="Resize the query" />
          <ResizablePanel
            id="rows"
            minSize="25%"
            className="query-editor__pane query-editor__pane--rows"
          >
            {/* In the page from the start, so a screen reader hears each
                new set of rows. */}
            <p role="status" className="query-editor__count">
              {result.name}: {result.rows.length}{" "}
              {result.rows.length === 1 ? "row" : "rows"}
            </p>
            <TableContainer aria-label="Rows">
              <Table className="query-editor__table">
                <TableHeader>
                  <TableRow>
                    {result.columns.map((column) => (
                      <TableHead key={column}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((row) => (
                    <TableRow key={row[0]}>
                      {result.columns.map((column, at) => (
                        <TableCell key={column}>{row[at]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </ResizablePanel>
        </Resizable>
      </div>
    </main>
  );
}
