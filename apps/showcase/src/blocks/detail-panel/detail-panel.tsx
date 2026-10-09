"use client";

import {
  Badge,
  Button,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@nuvui/react";
import { ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import "./detail-panel.scss";

// Made-up customers. Nothing here is real data.

interface Customer {
  id: string;
  name: string;
  contact: string;
  email: string;
  plan: string;
  since: string;
  active: boolean;
  orders: { id: string; when: string; total: string }[];
  note: string;
}

const customers: Customer[] = [
  {
    id: "northwind",
    name: "Northwind Traders",
    contact: "Grace Hopper",
    email: "grace@example.com",
    plan: "Business, yearly",
    since: "March 2021",
    active: true,
    orders: [
      { id: "ORD-7231", when: "8 October", total: "$1,840" },
      { id: "ORD-7102", when: "12 September", total: "$760" },
      { id: "ORD-6990", when: "3 August", total: "$2,120" },
    ],
    note: "Pays by bank transfer. Send invoices to the accounts address.",
  },
  {
    id: "contoso",
    name: "Contoso",
    contact: "Alan Turing",
    email: "alan@example.com",
    plan: "Team, monthly",
    since: "June 2023",
    active: true,
    orders: [
      { id: "ORD-7230", when: "7 October", total: "$620" },
      { id: "ORD-7011", when: "19 August", total: "$1,995" },
    ],
    note: "Asked for a quote for 40 more seats in November.",
  },
  {
    id: "fabrikam",
    name: "Fabrikam",
    contact: "Katherine Johnson",
    email: "katherine@example.com",
    plan: "Business, monthly",
    since: "January 2022",
    active: true,
    orders: [{ id: "ORD-7229", when: "6 October", total: "$2,315" }],
    note: "The contact changes in January.",
  },
  {
    id: "adventure",
    name: "Adventure Works",
    contact: "Edsger Dijkstra",
    email: "edsger@example.com",
    plan: "Team, yearly",
    since: "September 2020",
    active: false,
    orders: [],
    note: "Paused the account in July. Follow up in the new year.",
  },
  {
    id: "tailspin",
    name: "Tailspin Toys",
    contact: "Ada Lovelace",
    email: "ada@example.com",
    plan: "Business, yearly",
    since: "November 2024",
    active: true,
    orders: [
      { id: "ORD-7227", when: "4 October", total: "$980" },
      { id: "ORD-7090", when: "9 September", total: "$455" },
    ],
    note: "Prefers a call to an email.",
  },
];

export default function DetailPanel() {
  // The customer stays set while the panel slides away, so its words don't
  // go before it does.
  const [customer, setCustomer] = useState(customers[0]);
  const [open, setOpen] = useState(false);
  // The row that opened the panel, to put focus back on when it closes.
  // A panel with a trigger of its own does this itself. This one is opened
  // by any of the rows.
  const opener = useRef<HTMLButtonElement | null>(null);

  return (
    <main className="detail-panel">
      <header className="detail-panel__head">
        <h1 className="detail-panel__title">Customers</h1>
        <p className="detail-panel__text">
          Choose a customer to see their details beside the list.
        </p>
      </header>
      <ul className="detail-panel__list">
        {customers.map((item) => (
          <li key={item.id} className="detail-panel__item">
            <button
              type="button"
              className="detail-panel__row"
              onClick={(event) => {
                opener.current = event.currentTarget;
                setCustomer(item);
                setOpen(true);
              }}
            >
              <span className="detail-panel__who">
                <span className="detail-panel__name">{item.name}</span>
                <span className="detail-panel__plan">{item.plan}</span>
              </span>
              <Badge
                intent={item.active ? "success" : "neutral"}
                variant="outline"
              >
                {item.active ? "Active" : "Paused"}
              </Badge>
              <ChevronRight
                aria-hidden="true"
                size={16}
                className="detail-panel__arrow"
              />
            </button>
          </li>
        ))}
      </ul>
      <Sheet open={open} onOpenChange={setOpen}>
        {customer ? (
          <SheetContent
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              opener.current?.focus();
            }}
          >
            <SheetHeader>
              <SheetTitle>{customer.name}</SheetTitle>
              <SheetDescription>
                {customer.plan}. A customer since {customer.since}.
              </SheetDescription>
            </SheetHeader>
            <SheetBody>
              <Tabs defaultValue="details" className="detail-panel__tabs">
                <TabsList aria-label={`About ${customer.name}`}>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  <dl className="detail-panel__facts">
                    <div className="detail-panel__fact">
                      <dt className="detail-panel__label">Contact</dt>
                      <dd className="detail-panel__value">
                        {customer.contact}
                      </dd>
                    </div>
                    <div className="detail-panel__fact">
                      <dt className="detail-panel__label">Email</dt>
                      <dd className="detail-panel__value">{customer.email}</dd>
                    </div>
                    <div className="detail-panel__fact">
                      <dt className="detail-panel__label">Plan</dt>
                      <dd className="detail-panel__value">{customer.plan}</dd>
                    </div>
                    <div className="detail-panel__fact">
                      <dt className="detail-panel__label">Status</dt>
                      <dd className="detail-panel__value">
                        {customer.active ? "Active" : "Paused"}
                      </dd>
                    </div>
                  </dl>
                </TabsContent>
                <TabsContent value="orders">
                  {customer.orders.length > 0 ? (
                    <ul className="detail-panel__orders">
                      {customer.orders.map((order) => (
                        <li key={order.id} className="detail-panel__order">
                          <span className="detail-panel__value">
                            {order.id}
                          </span>
                          <span className="detail-panel__label">
                            {order.when}
                          </span>
                          <span className="detail-panel__total">
                            {order.total}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="detail-panel__note">No orders this year.</p>
                  )}
                </TabsContent>
                <TabsContent value="notes">
                  <p className="detail-panel__note">{customer.note}</p>
                </TabsContent>
              </Tabs>
            </SheetBody>
            <SheetFooter>
              <SheetClose asChild>
                <Button intent="secondary">Close</Button>
              </SheetClose>
              <Button asChild>
                <a href={`#${customer.id}`}>Open the full page</a>
              </Button>
            </SheetFooter>
          </SheetContent>
        ) : null}
      </Sheet>
    </main>
  );
}
