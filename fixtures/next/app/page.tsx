// A server component: there's no "use client" in this file. Button renders
// on the server as it is. Dialog and Switch keep state, so they only work
// here if the package's own files still carry their "use client" lines.
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
    </main>
  );
}
