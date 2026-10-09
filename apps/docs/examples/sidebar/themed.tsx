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
import "./themed.css";

const pages = ["Overview", "Deployments", "Logs", "Billing"];

function Menu() {
  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Project</SidebarGroupLabel>
        <SidebarMenu>
          {pages.map((page, index) => (
            <SidebarMenuItem key={page}>
              <SidebarMenuButton asChild active={index === 0}>
                <a href={`#${page.toLowerCase()}`}>{page}</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
}

const box = {
  "--nuv-sidebar-height": "16rem",
  "--nuv-sidebar-width": "11rem",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  overflow: "hidden",
} as CSSProperties;

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 16, inlineSize: "100%" }}>
      <SidebarProvider cookieName={null} shortcut={null} style={box}>
        {/* Dark, even while the page is light. */}
        <Sidebar label="Dark sidebar" collapsible="offcanvas" data-theme="dark">
          <Menu />
        </Sidebar>
        <SidebarMain asChild>
          <div style={{ padding: 16 }}>
            <SidebarTrigger label="Toggle the dark sidebar" />
          </div>
        </SidebarMain>
      </SidebarProvider>
      <SidebarProvider cookieName={null} shortcut={null} style={box}>
        <Sidebar
          label="Brand sidebar"
          collapsible="offcanvas"
          className="brand-sidebar"
        >
          <Menu />
        </Sidebar>
        <SidebarMain asChild>
          <div style={{ padding: 16 }}>
            <SidebarTrigger label="Toggle the brand sidebar" />
          </div>
        </SidebarMain>
      </SidebarProvider>
    </div>
  );
}
