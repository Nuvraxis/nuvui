"use client";

import { Badge } from "@nuvui/react/badge";
import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import { money, type Order, orders, type Status } from "./data";

const intents = {
  Paid: "success",
  Pending: "warning",
  Refunded: "neutral",
} as const satisfies Record<Status, string>;

const helper = createColumnHelper<Order>();
const columns = helper.columns([
  helper.accessor("id", { header: "Order" }),
  helper.accessor("customer", { header: "Customer" }),
  helper.accessor("channel", { header: "Channel" }),
  helper.accessor("status", {
    header: "Status",
    cell: (cell) => (
      <Badge intent={intents[cell.getValue()]} variant="outline">
        {cell.getValue()}
      </Badge>
    ),
  }),
  helper.accessor("total", {
    header: "Total",
    cell: (cell) => money(cell.getValue()),
    meta: { align: "end" },
  }),
]);

export function OrdersTable() {
  const table = useDataTable({
    columns,
    data: orders,
    getRowId: (order) => order.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 6 } },
  });

  return <DataTable table={table} aria-label="Recent orders" rowHeader="id" />;
}
