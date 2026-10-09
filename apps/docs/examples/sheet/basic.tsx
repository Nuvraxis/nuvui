import {
  Button,
  Field,
  FieldControl,
  FieldLabel,
  Input,
  NativeSelect,
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

export default function Example() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button intent="secondary">Filters</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow down the list of orders.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <div style={{ display: "grid", gap: 16, paddingBlock: 8 }}>
            <Field>
              <FieldLabel>Customer</FieldLabel>
              <FieldControl>
                <Input />
              </FieldControl>
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <FieldControl>
                <NativeSelect>
                  <option>Any</option>
                  <option>Paid</option>
                  <option>Refunded</option>
                </NativeSelect>
              </FieldControl>
            </Field>
          </div>
        </SheetBody>
        <SheetFooter>
          <SheetClose asChild>
            <Button intent="secondary">Cancel</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button>Apply filters</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
