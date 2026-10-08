import {
  Button,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@nuvui/react";
import { Hexagon, Menu } from "lucide-react";
import "./nav-bar.scss";

const product = [
  {
    name: "Invoices",
    about: "Send them, and see which have been paid.",
    href: "#invoices",
  },
  {
    name: "Reminders",
    about: "A nudge before the due date, and after it.",
    href: "#reminders",
  },
  {
    name: "Reports",
    about: "What's owed and what came in, by month.",
    href: "#reports",
  },
];

const pages = [
  { name: "Pricing", href: "#pricing" },
  { name: "Customers", href: "#customers" },
  { name: "Docs", href: "#docs" },
];

export default function NavBar() {
  return (
    <div className="nav-bar">
      <header className="nav-bar__bar">
        <a className="nav-bar__brand" href="#home">
          <Hexagon aria-hidden="true" size={22} />
          Acme
        </a>
        {/* The menu is in the bar from the md breakpoint up. Below it,
            every link is in the panel that the button at the end opens. */}
        <NavigationMenu aria-label="Main" className="nav-bar__menu">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Product</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="nav-bar__panel">
                  {product.map((item) => (
                    <li key={item.href}>
                      <NavigationMenuLink href={item.href}>
                        {item.name}
                        <span className="nav-bar__about">{item.about}</span>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            {pages.map((page) => (
              <NavigationMenuItem key={page.href}>
                <NavigationMenuLink href={page.href}>
                  {page.name}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <div className="nav-bar__actions">
          <Button asChild intent="ghost" className="nav-bar__wide">
            <a href="#sign-in">Sign in</a>
          </Button>
          <Button asChild>
            <a href="#start">Start free</a>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                intent="ghost"
                className="nav-bar__toggle"
                aria-label="Menu"
              >
                <Menu aria-hidden="true" size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent size="sm" aria-describedby={undefined}>
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <SheetBody>
                <nav aria-label="Main">
                  <ul className="nav-bar__list">
                    {[...product, ...pages].map((page) => (
                      <li key={page.href}>
                        {/* Closing on the way out matters when the link
                            leads to a part of the page that's open. */}
                        <SheetClose asChild>
                          <Button
                            asChild
                            intent="ghost"
                            className="nav-bar__entry"
                          >
                            <a href={page.href}>{page.name}</a>
                          </Button>
                        </SheetClose>
                      </li>
                    ))}
                  </ul>
                </nav>
              </SheetBody>
              <SheetFooter>
                <SheetClose asChild>
                  <Button asChild intent="secondary">
                    <a href="#sign-in">Sign in</a>
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main className="nav-bar__page">
        <h1 className="nav-bar__title">The page goes here</h1>
        <p className="nav-bar__hint">
          The bar stays at the top while the page scrolls under it.
        </p>
      </main>
    </div>
  );
}
