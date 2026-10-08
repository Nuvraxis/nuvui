import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@nuvui/react";
import Link from "next/link";

export default function Example() {
  return (
    <NavigationMenu aria-label="Guides" align="end">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/">Getting started</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>More guides</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul style={{ display: "grid", gap: 4, margin: 0, padding: 0 }}>
              <li style={{ listStyle: "none" }}>
                <NavigationMenuLink asChild>
                  <Link href="/tailwind">Tailwind</Link>
                </NavigationMenuLink>
              </li>
              <li style={{ listStyle: "none" }}>
                <NavigationMenuLink asChild>
                  <Link href="/scss">SCSS</Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
