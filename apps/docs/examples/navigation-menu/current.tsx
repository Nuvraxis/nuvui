import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@nuvui/react";

const pages = [
  { name: "Overview", href: "/docs" },
  { name: "Theming", href: "/docs/theming" },
  { name: "Navigation menu", href: "/docs/components/navigation-menu" },
];

export default function Example() {
  // In an app this comes from the router, such as usePathname() in Next.js.
  const pathname = "/docs/components/navigation-menu";

  return (
    <NavigationMenu aria-label="Sections">
      <NavigationMenuList>
        {pages.map((page) => (
          <NavigationMenuItem key={page.href}>
            <NavigationMenuLink
              href={page.href}
              active={page.href === pathname}
            >
              {page.name}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
