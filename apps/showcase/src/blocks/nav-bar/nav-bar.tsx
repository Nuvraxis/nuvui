import {
  Button,
  Navbar,
  NavbarActions,
  NavbarBrand,
  NavbarLink,
  NavbarMenu,
  NavbarNav,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@nuvui/react";
import { Hexagon } from "lucide-react";
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
      <Navbar sticky className="nav-bar__bar">
        <NavbarBrand>
          <a className="nav-bar__brand" href="#home">
            <Hexagon aria-hidden="true" size={22} />
            Acme
          </a>
        </NavbarBrand>
        {/* The menu is in the bar from the md breakpoint up. It's a nav
            already, so it takes the bar's place for one and isn't wrapped
            in another. */}
        <NavbarNav asChild>
          <NavigationMenu aria-label="Main">
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
        </NavbarNav>
        <NavbarActions>
          <Button asChild intent="ghost" className="nav-bar__wide">
            <a href="#sign-in">Sign in</a>
          </Button>
          <Button asChild>
            <a href="#start">Start free</a>
          </Button>
          {/* Below the md breakpoint every link is in the panel this
              opens. Following one closes it. */}
          <NavbarMenu>
            <nav aria-label="Main">
              {[...product, ...pages].map((page) => (
                <NavbarLink key={page.href} href={page.href}>
                  {page.name}
                </NavbarLink>
              ))}
            </nav>
            <Button asChild intent="secondary" className="nav-bar__sign-in">
              <a href="#sign-in">Sign in</a>
            </Button>
          </NavbarMenu>
        </NavbarActions>
      </Navbar>
      <main className="nav-bar__page">
        <h1 className="nav-bar__title">The page goes here</h1>
        <p className="nav-bar__hint">
          The bar stays at the top while the page scrolls under it.
        </p>
      </main>
    </div>
  );
}
