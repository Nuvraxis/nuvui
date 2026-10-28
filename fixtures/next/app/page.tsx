// A server component: there's no "use client" in this file. Button renders
// on the server as it is. Dialog and Switch keep state, so they only work
// here if the package's own files still carry their "use client" lines.
// The add-on's components are client components as well, used here with
// plain props. The dates are made in UTC and read in UTC, so they're the
// same day on this server and in whichever browser opens the page.

import { ModelViewer } from "@nuvui/3d";
import { GradientBackground, StarsBackground } from "@nuvui/backgrounds";
import { Barcode, QRCode } from "@nuvui/barcodes";
import {
  Conversation,
  ConversationContent,
  Message,
  MessageContent,
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@nuvui/chat";
import { Calendar, DatePicker } from "@nuvui/date-picker";
// A client component with plain props: a server component renders it,
// and the text is written in once the page is in a browser.
import { RichTextEditor } from "@nuvui/editor";
import { EmojiPicker } from "@nuvui/emoji";
import { Flow } from "@nuvui/flow";
import { ArrowRightIcon } from "@nuvui/icons";
import { MapView } from "@nuvui/map";
import { AudioPlayer, VideoPlayer } from "@nuvui/media";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@nuvui/react";
// One import from a component's own entry, to check that those resolve too.
import { Switch } from "@nuvui/react/switch";
import { EventCalendar } from "@nuvui/scheduler";
// The table's elements are client components too, and used here as they
// are. The data table is in a client component of this app's own.
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@nuvui/table/table";
import { Board } from "./board";
import { People } from "./people";
import { Planner } from "./planner";
import { Visitors } from "./visitors";

const months = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
];

const people = [
  { id: "1", name: "Cleo Park", team: "Design" },
  { id: "2", name: "Ada Lovelace", team: "Engineering" },
];

export default function Page() {
  return (
    <main>
      <Button asChild>
        <a href="#next">
          Read on <ArrowRightIcon size={16} />
        </a>
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
      <DatePicker
        aria-label="Due date"
        name="due"
        timeZone="UTC"
        defaultValue={new Date(Date.UTC(2026, 9, 15))}
      />
      <Calendar
        mode="single"
        timeZone="UTC"
        defaultMonth={new Date(Date.UTC(2026, 9, 15))}
      />
      <TableContainer>
        <Table aria-label="Plans">
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead align="end">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell rowHeader>Team</TableCell>
              <TableCell align="end">$12</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <People people={people} />
      <Board />
      <Planner />
      <RichTextEditor
        aria-label="Notes"
        name="notes"
        defaultValue="<p>Hello</p>"
      />
      <EmojiPicker />
      {/* A style with nothing to fetch. The server draws the box, and the
          map is drawn in a browser. */}
      <MapView
        aria-label="Office"
        mapStyle={{ version: 8, sources: {}, layers: [] }}
      />
      {/* A client component handed its lists by this server component.
          The server draws the whole diagram. */}
      <Flow
        aria-label="Steps"
        nodes={[
          { id: "a", label: "Start", shape: "pill", position: { x: 0, y: 0 } },
          { id: "b", label: "Review", position: { x: 220, y: -4 } },
        ]}
        edges={[{ id: "a-b", from: "a", to: "b" }]}
      />
      {/* The server sends the video with the browser's own controls, and
          the player's take over once the script runs. */}
      <VideoPlayer title="Intro" src="/intro.mp4" poster="/intro.jpg" />
      <AudioPlayer title="Episode" src="/episode.mp3" peaks={[0.2, 1, 0.5]} />
      <GradientBackground scrim="soft">
        <p>On a gradient</p>
      </GradientBackground>
      <StarsBackground>
        <p>Under the stars</p>
      </StarsBackground>
      {/* The server sends the name, the poster and the buttons. three and
          react-three-fiber come once the page is in a browser. */}
      <ModelViewer label="Chair" src="/chair.glb" poster="/chair.png" />
      <Visitors months={months} />
      {/* Client components from another package, used from this server
          component with nothing but plain props. */}
      <Conversation style={{ blockSize: 240 }}>
        <ConversationContent aria-label="Support">
          <Message from="assistant">
            <MessageContent>Two invoices are overdue.</MessageContent>
          </Message>
        </ConversationContent>
        <PromptInput>
          <PromptInputTextarea aria-label="Message" />
          <PromptInputSubmit />
        </PromptInput>
      </Conversation>
      {/* Neither of these is a client component: this server component
          works the codes out, and they arrive as markup. */}
      <Barcode value="590123412345" type="ean13" aria-label="Item 5901234" />
      <QRCode value="https://example.com" aria-label="Open the example" />
      {/* A client component handed its events by this server component,
          with their dates as strings. */}
      <EventCalendar
        aria-label="Team"
        events={[
          {
            id: "a",
            title: "Planning",
            start: "2026-10-14T10:00",
            end: "2026-10-14T11:00",
          },
        ]}
        timeZone="UTC"
        defaultDate={new Date("2026-10-14T12:00:00Z")}
      />
    </main>
  );
}
