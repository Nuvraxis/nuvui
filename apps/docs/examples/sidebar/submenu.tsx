import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
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

const chart = "M3 13V8M8 13V3M13 13V6";
const file = "M4 2.5h5l3 3v8H4zM9 2.5v3h3";

export default function Example() {
  return (
    <SidebarProvider
      // This page has several sidebars. Only the first one remembers its
      // state and takes the shortcut.
      cookieName={null}
      shortcut={null}
      style={
        {
          "--nuv-sidebar-height": "20rem",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        } as CSSProperties
      }
    >
      <Sidebar label="Reports menu">
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <Collapsible asChild defaultOpen>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Reports">
                      <Icon d={chart} />
                      <span>Reports</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton href="#revenue" active>
                          Revenue
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton href="#churn">
                          Churn
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton href="#usage">
                          Usage
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Invoices">
                  <a href="#invoices">
                    <Icon d={file} />
                    <span>Invoices</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarMain asChild>
        <div style={{ padding: 16 }}>
          <SidebarTrigger />
        </div>
      </SidebarMain>
    </SidebarProvider>
  );
}
