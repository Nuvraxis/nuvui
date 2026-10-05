import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@nuvui/react";

const sizes = ["sm", "md", "lg"] as const;

export default function Example() {
  return (
    <>
      {sizes.map((size) => (
        <Dialog key={size}>
          <DialogTrigger asChild>
            <Button intent="secondary">Open {size}</Button>
          </DialogTrigger>
          <DialogContent size={size}>
            <DialogTitle>Size {size}</DialogTitle>
            <DialogDescription>
              On a phone every size is the same full-width sheet. The sizes only
              differ once there's room to center the dialog.
            </DialogDescription>
          </DialogContent>
        </Dialog>
      ))}
    </>
  );
}
