"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMain,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  type SidebarProps,
  SidebarProvider,
  SidebarTrigger,
} from "@nuvui/react";
import { type CSSProperties, useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

type Side = NonNullable<SidebarProps["side"]>;
type Collapsible = NonNullable<SidebarProps["collapsible"]>;

const sides = Object.keys({
  start: true,
  end: true,
} satisfies Record<Side, true>) as Side[];

const modes = Object.keys({
  icon: true,
  offcanvas: true,
  none: true,
} satisfies Record<Collapsible, true>) as Collapsible[];

const pages = [
  { name: "Inbox", d: "M2.5 9.5l1.75-6h7.5l1.75 6V13h-11zM2.5 9.5h11" },
  { name: "Reports", d: "M3 13V8M8 13V3M13 13V6" },
  { name: "Settings", d: "M3 5h6M12 5h1M3 11h1M7 11h6M10.5 3.5v3M5.5 9.5v3" },
];

export function SidebarPlayground() {
  const [side, setSide] = useState<Side>("start");
  const [collapsible, setCollapsible] = useState<Collapsible>("icon");
  const [tooltips, setTooltips] = useState(true);

  const props = [
    side !== "start" && `side="${side}"`,
    collapsible !== "icon" && `collapsible="${collapsible}"`,
  ].filter(Boolean);
  const bar = `  <Sidebar${props.map((prop) => ` ${prop}`).join("")}>
    ...
    <SidebarMenuButton${tooltips ? ' tooltip="Inbox"' : ""}>...</SidebarMenuButton>
  </Sidebar>`;
  const main = `  <SidebarMain>
    <SidebarTrigger />
  </SidebarMain>`;
  const code = `<SidebarProvider>
${side === "start" ? `${bar}\n${main}` : `${main}\n${bar}`}
</SidebarProvider>`;

  const sidebar = (
    <Sidebar side={side} collapsible={collapsible} label="Playground menu">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            {pages.map((page, index) => (
              <SidebarMenuItem key={page.name}>
                <SidebarMenuButton
                  active={index === 0}
                  tooltip={tooltips ? page.name : undefined}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={page.d} />
                  </svg>
                  <span>{page.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
  const page = (
    <SidebarMain asChild>
      <div style={{ padding: 16, textAlign: side === "end" ? "end" : "start" }}>
        <SidebarTrigger />
      </div>
    </SidebarMain>
  );

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="side"
            value={side}
            options={sides}
            onChange={setSide}
          />
          <SelectControl
            label="collapsible"
            value={collapsible}
            options={modes}
            onChange={setCollapsible}
          />
          <CheckboxControl
            label="with tooltips"
            checked={tooltips}
            onChange={setTooltips}
          />
        </>
      }
    >
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
        {side === "start" ? sidebar : page}
        {side === "start" ? page : sidebar}
      </SidebarProvider>
    </Playground>
  );
}
