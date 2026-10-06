import {
  Button,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@nuvui/react";

const changes = [
  "Ada changed the status to Paid.",
  "Sam added a note for the warehouse.",
  "The invoice was sent to the customer.",
  "Ada changed the delivery address.",
  "The payment was authorized.",
  "Sam split the order into two parcels.",
  "The first parcel left the warehouse.",
  "The customer asked for a later delivery.",
  "Ada moved the delivery to Friday.",
  "The second parcel left the warehouse.",
  "The first parcel was delivered.",
  "The second parcel was delivered.",
];

export default function Example() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button intent="secondary">Order history</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Order 10248</SheetTitle>
          <SheetDescription>Everything that happened to it.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <ol style={{ display: "grid", gap: 16, margin: 0, padding: 0 }}>
            {changes.map((change) => (
              <li key={change} style={{ listStyle: "none" }}>
                {change}
              </li>
            ))}
          </ol>
        </SheetBody>
        <SheetFooter>
          <SheetClose asChild>
            <Button>Done</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
