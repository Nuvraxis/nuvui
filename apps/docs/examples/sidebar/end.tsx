import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMain,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@nuvui/react";
import type { CSSProperties } from "react";

const sections = ["Summary", "Activity", "Files", "Comments"];

export default function Example() {
  return (
    <SidebarProvider
      cookieName={null}
      shortcut={null}
      style={
        {
          "--nuv-sidebar-height": "16rem",
          "--nuv-sidebar-width": "12rem",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        } as CSSProperties
      }
    >
      <SidebarMain asChild>
        <div style={{ padding: 16, textAlign: "end" }}>
          <SidebarTrigger label="Toggle details" />
        </div>
      </SidebarMain>
      {/* After the page, to match the side it's on. */}
      <Sidebar side="end" collapsible="offcanvas" label="Details">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Order 10248</SidebarGroupLabel>
            <SidebarMenu>
              {sections.map((section, index) => (
                <SidebarMenuItem key={section}>
                  <SidebarMenuButton asChild active={index === 0}>
                    <a href={`#${section.toLowerCase()}`}>{section}</a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
