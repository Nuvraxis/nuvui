import {
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
import type { CSSProperties } from "react";

function Icon({ d }: { d: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

const icons = {
  home: "M2.5 7.5 8 3l5.5 4.5V13H10V9.5H6V13H2.5z",
  inbox:
    "M2.5 9.5l1.75-6h7.5l1.75 6V13h-11zM2.5 9.5h3.25l.75 1.5h3l.75-1.5h3.25",
  chart: "M3 13V8M8 13V3M13 13V6",
  people:
    "M6 7.5A2.25 2.25 0 1 0 6 3a2.25 2.25 0 0 0 0 4.5zM2 13c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5M11 3.2a2.25 2.25 0 0 1 0 4.1M12 9.8c1.2.4 2 1.4 2 3.2",
  settings: "M3 5h6M12 5h1M3 11h1M7 11h6M10.5 3.5v3M5.5 9.5v3",
  help: "M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12zM6.5 6.25a1.6 1.6 0 1 1 2.4 1.4c-.6.35-.9.7-.9 1.35M8 11.25v.01",
};

export default function Example() {
  return (
    <SidebarProvider
      // In an app the layout fills the screen. Here it's a box.
      style={
        {
          "--nuv-sidebar-height": "26rem",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        } as CSSProperties
      }
    >
      <Sidebar label="Main">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Acme, home">
                <a href="#home">
                  <Icon d={icons.home} />
                  <span style={{ fontWeight: 600 }}>Acme</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild active tooltip="Inbox">
                  <a href="#inbox">
                    <Icon d={icons.inbox} />
                    <span>Inbox</span>
                    <SidebarMenuBadge>12</SidebarMenuBadge>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Reports">
                  <a href="#reports">
                    <Icon d={icons.chart} />
                    <span>Reports</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Customers">
                  <a href="#customers">
                    <Icon d={icons.people} />
                    <span>Customers</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <a href="#settings">
                    <Icon d={icons.settings} />
                    <span>Settings</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Help">
                <a href="#help">
                  <Icon d={icons.help} />
                  <span>Help</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      {/* A page has one main element, and on this page it's the docs' own.
          In an app, leave asChild out and SidebarMain is that element. */}
      <SidebarMain asChild>
        <div style={{ padding: 16 }}>
          <SidebarTrigger />
          <p style={{ margin: "12px 0 4px", fontSize: 18, fontWeight: 600 }}>
            Inbox
          </p>
          <p style={{ margin: 0, fontSize: 14 }}>
            Twelve conversations are waiting for a reply.
          </p>
        </div>
      </SidebarMain>
    </SidebarProvider>
  );
}
