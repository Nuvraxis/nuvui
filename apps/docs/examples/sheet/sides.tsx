import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@nuvui/react";

const sides = ["start", "end", "top", "bottom"] as const;

export default function Example() {
  return (
    <>
      {sides.map((side) => (
        <Sheet key={side}>
          <SheetTrigger asChild>
            <Button intent="secondary">{side}</Button>
          </SheetTrigger>
          <SheetContent side={side}>
            <SheetTitle>On the {side} edge</SheetTitle>
            <SheetDescription>
              Press Escape, the close button or the page behind to close it.
            </SheetDescription>
          </SheetContent>
        </Sheet>
      ))}
    </>
  );
}
