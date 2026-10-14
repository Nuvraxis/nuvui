"use client";

import {
  Button,
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMain,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@nuvui/react";
import {
  ChartColumn,
  Hexagon,
  LayoutDashboard,
  type LucideIcon,
  PanelRight,
  Settings,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import { useId, useRef, useState, useSyncExternalStore } from "react";
import "./app-shell.scss";

const pages: { label: string; href: string; Icon: LucideIcon }[] = [
  { label: "Overview", href: "#overview", Icon: LayoutDashboard },
  { label: "Orders", href: "#orders", Icon: ShoppingCart },
  { label: "Customers", href: "#customers", Icon: Users },
  { label: "Reports", href: "#reports", Icon: ChartColumn },
  { label: "Settings", href: "#settings", Icon: Settings },
];

// Made up. Your app has its own.
const activity = [
  {
    id: 1,
    who: "Dana Whitfield",
    what: "marked ORD-7231 as paid",
    at: "2026-10-14T09:42",
    when: "09:42",
  },
  {
    id: 2,
    who: "Sam Okafor",
    what: "refunded ORD-7188",
    at: "2026-10-14T09:15",
    when: "09:15",
  },
  {
    id: 3,
    who: "Priya Nair",
    what: "added a note to Northwind Traders",
    at: "2026-10-14T08:51",
    when: "08:51",
  },
  {
    id: 4,
    who: "Tom Becker",
    what: "exported the September orders",
    at: "2026-10-13T17:30",
    when: "Yesterday",
  },
];

// From this width the panel sits beside the page. Below it, it opens over
// the page as a sheet. The same width is in app-shell.scss.
const wide = "(width >= 64rem)";

function subscribe(change: () => void) {
  const query = matchMedia(wide);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}

// The page is drawn on the server as if it were wide. The stylesheet hides
// the panel on a narrow screen until this has caught up.
function useWide() {
  return useSyncExternalStore(
    subscribe,
    () => matchMedia(wide).matches,
    () => true,
  );
}

function Activity() {
  return (
    <ol className="app-shell__events">
      {activity.map((event) => (
        <li key={event.id} className="app-shell__event">
          <span>
            <strong className="app-shell__who">{event.who}</strong> {event.what}
          </span>
          <time className="app-shell__when" dateTime={event.at}>
            {event.when}
          </time>
        </li>
      ))}
    </ol>
  );
}

export default function AppShell() {
  const isWide = useWide();
  // Two states, so a panel open beside the page on a wide screen isn't a
  // sheet over it when the window narrows.
  const [besideOpen, setBesideOpen] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const panelId = useId();
  const headingId = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const open = isWide ? besideOpen : sheetOpen;

  return (
    <SidebarProvider className="app-shell">
      <Sidebar label="Main">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Acme, home">
                <a href="#home">
                  <Hexagon aria-hidden="true" />
                  <span className="app-shell__brand">Acme</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Shop</SidebarGroupLabel>
            <SidebarMenu>
              {pages.map(({ label, href, Icon }) => {
                const active = label === "Orders";
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild active={active} tooltip={label}>
                      <a href={href} aria-current={active ? "page" : undefined}>
                        <Icon aria-hidden="true" />
                        <span>{label}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarMain className="app-shell__main">
        <header className="app-shell__bar">
          <SidebarTrigger />
          <h1 className="app-shell__title">Orders</h1>
          <div className="app-shell__tools">
            <Button
              ref={toggle}
              intent="ghost"
              aria-expanded={open}
              aria-controls={isWide && besideOpen ? panelId : undefined}
              onClick={() =>
                isWide ? setBesideOpen((now) => !now) : setSheetOpen(true)
              }
            >
              <PanelRight aria-hidden="true" size={18} />
              Activity
            </Button>
          </div>
        </header>
        <div
          className="app-shell__body"
          data-panel={besideOpen ? "open" : undefined}
        >
          {/* Your page goes here. */}
          <div className="app-shell__page">
            <p className="app-shell__hint">
              The sidebar folds to its icons, and the panel on the far side
              closes. On a narrow screen both open over the page.
            </p>
          </div>
          {besideOpen ? (
            <aside
              id={panelId}
              className="app-shell__panel"
              aria-labelledby={headingId}
            >
              <div className="app-shell__panel-head">
                <h2 id={headingId} className="app-shell__panel-title">
                  Activity
                </h2>
                <Button
                  intent="ghost"
                  className="app-shell__icon"
                  aria-label="Close the activity panel"
                  onClick={() => {
                    setBesideOpen(false);
                    // The button pressed is gone. The one that opens the
                    // panel again takes the focus.
                    toggle.current?.focus();
                  }}
                >
                  <X aria-hidden="true" size={18} />
                </Button>
              </div>
              <Activity />
            </aside>
          ) : null}
        </div>
      </SidebarMain>
      <Sheet open={!isWide && sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="end"
          onCloseAutoFocus={(event) => {
            // A sheet gives the focus back to its own trigger. This one is
            // opened by the bar's button, which isn't one, so it's said
            // here.
            event.preventDefault();
            toggle.current?.focus();
          }}
        >
          <SheetHeader>
            <SheetTitle>Activity</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <Activity />
          </SheetBody>
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  );
}
