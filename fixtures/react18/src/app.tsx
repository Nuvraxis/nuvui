// The app, on React 18.2, the oldest React the packages say they work with.
// It imports no styles and touches no browser, so it can be rendered to HTML
// on a server as well as drawn in a page.
import { Barcode } from "@nuvui/barcodes/barcode";
import { QRCode } from "@nuvui/barcodes/qrcode";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts/chart";
import { Message, MessageContent } from "@nuvui/chat/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@nuvui/chat/prompt-input";
import { DatePicker } from "@nuvui/date-picker";
import { RichTextEditor } from "@nuvui/editor/rich-text-editor";
import { EmojiPicker } from "@nuvui/emoji/emoji-picker";
import { ArrowRightIcon } from "@nuvui/icons/sharp";
import {
  Kanban,
  KanbanCard,
  KanbanCards,
  KanbanColumn,
} from "@nuvui/kanban/kanban";
import { MapMarker, MapView } from "@nuvui/map/map";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Label,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toaster,
  toast,
} from "@nuvui/react";
import { createDataTableHook, DataTable } from "@nuvui/table";
import {
  createSortedRowModel,
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
} from "@tanstack/react-table";
import { Bar, BarChart, XAxis } from "recharts";

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
  const table = useDataTable({
    columns,
    data: people,
    initialState: { sorting: [{ id: "name", desc: false }] },
  });
  return <DataTable table={table} caption="People" rowHeader="name" />;
}

const chartConfig = { seats: { label: "Seats" } } satisfies ChartConfig;
const seats = [
  { team: "Design", seats: 4 },
  { team: "Engineering", seats: 9 },
];

export function App() {
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
      <QRCode value="https://example.com" aria-label="Open the example" />
      <RichTextEditor aria-label="Notes" defaultValue="<p>Hello</p>" />
      <EmojiPicker onEmojiSelect={(emoji) => toast(emoji)} />
      <MapView
        aria-label="Office"
        mapStyle={{ version: 8, sources: {}, layers: [] }}
      >
        <MapMarker position={[13.405, 52.52]} label="Berlin office" />
      </MapView>
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
      {/* Radix writes a hidden copy of each control into a form, to be
          sent with it. */}
      <form>
        <Label htmlFor="terms">I accept the terms</Label>
        <Checkbox id="terms" name="terms" defaultChecked />
        <Select name="fruit" defaultValue="apple">
          <SelectTrigger aria-label="Fruit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="pear">Pear</SelectItem>
          </SelectContent>
        </Select>
        <Switch aria-label="Email me product updates" name="updates" />
        <DatePicker aria-label="Due" name="due" />
      </form>
      <Progress aria-label="Storage used" value={64} />
      <Slider aria-label="Volume" defaultValue={[40]} />
      <Tabs defaultValue="one">
        <TabsList aria-label="Sections">
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">The first section.</TabsContent>
        <TabsContent value="two">The second section.</TabsContent>
      </Tabs>
      <Button size="lg" onClick={() => toast("Saved")}>
        Save <ArrowRightIcon title="and go on" />
      </Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button intent="secondary">Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogContent>
      </Dialog>
      <People />
      <ChartContainer config={chartConfig} aria-label="Seats by team">
        <BarChart data={seats}>
          <XAxis dataKey="team" />
          <ChartTooltip />
          <Bar dataKey="seats" fill={chartFill("seats")} />
        </BarChart>
      </ChartContainer>
      <Toaster />
    </main>
  );
}
