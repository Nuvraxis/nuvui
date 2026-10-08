"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/site";

interface NavLinkProps {
  item: NavItem;
  className?: string;
  onClick?: () => void;
}

// A link to the docs is a plain <a>: they're another app's pages. One of
// this app's own goes through the router, and says so when the page it
// leads to, or one under it, is the one that's open.
export function NavLink({ item, className, onClick }: NavLinkProps) {
  const pathname = usePathname();

  if (item.docs) {
    return (
      <a href={item.href} className={className}>
        {item.label}
      </a>
    );
  }

  const current =
    pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={className}
      aria-current={current ? "page" : undefined}
      onClick={onClick}
    >
      {item.label}
    </Link>
  );
}
