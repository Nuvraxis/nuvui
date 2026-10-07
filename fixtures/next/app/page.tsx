// A server component: there's no "use client" in this file. Button renders
// on the server as it is. Dialog and Switch keep state, so they only work
// here if the package's own files still carry their "use client" lines.
// The add-on's components are client components as well, used here with
// plain props. The dates are made in UTC and read in UTC, so they're the
// same day on this server and in whichever browser opens the page.
import { Calendar, DatePicker } from "@nuvui/date-picker";
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
import { People } from "./people";

const people = [
  { id: "1", name: "Cleo Park", team: "Design" },
  { id: "2", name: "Ada Lovelace", team: "Engineering" },
];

export default function Page() {
  return (
    <main>
      <Button asChild>
        <a href="#next">Read on</a>
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
    </main>
  );
}
