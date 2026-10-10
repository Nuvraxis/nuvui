"use client";

import { NavbarLink } from "@nuvui/react/navbar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/site";

interface NavLinkProps {
  item: NavItem;
  className?: string;
  onClick?: () => void;
}

// A link of the header's Navbar. One to the docs is a plain <a>: they're
// another app's pages. One of this app's own goes through the router, and
// says so when the page it leads to, or one under it, is the one that's
// open.
export function NavLink({ item, className, onClick }: NavLinkProps) {
  const pathname = usePathname();

  if (item.docs) {
    return (
      <NavbarLink href={item.href} className={className}>
        {item.label}
      </NavbarLink>
    );
  }

  const current =
    pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <NavbarLink
      asChild
      current={current}
      className={className}
      onClick={onClick}
    >
      <Link href={item.href}>{item.label}</Link>
    </NavbarLink>
  );
}
