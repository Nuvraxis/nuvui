"use client";

import {
  Avatar,
  AvatarFallback,
  Button,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Kbd,
} from "@nuvui/react";
import { Bell, Hexagon, Menu, Search } from "lucide-react";
import { useState } from "react";
import "./top-bar.scss";

const pages = [
  { label: "Overview", href: "#overview", current: true },
  { label: "Orders", href: "#orders" },
  { label: "Customers", href: "#customers" },
  { label: "Reports", href: "#reports" },
];

const actions = ["Create an order", "Invite a teammate", "Export as CSV"];

export default function TopBar() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState("");

  // Running a command closes the palette. What it does is yours to write.
  const run = (command: string) => {
    setLast(command);
    setOpen(false);
  };

  return (
    <div className="top-bar">
      <header className="top-bar__bar">
        {/* The pages, for a screen too narrow for them in the bar. */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              intent="ghost"
              className="top-bar__icon top-bar__menu"
              aria-label="Pages"
            >
              <Menu aria-hidden="true" size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {pages.map((page) => (
              <DropdownMenuItem key={page.href} asChild>
                <a
                  href={page.href}
                  aria-current={page.current ? "page" : undefined}
                >
                  {page.label}
                </a>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <a className="top-bar__brand" href="#home">
          <Hexagon aria-hidden="true" size={22} />
          Acme
        </a>
        <nav className="top-bar__nav" aria-label="Main">
          <ul className="top-bar__list">
            {pages.map((page) => (
              <li key={page.href}>
                <a
                  className="top-bar__link"
                  href={page.href}
                  aria-current={page.current ? "page" : undefined}
                >
                  {page.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="top-bar__tools">
          <Button
            intent="secondary"
            className="top-bar__search"
            onClick={() => setOpen(true)}
            // The word is hidden on a narrow screen, where the button is
            // its icon.
            aria-label="Search"
            aria-keyshortcuts="Control+K Meta+K"
          >
            <Search aria-hidden="true" size={16} />
            <span className="top-bar__word">Search</span>
            <span className="top-bar__keys" aria-hidden="true">
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </span>
          </Button>
          <Button
            intent="ghost"
            className="top-bar__icon"
            aria-label="Notifications"
          >
            <Bell aria-hidden="true" size={18} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="top-bar__person"
                aria-label="Account: Ada Lovelace"
              >
                <Avatar size="sm">
                  <AvatarFallback>AL</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>ada@example.com</DropdownMenuLabel>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        shortcut="k"
        title="Search"
        label="Search pages and actions"
      >
        <CommandInput placeholder="Where to, or what to do" />
        <CommandList>
          <CommandEmpty>Nothing found.</CommandEmpty>
          <CommandGroup heading="Go to">
            {pages.map((page) => (
              <CommandItem key={page.href} onSelect={run}>
                {page.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions">
            {actions.map((action) => (
              <CommandItem key={action} onSelect={run}>
                {action}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      {/* Your page goes here. */}
      <main className="top-bar__page">
        <h1 className="top-bar__title">Overview</h1>
        <p className="top-bar__hint">
          Press the search button, or Ctrl+K, for the command palette.
        </p>
        <output className="top-bar__hint">
          {last ? `Last run: ${last}` : null}
        </output>
      </main>
    </div>
  );
}
