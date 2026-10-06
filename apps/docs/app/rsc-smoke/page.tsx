// A server component that uses the library with no "use client" of its own.
// If the package lost a directive, or a component stopped being safe to
// render on the server, this page fails to build. It isn't linked from
// anywhere, and the e2e tests open it directly.
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  Fieldset,
  FieldsetLegend,
  Input,
  NativeSelect,
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
  paginationRange,
} from "@nuvui/react";
import { Button as ButtonEntry } from "@nuvui/react/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Server component check",
  robots: { index: false, follow: false },
};

export default function RscSmokePage() {
  return (
    <main className="flex flex-col items-start gap-4 p-6">
      <h1 className="text-xl font-semibold">Server component check</h1>
      <Button>Rendered on the server</Button>
      <Button asChild intent="secondary">
        <a href="/docs">A link rendered on the server</a>
      </Button>
      <ButtonEntry intent="ghost">From the per-component entry</ButtonEntry>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open the dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Opened from a server component</DialogTitle>
          <DialogDescription>
            The dialog parts are client components. The page that put them
            together is not.
          </DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button intent="secondary">Close it</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Input, NativeSelect, Fieldset and ButtonGroup have no directive.
          The field parts do, and tie the rest together once they hydrate. */}
      <Fieldset>
        <FieldsetLegend>Fields put together on the server</FieldsetLegend>
        <Field required>
          <FieldLabel>Server email</FieldLabel>
          <FieldControl>
            <Input type="email" />
          </FieldControl>
          <FieldDescription>Described after hydration.</FieldDescription>
        </Field>
        <NativeSelect aria-label="Server select">
          <option>One</option>
          <option>Two</option>
        </NativeSelect>
        <ButtonGroup aria-label="Server group">
          <Button intent="secondary">Left</Button>
          <Button intent="secondary">Right</Button>
        </ButtonGroup>
      </Fieldset>
      {/* Breadcrumb and Pagination have no directive either, and
          paginationRange is a plain function, called here on the server. */}
      <Breadcrumb aria-label="Server breadcrumb">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Server check</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Pagination aria-label="Server pagination">
        <PaginationList>
          {paginationRange({ page: 5, count: 9, siblings: 0 }).map((entry) => (
            <PaginationItem key={entry}>
              {typeof entry === "number" ? (
                <PaginationLink
                  href={`#page-${entry}`}
                  aria-label={`Page ${entry}`}
                  active={entry === 5}
                >
                  {entry}
                </PaginationLink>
              ) : (
                <PaginationEllipsis />
              )}
            </PaginationItem>
          ))}
        </PaginationList>
      </Pagination>
      {/* The alert dialog's two buttons are the library's Button, wrapped
          by client parts, with nothing passed to them but text. */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button intent="danger">Open the alert</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Asked from a server component</AlertDialogTitle>
          <AlertDialogDescription>
            Both answers close this.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Back out</AlertDialogCancel>
            <AlertDialogAction>Go ahead</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
