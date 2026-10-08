"use client";

import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMain,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@nuvui/react";
import {
  ChartColumn,
  ChevronsUpDown,
  FileText,
  Hexagon,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Users,
} from "lucide-react";
import "./sidebar-icons.scss";

const workspace = [
  { label: "Overview", href: "#overview", Icon: LayoutDashboard, active: true },
  { label: "Inbox", href: "#inbox", Icon: Inbox, badge: "12" },
  { label: "Reports", href: "#reports", Icon: ChartColumn },
  { label: "Customers", href: "#customers", Icon: Users },
  { label: "Invoices", href: "#invoices", Icon: FileText },
];

const account = [
  { label: "Settings", href: "#settings", Icon: Settings },
  { label: "Help", href: "#help", Icon: LifeBuoy },
];

export default function SidebarIcons() {
  return (
    <SidebarProvider className="sidebar-icons">
      <Sidebar label="Main">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Acme, home">
                <a href="#home">
                  <Hexagon aria-hidden="true" />
                  <span className="sidebar-icons__brand">Acme</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarMenu>
              {workspace.map(({ label, href, Icon, active, badge }) => (
                <SidebarMenuItem key={href}>
                  {/* Every item has a tooltip. It names the icon when the
                      icon is all that's left of the item. */}
                  <SidebarMenuButton asChild active={active} tooltip={label}>
                    <a href={href} aria-current={active ? "page" : undefined}>
                      <Icon aria-hidden="true" />
                      <span>{label}</span>
                      {badge ? (
                        <SidebarMenuBadge>{badge}</SidebarMenuBadge>
                      ) : null}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarMenu>
              {account.map(({ label, href, Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild tooltip={label}>
                    <a href={href}>
                      <Icon aria-hidden="true" />
                      <span>{label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    className="sidebar-icons__person"
                    tooltip="Ada Lovelace"
                  >
                    <Avatar size="sm" className="sidebar-icons__avatar">
                      <AvatarFallback>AL</AvatarFallback>
                    </Avatar>
                    <span>Ada Lovelace</span>
                    <ChevronsUpDown aria-hidden="true" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start">
                  <DropdownMenuLabel>ada@example.com</DropdownMenuLabel>
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Billing</DropdownMenuItem>
                  <DropdownMenuItem>Team</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarMain className="sidebar-icons__main">
        <header className="sidebar-icons__bar">
          <SidebarTrigger />
          <h1 className="sidebar-icons__title">Overview</h1>
        </header>
        {/* Your page goes here. */}
        <div className="sidebar-icons__page">
          <p className="sidebar-icons__hint">
            Fold the sidebar with the button above, or with Ctrl+B. On a phone
            it opens as a panel.
          </p>
        </div>
      </SidebarMain>
    </SidebarProvider>
  );
}
