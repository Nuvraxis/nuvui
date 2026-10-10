import {
  Button,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHandle,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@nuvui/react";

export default function Example() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button intent="secondary">Share</Button>
      </SheetTrigger>
      <SheetContent side="bottom" swipe>
        <SheetHandle />
        <SheetHeader>
          <SheetTitle>Share this report</SheetTitle>
          <SheetDescription>
            Drag it down by the bar or the heading, or flick it, to put it away.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <p style={{ margin: 0 }}>
            Anyone with the link can read the report. Nobody can change it.
          </p>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
