import {
  Button,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@nuvui/react";

const pages = [
  { name: "Getting started", href: "/docs" },
  { name: "Theming", href: "/docs/theming" },
  { name: "Forms", href: "/docs/forms" },
];

export default function Example() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button intent="secondary">Menu</Button>
      </SheetTrigger>
      <SheetContent side="start" size="sm" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <nav aria-label="Site">
            <ul style={{ display: "grid", gap: 4, margin: 0, padding: 0 }}>
              {pages.map((page) => (
                <li key={page.href} style={{ listStyle: "none" }}>
                  {/* Closing on the way out matters when the link leads to
                      a section of the page that's already open. */}
                  <SheetClose asChild>
                    <Button
                      asChild
                      intent="ghost"
                      style={{
                        justifyContent: "flex-start",
                        inlineSize: "100%",
                      }}
                    >
                      <a href={page.href}>{page.name}</a>
                    </Button>
                  </SheetClose>
                </li>
              ))}
            </ul>
          </nav>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
