import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@nuvui/react";

const changes = [
  ["Billing", "Invoices are now sent on the first working day of the month."],
  ["Seats", "A seat is counted from the day an invitation is accepted."],
  ["Exports", "Exports include archived projects unless you leave them out."],
  ["Sign-in", "Single sign-on can be required for everyone in a workspace."],
  ["Storage", "Files in the trash count towards storage until it's emptied."],
  ["Roles", "A project can have more than one owner."],
  ["Audit log", "Entries are kept for a year, then removed."],
  ["Notifications", "Email digests are sent weekly unless you change it."],
  ["API", "Tokens expire after 90 days and can be renewed before they do."],
  ["Support", "Replies come within one working day on every plan."],
];

export default function Example() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button intent="secondary">What's changing</Button>
      </DialogTrigger>
      {/* Kept short here, so that the body scrolls on a large screen too. */}
      <DialogContent style={{ maxBlockSize: "26rem" }}>
        <DialogHeader>
          <DialogTitle>Changes to your plan</DialogTitle>
          <DialogDescription>
            These apply from your next renewal.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <dl style={{ display: "grid", gap: 16, margin: 0 }}>
            {changes.map(([area, change]) => (
              <div key={area}>
                <dt style={{ fontWeight: 600 }}>{area}</dt>
                <dd style={{ margin: 0 }}>{change}</dd>
              </div>
            ))}
          </dl>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button intent="secondary">Not now</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>Accept changes</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
