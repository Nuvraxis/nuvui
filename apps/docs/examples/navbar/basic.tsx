import {
  Button,
  Navbar,
  NavbarActions,
  NavbarBrand,
  NavbarLink,
  NavbarMenu,
  NavbarNav,
} from "@nuvui/react";

const pages = [
  { name: "Orders", href: "#orders" },
  { name: "Customers", href: "#customers" },
  { name: "Reports", href: "#reports" },
];

// The links are written once and drawn twice: in the bar on a wide
// screen, and in the panel on a narrow one.
function Links() {
  return pages.map((page, index) => (
    <NavbarLink key={page.href} href={page.href} current={index === 0}>
      {page.name}
    </NavbarLink>
  ));
}

export default function Example() {
  return (
    <Navbar style={{ inlineSize: "100%" }}>
      <NavbarBrand>
        <a href="#home" style={{ color: "inherit", textDecoration: "none" }}>
          Acme
        </a>
      </NavbarBrand>
      <NavbarNav aria-label="Main">
        <Links />
      </NavbarNav>
      <NavbarActions>
        <Button size="sm">New order</Button>
        <NavbarMenu>
          <nav aria-label="Main">
            <Links />
          </nav>
        </NavbarMenu>
      </NavbarActions>
    </Navbar>
  );
}
