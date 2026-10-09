// A server component that uses the library with no "use client" of its own.
// If the package lost a directive, or a component stopped being safe to
// render on the server, this page fails to build. It isn't linked from
// anywhere, and the e2e tests open it directly.
import { Calendar, DatePicker } from "@nuvui/date-picker";
// One import from an entry of the add-on's own, to check those resolve too.
import { DateRangePicker } from "@nuvui/date-picker/date-picker";
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertTitle,
  AspectRatio,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  DirectionProvider,
  Empty,
  EmptyTitle,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  Fieldset,
  FieldsetLegend,
  Input,
  Kbd,
  NativeSelect,
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
  Progress,
  paginationRange,
  Sidebar,
  SidebarMain,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  Skeleton,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  VisuallyHidden,
} from "@nuvui/react";
import { Button as ButtonEntry } from "@nuvui/react/button";
// The table's elements, from their own entry. A data table isn't here: it's
// made with a hook, and so in a client component.
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@nuvui/table/table";
import type { Metadata } from "next";
import type { CSSProperties } from "react";

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
      {/* None of these has a directive. They're only markup. */}
      <Card>
        <CardHeader>
          <CardTitle>Card from the server</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge intent="success">Server badge</Badge> Press <Kbd>Esc</Kbd>
          <VisuallyHidden> to close</VisuallyHidden>
        </CardContent>
      </Card>
      <Alert intent="warning">
        <AlertTitle>Alert from the server</AlertTitle>
        <AlertDescription>It was in the page from the start.</AlertDescription>
      </Alert>
      <Empty>
        <EmptyTitle>Empty from the server</EmptyTitle>
      </Empty>
      <div style={{ width: 120 }}>
        <AspectRatio ratio={2} data-testid="server-ratio" />
        <Skeleton data-testid="server-skeleton" />
      </div>
      <Spinner label="Server spinner" />
      {/* Progress and DirectionProvider are client components, rendered
          here with nothing but plain props. */}
      <Progress aria-label="Server progress" value={30} />
      {/* Combobox, Command and Sidebar are client components too, and
          keep their state themselves when nothing is passed to hold it. */}
      <Combobox defaultValue="Server apple" name="server-fruit">
        <ComboboxTrigger aria-label="Server combobox">
          <ComboboxValue placeholder="Pick one" />
        </ComboboxTrigger>
        <ComboboxContent label="Search server fruit">
          <ComboboxItem value="Server apple">Server apple</ComboboxItem>
          <ComboboxItem value="Server pear">Server pear</ComboboxItem>
        </ComboboxContent>
      </Combobox>
      {/* The date components come from a package of their own. A date
          made here is sent to the browser as a moment in time, so both
          sides are told to read it in the same time zone. */}
      <DatePicker
        aria-label="Server date"
        name="server-date"
        timeZone="UTC"
        defaultValue={new Date(Date.UTC(2026, 9, 15))}
      />
      <DateRangePicker aria-label="Server range" startName="server-from" />
      <Calendar
        mode="single"
        timeZone="UTC"
        defaultMonth={new Date(Date.UTC(2026, 9, 15))}
      />
      <div style={{ width: 200 }}>
        <TableContainer aria-label="Server table">
          <Table aria-label="Server table" stickyHeader>
            <TableHeader>
              <TableRow>
                <TableHead pinned="start">Server plan</TableHead>
                <TableHead>Seats included</TableHead>
                <TableHead align="end">Price a month</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell rowHeader pinned="start">
                  Team
                </TableCell>
                <TableCell>Ten seats</TableCell>
                <TableCell align="end">$120.00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      <Command label="Server commands">
        <CommandInput />
        <CommandList>
          <CommandItem>Server command</CommandItem>
        </CommandList>
      </Command>
      <SidebarProvider
        cookieName={null}
        shortcut={null}
        style={{ "--nuv-sidebar-height": "8rem" } as CSSProperties}
      >
        <Sidebar label="Server sidebar">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild active>
                <a href="/docs">Server page</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
        {/* The page already has its main element. */}
        <SidebarMain asChild>
          <div>
            <SidebarTrigger />
          </div>
        </SidebarMain>
      </SidebarProvider>
      <DirectionProvider dir="rtl">
        <div dir="rtl">
          <Tabs defaultValue="one">
            <TabsList aria-label="Server tabs">
              <TabsTrigger value="one">One</TabsTrigger>
              <TabsTrigger value="two">Two</TabsTrigger>
            </TabsList>
            <TabsContent value="one">First</TabsContent>
            <TabsContent value="two">Second</TabsContent>
          </Tabs>
        </div>
      </DirectionProvider>
    </main>
  );
}
