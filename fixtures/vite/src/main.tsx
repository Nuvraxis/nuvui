import "@nuvui/react/styles.css";
import "@nuvui/react/themes/ink.css";
import "@nuvui/date-picker/styles.css";
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
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const size: ButtonProps["size"] = "lg";
const range: DateRange = { from: new Date(2026, 9, 12), to: undefined };

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
