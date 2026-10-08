import type { ChartConfig } from "@nuvui/charts";

// Made-up figures for a made-up shop. Nothing here is real data.

export const months = [
  { month: "Nov", revenue: 42100, target: 40000 },
  { month: "Dec", revenue: 58300, target: 52000 },
  { month: "Jan", revenue: 39800, target: 42000 },
  { month: "Feb", revenue: 44200, target: 44000 },
  { month: "Mar", revenue: 51700, target: 46000 },
  { month: "Apr", revenue: 49300, target: 48000 },
  { month: "May", revenue: 55900, target: 50000 },
  { month: "Jun", revenue: 61200, target: 52000 },
  { month: "Jul", revenue: 58800, target: 54000 },
  { month: "Aug", revenue: 64500, target: 56000 },
  { month: "Sep", revenue: 70100, target: 58000 },
  { month: "Oct", revenue: 73400, target: 60000 },
];

export const revenueConfig = {
  revenue: { label: "Revenue" },
  target: { label: "Target", dash: "dashed" },
} satisfies ChartConfig;

export const channels = [
  { channel: "Web", orders: 412, returns: 18 },
  { channel: "App", orders: 286, returns: 9 },
  { channel: "Partners", orders: 143, returns: 11 },
  { channel: "Phone", orders: 58, returns: 2 },
];

export const channelsConfig = {
  orders: { label: "Orders" },
  returns: { label: "Returns" },
} satisfies ChartConfig;

export type Status = "Paid" | "Pending" | "Refunded";

export interface Order {
  id: string;
  customer: string;
  channel: string;
  status: Status;
  total: number;
}

export const orders: Order[] = [
  {
    id: "ORD-7231",
    customer: "Northwind Traders",
    channel: "Web",
    status: "Paid",
    total: 1840,
  },
  {
    id: "ORD-7230",
    customer: "Contoso",
    channel: "Partners",
    status: "Pending",
    total: 620,
  },
  {
    id: "ORD-7229",
    customer: "Fabrikam",
    channel: "App",
    status: "Paid",
    total: 2315,
  },
  {
    id: "ORD-7228",
    customer: "Adventure Works",
    channel: "Web",
    status: "Refunded",
    total: 149,
  },
  {
    id: "ORD-7227",
    customer: "Tailspin Toys",
    channel: "Phone",
    status: "Paid",
    total: 980,
  },
  {
    id: "ORD-7226",
    customer: "Wingtip Toys",
    channel: "Web",
    status: "Paid",
    total: 455,
  },
  {
    id: "ORD-7225",
    customer: "Litware",
    channel: "App",
    status: "Pending",
    total: 1290,
  },
  {
    id: "ORD-7224",
    customer: "Proseware",
    channel: "Partners",
    status: "Paid",
    total: 3120,
  },
  {
    id: "ORD-7223",
    customer: "Woodgrove Bank",
    channel: "Web",
    status: "Paid",
    total: 760,
  },
  {
    id: "ORD-7222",
    customer: "Blue Yonder",
    channel: "App",
    status: "Refunded",
    total: 88,
  },
  {
    id: "ORD-7221",
    customer: "Coho Winery",
    channel: "Web",
    status: "Paid",
    total: 1475,
  },
  {
    id: "ORD-7220",
    customer: "Lucerne Publishing",
    channel: "Phone",
    status: "Pending",
    total: 540,
  },
];

export interface Figure {
  label: string;
  value: string;
  change: string;
  // Whether the change is the good direction, which isn't always up.
  good: boolean;
  note: string;
}

export const figures: Figure[] = [
  {
    label: "Revenue",
    value: "$73,400",
    change: "+4.7%",
    good: true,
    note: "against September",
  },
  {
    label: "Orders",
    value: "899",
    change: "+6.1%",
    good: true,
    note: "against September",
  },
  {
    label: "New customers",
    value: "214",
    change: "-2.3%",
    good: false,
    note: "against September",
  },
  {
    label: "Refund rate",
    value: "1.8%",
    change: "-0.4 pts",
    good: true,
    note: "against September",
  },
];

// The locale is written out. The page is rendered when the site is built
// and again in the browser, and each one's own default could differ.
const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const thousands = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 0,
});

export const money = (value: number | string) => dollars.format(Number(value));
export const short = (value: number | string) =>
  `$${thousands.format(Number(value))}`;
