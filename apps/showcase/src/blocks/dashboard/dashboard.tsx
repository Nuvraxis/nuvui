"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartColor,
  chartDash,
  chartFill,
} from "@nuvui/charts";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMain,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  Stat,
  StatDescription,
  StatLabel,
  StatValue,
  Trend,
} from "@nuvui/react";
import { DataTable } from "@nuvui/table";
import { createColumnHelper, useDataTable } from "@nuvui/table/full";
import {
  ChartColumn,
  Download,
  FileText,
  Hexagon,
  Inbox,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import "./dashboard.scss";

// Made-up figures for a made-up shop. Nothing here is real data.

const pages = [
  { label: "Overview", href: "#overview", Icon: LayoutDashboard, active: true },
  { label: "Inbox", href: "#inbox", Icon: Inbox, badge: "12" },
  { label: "Reports", href: "#reports", Icon: ChartColumn },
  { label: "Customers", href: "#customers", Icon: Users },
  { label: "Invoices", href: "#invoices", Icon: FileText },
  { label: "Settings", href: "#settings", Icon: Settings },
];

interface Figure {
  label: string;
  value: string;
  // Against the month before, as a ratio.
  change: number;
  // Which way is good news. A refund rate going down is.
  good: "up" | "down";
  // The change in words, where it isn't a percentage.
  said?: string;
}

const figures: Figure[] = [
  { label: "Revenue", value: "$73,400", change: 0.047, good: "up" },
  { label: "Orders", value: "899", change: 0.061, good: "up" },
  { label: "New customers", value: "214", change: -0.023, good: "up" },
  {
    label: "Refund rate",
    value: "1.8%",
    change: -0.004,
    said: "0.4 pts",
    good: "down",
  },
];

const months = [
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

const revenueConfig = {
  revenue: { label: "Revenue" },
  target: { label: "Target", dash: "dashed" },
} satisfies ChartConfig;

type Status = "Paid" | "Pending" | "Refunded";

interface Order {
  id: string;
  customer: string;
  channel: string;
  status: Status;
  total: number;
}

const orders: Order[] = [
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
    total: 1270,
  },
  {
    id: "ORD-7224",
    customer: "Proseware",
    channel: "Partners",
    status: "Paid",
    total: 3120,
  },
];

const intents = {
  Paid: "success",
  Pending: "warning",
  Refunded: "neutral",
} as const satisfies Record<Status, string>;

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const money = (value: unknown) => dollars.format(Number(value));
const short = (value: number) => `$${Math.round(value / 1000)}K`;

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

function Orders() {
  const table = useDataTable({
    columns,
    data: orders,
    getRowId: (order) => order.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
  });

  return <DataTable table={table} aria-label="Recent orders" rowHeader="id" />;
}

export default function Dashboard() {
  return (
    <SidebarProvider className="dashboard">
      <Sidebar label="Main">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Acme, home">
                <a href="#home">
                  <Hexagon aria-hidden="true" />
                  <span className="dashboard__brand">Acme</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Shop</SidebarGroupLabel>
            <SidebarMenu>
              {pages.map(({ label, href, Icon, active, badge }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild active={active} tooltip={label}>
                    <a href={href} aria-current={active ? "page" : undefined}>
                      <Icon aria-hidden="true" />
                      <span>{label}</span>
                      {badge ? (
                        <SidebarMenuBadge>{badge}</SidebarMenuBadge>
                      ) : null}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarMain className="dashboard__main">
        <header className="dashboard__bar">
          <SidebarTrigger />
          <div className="dashboard__heading">
            <h1 className="dashboard__title">Overview</h1>
            <p className="dashboard__period">October</p>
          </div>
          <Button intent="secondary" size="sm">
            <Download aria-hidden="true" size={16} />
            Export
          </Button>
        </header>
        <div className="dashboard__page">
          <ul className="dashboard__figures">
            {figures.map((figure) => (
              <li key={figure.label}>
                <Stat className="dashboard__figure">
                  <StatLabel>{figure.label}</StatLabel>
                  <StatValue>{figure.value}</StatValue>
                  <StatDescription>
                    {/* The arrow says which way, and the color says whether
                        that's good. */}
                    <Trend value={figure.change} good={figure.good}>
                      {figure.said}
                    </Trend>{" "}
                    against September
                  </StatDescription>
                </Stat>
              </li>
            ))}
          </ul>
          <Card>
            <CardHeader>
              <CardTitle asChild>
                <h2>Revenue</h2>
              </CardTitle>
              <CardDescription>Each month against its target.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={revenueConfig}
                aria-label="Revenue by month against target, November to October"
                className="dashboard__chart"
                formatValue={money}
                table={
                  <ChartTable
                    data={months}
                    category="month"
                    categoryLabel="Month"
                  />
                }
              >
                <ComposedChart
                  data={months}
                  margin={{ left: 0, right: 8, top: 8 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    tickFormatter={short}
                  />
                  <ChartTooltip />
                  <ChartLegend />
                  <Area
                    dataKey="revenue"
                    type="monotone"
                    fill={chartFill("revenue")}
                    fillOpacity={0.25}
                    stroke={chartColor("revenue")}
                    strokeWidth={2}
                  />
                  <Line
                    dataKey="target"
                    type="monotone"
                    stroke={chartColor("target")}
                    strokeDasharray={chartDash("target")}
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle asChild>
                <h2>Recent orders</h2>
              </CardTitle>
              <CardDescription>
                Sort by a heading, search, or choose the columns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Orders />
            </CardContent>
          </Card>
        </div>
      </SidebarMain>
    </SidebarProvider>
  );
}
