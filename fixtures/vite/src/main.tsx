import "@nuvui/react/styles.css";
import "@nuvui/react/themes/ink.css";
import "@nuvui/date-picker/styles.css";
import "@nuvui/table/styles.css";
import "@nuvui/charts/styles.css";
// The chart package, from the entry of its one component.
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts/chart";
import { DatePicker, type DateRange } from "@nuvui/date-picker";
// An entry of the add-on's own, and one locale out of all it has.
import { Calendar } from "@nuvui/date-picker/calendar";
import { de } from "@nuvui/date-picker/locale";
import {
  Button,
  type ButtonProps,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Toaster,
  toast,
} from "@nuvui/react";
// The provider has an entry of its own that isn't a component's.
import { DirectionProvider } from "@nuvui/react/direction";
// One import from a component's own entry, to check that those resolve too.
import { Switch } from "@nuvui/react/switch";
// The table package, with a hook made for one feature. The others, and the
// virtual table's dependency, mustn't end up in the build: the second isn't
// even installed here.
import { createDataTableHook, DataTable } from "@nuvui/table";
import {
  createSortedRowModel,
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
} from "@tanstack/react-table";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Bar, BarChart, XAxis } from "recharts";

const size: ButtonProps["size"] = "lg";
const range: DateRange = { from: new Date(2026, 9, 12), to: undefined };

type Person = { id: string; name: string; team: string };
const people: Person[] = [
  { id: "1", name: "Cleo Park", team: "Design" },
  { id: "2", name: "Ada Lovelace", team: "Engineering" },
];
const { useDataTable, createColumnHelper } = createDataTableHook({
  features: tableFeatures({
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns: { text: sortFn_text },
  }),
});
const helper = createColumnHelper<Person>();
const columns = helper.columns([
  helper.accessor("name", { header: "Name" }),
  helper.accessor("team", { header: "Team" }),
]);

function People() {
  const table = useDataTable({ columns, data: people });
  return <DataTable table={table} caption="People" rowHeader="name" />;
}

const chartConfig = { seats: { label: "Seats" } } satisfies ChartConfig;
const seats = [
  { team: "Design", seats: 4 },
  { team: "Engineering", seats: 9 },
];

function Seats() {
  return (
    <ChartContainer config={chartConfig} aria-label="Seats by team">
      <BarChart data={seats}>
        <XAxis dataKey="team" />
        <ChartTooltip />
        <Bar dataKey="seats" fill={chartFill("seats")} />
      </BarChart>
    </ChartContainer>
  );
}

function App() {
  return (
    <main>
      <Button size={size} onClick={() => toast("Saved")}>
        Save
      </Button>
      <Switch aria-label="Email me product updates" />
      <Dialog>
        <DialogTrigger asChild>
          <Button intent="secondary">Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogContent>
      </Dialog>
      <DatePicker aria-label="Termin" name="termin" locale={de} />
      <Calendar mode="range" selected={range} locale={de} />
      <People />
      <Seats />
      <Toaster />
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("no #root element");
createRoot(root).render(
  <StrictMode>
    <DirectionProvider dir="ltr">
      <App />
    </DirectionProvider>
  </StrictMode>,
);
