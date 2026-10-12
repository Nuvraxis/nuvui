import "@nuvui/react/styles.css";
import "@nuvui/react/themes/ink.css";
import "@nuvui/date-picker/styles.css";
import "@nuvui/table/styles.css";
import "@nuvui/charts/styles.css";
import "@nuvui/barcodes/styles.css";
import "@nuvui/chat/styles.css";
import "@nuvui/kanban/styles.css";
// The two codes, each from the entry of its own.
import { Barcode } from "@nuvui/barcodes/barcode";
import { QRCode } from "@nuvui/barcodes/qrcode";
// The chart package, from the entry of its one component.
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts/chart";
// Two of the chat parts, each from the entry of its own.
import { Message, MessageContent } from "@nuvui/chat/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@nuvui/chat/prompt-input";
import { DatePicker, type DateRange } from "@nuvui/date-picker";
// An entry of the add-on's own, and one locale out of all it has.
import { Calendar } from "@nuvui/date-picker/calendar";
import { de } from "@nuvui/date-picker/locale";
// The board, from the entry of its one component.
import {
  Kanban,
  KanbanCard,
  KanbanCards,
  KanbanColumn,
} from "@nuvui/kanban/kanban";
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
      <Message from="assistant">
        <MessageContent>Two invoices are overdue.</MessageContent>
      </Message>
      <PromptInput onSubmit={(text) => toast(text)}>
        <PromptInputTextarea aria-label="Message" />
        <PromptInputSubmit />
      </PromptInput>
      <Barcode value="590123412345" type="ean13" aria-label="Item 5901234" />
      <Kanban
        aria-label="Work"
        defaultValue={[{ id: "todo", cards: ["brief"] }]}
      >
        {(columns) =>
          columns.map((column) => (
            <KanbanColumn key={column.id} value={column.id} label="To do">
              <KanbanCards>
                {column.cards.map((id) => (
                  <KanbanCard key={id} value={id} label="Write the brief">
                    Write the brief
                  </KanbanCard>
                ))}
              </KanbanCards>
            </KanbanColumn>
          ))
        }
      </Kanban>
      <QRCode value="https://example.com" aria-label="Open the example" />
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
