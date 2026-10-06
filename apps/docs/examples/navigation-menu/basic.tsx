import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@nuvui/react";
import type { CSSProperties } from "react";

const guides = [
  {
    name: "Theming",
    about: "Presets, density and your own tokens.",
    href: "/docs/theming",
  },
  {
    name: "Forms",
    about: "Labels, errors and validation.",
    href: "/docs/forms",
  },
  {
    name: "Tailwind",
    about: "Using the tokens as Tailwind's theme.",
    href: "/docs/tailwind",
  },
];

const components = [
  { name: "Button", href: "/docs/components/button" },
  { name: "Dialog", href: "/docs/components/dialog" },
  { name: "Select", href: "/docs/components/select" },
];

const list: CSSProperties = {
  display: "grid",
  gap: 4,
  margin: 0,
  padding: 0,
  listStyle: "none",
};

export default function Example() {
  return (
    <NavigationMenu aria-label="Docs">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Guides</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul style={list}>
              {guides.map((guide) => (
                <li key={guide.href}>
                  <NavigationMenuLink href={guide.href}>
                    {guide.name}
                    <span
                      style={{
                        color: "var(--color-muted-foreground)",
                        fontWeight: 400,
                      }}
                    >
                      {guide.about}
                    </span>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul style={list}>
              {components.map((component) => (
                <li key={component.href}>
                  <NavigationMenuLink href={component.href}>
                    {component.name}
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="/docs/changelog">
            Changelog
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
