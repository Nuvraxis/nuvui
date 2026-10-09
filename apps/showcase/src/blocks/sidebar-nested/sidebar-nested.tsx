"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMain,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@nuvui/react";
import {
  BookOpen,
  ChartColumn,
  ChevronRight,
  Hexagon,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  ShoppingCart,
} from "lucide-react";
import "./sidebar-nested.scss";

interface Section {
  label: string;
  Icon: LucideIcon;
  /** Whether the section starts open. */
  open?: boolean;
  pages: { label: string; href: string; active?: boolean }[];
}

const sections: Section[] = [
  {
    label: "Orders",
    Icon: ShoppingCart,
    pages: [
      { label: "All orders", href: "#orders" },
      { label: "Returns", href: "#returns" },
      { label: "Abandoned carts", href: "#carts" },
    ],
  },
  {
    label: "Reports",
    Icon: ChartColumn,
    // The section with the open page in it starts open.
    open: true,
    pages: [
      { label: "Revenue", href: "#revenue", active: true },
      { label: "Churn", href: "#churn" },
      { label: "Usage", href: "#usage" },
    ],
  },
  {
    label: "Settings",
    Icon: Settings,
    pages: [
      { label: "General", href: "#general" },
      { label: "Team", href: "#team" },
      { label: "Billing", href: "#billing" },
    ],
  },
];

export default function SidebarNested() {
  return (
    <SidebarProvider className="sidebar-nested">
      {/* Folding to icons would hide the pages inside each section, so this
          one slides out of the way instead. */}
      <Sidebar label="Main" collapsible="offcanvas">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#home">
                  <Hexagon aria-hidden="true" />
                  <span className="sidebar-nested__brand">Acme</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Shop</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#overview">
                    <LayoutDashboard aria-hidden="true" />
                    <span>Overview</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {sections.map(({ label, Icon, open, pages }) => (
                <Collapsible key={label} asChild defaultOpen={open}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="sidebar-nested__section">
                        <Icon aria-hidden="true" />
                        <span>{label}</span>
                        <ChevronRight
                          aria-hidden="true"
                          className="sidebar-nested__arrow"
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {pages.map((page) => (
                          <SidebarMenuSubItem key={page.href}>
                            <SidebarMenuSubButton
                              href={page.href}
                              active={page.active}
                              aria-current={page.active ? "page" : undefined}
                            >
                              {page.label}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Help</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#guides">
                    <BookOpen aria-hidden="true" />
                    <span>Guides</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarMain className="sidebar-nested__main">
        <header className="sidebar-nested__bar">
          <SidebarTrigger />
          <h1 className="sidebar-nested__title">Revenue</h1>
        </header>
        {/* Your page goes here. */}
        <div className="sidebar-nested__page">
          <p className="sidebar-nested__hint">
            Open a section to see its pages. The page that's open is marked, and
            its section starts open.
          </p>
        </div>
      </SidebarMain>
    </SidebarProvider>
  );
}
