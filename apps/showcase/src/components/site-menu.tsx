"use client";

import { Button } from "@nuvui/react/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@nuvui/react/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { navigation, site } from "@/lib/site";

// The navigation on a screen too narrow for it in the header. The same
// links, in a sheet. The stylesheet shows this button below the breakpoint
// and the header's own list above it.
export function SiteMenu() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          intent="ghost"
          size="sm"
          className="site-header__icon-button site-header__menu-button"
          aria-label="Menu"
        >
          <Menu aria-hidden="true" size={18} />
        </Button>
      </SheetTrigger>
      <SheetContent side="start">
        <SheetHeader>
          <SheetTitle>{site.name}</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <nav aria-label="Main">
            <ul className="site-menu">
              <li>
                <Link href="/" className="site-menu__link" onClick={close}>
                  Home
                </Link>
              </li>
              {navigation.map((item) => (
                <li key={item.href}>
                  {item.docs ? (
                    <a href={item.href} className="site-menu__link">
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="site-menu__link"
                      onClick={close}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
