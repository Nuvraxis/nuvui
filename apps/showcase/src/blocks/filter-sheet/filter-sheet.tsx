"use client";

import {
  Badge,
  Button,
  Checkbox,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  FormattedNumber,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
  Label,
  NumberField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHandle,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@nuvui/react";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import "./filter-sheet.scss";

// Made-up orders. `days` is how long ago each was placed.
const orders = [
  {
    id: "ORD-7231",
    who: "Harbor and Pine",
    total: 1240,
    status: "paid",
    method: "card",
    days: 1,
  },
  {
    id: "ORD-7230",
    who: "Blue Kettle",
    total: 86,
    status: "paid",
    method: "card",
    days: 2,
  },
  {
    id: "ORD-7229",
    who: "Fernhill Supply",
    total: 430,
    status: "refunded",
    method: "bank",
    days: 4,
  },
  {
    id: "ORD-7228",
    who: "Quarry Lane",
    total: 2915,
    status: "paid",
    method: "invoice",
    days: 6,
  },
  {
    id: "ORD-7227",
    who: "Saltmarsh Books",
    total: 58,
    status: "refunded",
    method: "card",
    days: 11,
  },
  {
    id: "ORD-7226",
    who: "Tin Roof Studio",
    total: 712,
    status: "paid",
    method: "bank",
    days: 19,
  },
  {
    id: "ORD-7225",
    who: "Longacre Farms",
    total: 149,
    status: "paid",
    method: "card",
    days: 27,
  },
  {
    id: "ORD-7224",
    who: "Copperline",
    total: 3380,
    status: "paid",
    method: "invoice",
    days: 64,
  },
  {
    id: "ORD-7223",
    who: "Elm Street Bakery",
    total: 95,
    status: "refunded",
    method: "card",
    days: 120,
  },
  {
    id: "ORD-7222",
    who: "Windrow Cycles",
    total: 1675,
    status: "paid",
    method: "bank",
    days: 210,
  },
];

const methods = [
  { id: "card", name: "Card" },
  { id: "bank", name: "Bank transfer" },
  { id: "invoice", name: "Invoice" },
];

const dollars = { currency: "USD", maximumFractionDigits: 0 } as const;

export default function FilterSheet() {
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("30");
  const [paidBy, setPaidBy] = useState(methods.map((method) => method.id));
  const [least, setLeast] = useState<number | null>(null);

  // In an app the filters go to your server with the request for the rows.
  const shown = orders.filter(
    (order) =>
      (status === "all" || order.status === status) &&
      order.days <= Number(period) &&
      paidBy.includes(order.method) &&
      order.total >= (least ?? 0),
  );
  const more = (paidBy.length < methods.length ? 1 : 0) + (least ? 1 : 0);
  const count = `${shown.length} ${shown.length === 1 ? "order" : "orders"}`;

  return (
    <main className="filter-sheet">
      <header className="filter-sheet__head">
        <h1 className="filter-sheet__title">Orders</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button intent="secondary">
              <SlidersHorizontal aria-hidden="true" size={16} />
              More filters
              {more > 0 ? (
                <Badge intent="primary">
                  {more}
                  <span className="filter-sheet__hidden"> in use</span>
                </Badge>
              ) : null}
            </Button>
          </SheetTrigger>
          {/* It opens half way up, where the page can still be seen, and
              can be pulled nearly to the top. */}
          <SheetContent side="bottom" stops={[0.5, 0.92]}>
            <SheetHandle />
            <SheetHeader>
              <SheetTitle>More filters</SheetTitle>
              <SheetDescription>
                The list changes as you choose.
              </SheetDescription>
            </SheetHeader>
            <SheetBody>
              <div className="filter-sheet__fields">
                <fieldset className="filter-sheet__group">
                  <legend className="filter-sheet__legend">Paid by</legend>
                  {methods.map((method) => (
                    <div key={method.id} className="filter-sheet__choice">
                      <Checkbox
                        id={`filter-sheet-${method.id}`}
                        checked={paidBy.includes(method.id)}
                        onCheckedChange={(checked) =>
                          setPaidBy((current) =>
                            checked === true
                              ? [...current, method.id]
                              : current.filter((id) => id !== method.id),
                          )
                        }
                      />
                      <Label htmlFor={`filter-sheet-${method.id}`}>
                        {method.name}
                      </Label>
                    </div>
                  ))}
                </fieldset>
                <Field className="filter-sheet__least">
                  <FieldLabel>Total of at least</FieldLabel>
                  <FieldControl>
                    <NumberField
                      min={0}
                      step={50}
                      value={least}
                      onValueChange={setLeast}
                      format={dollars}
                    />
                  </FieldControl>
                  <FieldDescription>Empty means any total.</FieldDescription>
                </Field>
              </div>
            </SheetBody>
            <SheetFooter>
              <Button
                intent="secondary"
                onClick={() => {
                  setPaidBy(methods.map((method) => method.id));
                  setLeast(null);
                }}
              >
                Clear
              </Button>
              <SheetClose asChild>
                <Button>Show {count}</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </header>

      {/* The two filters people change most are in the sentence that says
          what the list is. */}
      <p className="filter-sheet__sentence">
        Showing{" "}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger variant="inline" aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">all orders</SelectItem>
            <SelectItem value="paid">paid orders</SelectItem>
            <SelectItem value="refunded">refunded orders</SelectItem>
          </SelectContent>
        </Select>{" "}
        from{" "}
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger variant="inline" aria-label="Period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">the last 7 days</SelectItem>
            <SelectItem value="30">the last 30 days</SelectItem>
            <SelectItem value="365">the last year</SelectItem>
          </SelectContent>
        </Select>
        .
      </p>
      {/* In the page from the start, so a screen reader hears each change. */}
      <p role="status" className="filter-sheet__count">
        {count}
      </p>

      {shown.length > 0 ? (
        <ItemGroup variant="outline" aria-label="Orders">
          {shown.map((order) => (
            <Item key={order.id}>
              <ItemContent>
                <ItemTitle>{order.who}</ItemTitle>
                <ItemDescription>
                  {order.id},{" "}
                  {order.days === 1 ? "yesterday" : `${order.days} days ago`}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                {order.status === "refunded" ? (
                  <Badge intent="warning" variant="outline">
                    Refunded
                  </Badge>
                ) : null}
                <span className="filter-sheet__total">
                  <FormattedNumber value={order.total} {...dollars} />
                </span>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      ) : (
        <p className="filter-sheet__none">
          No orders match. Try a longer period, or fewer filters.
        </p>
      )}
    </main>
  );
}
