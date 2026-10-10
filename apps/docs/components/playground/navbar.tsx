"use client";

import {
  Button,
  Navbar,
  NavbarActions,
  NavbarBrand,
  NavbarLink,
  NavbarMenu,
  NavbarNav,
  type NavbarProps,
} from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl } from "./controls";

type Collapse = NonNullable<NavbarProps["collapse"]>;

const collapses = Object.keys({
  sm: true,
  md: true,
  lg: true,
} satisfies Record<Collapse, true>) as Collapse[];

const pages = ["Orders", "Customers", "Reports"] as const;

export function NavbarPlayground() {
  const [collapse, setCollapse] = useState<Collapse>("md");
  const [current, setCurrent] = useState<(typeof pages)[number]>("Orders");

  const links = pages
    .map(
      (page) =>
        `    <NavbarLink href="/${page.toLowerCase()}"${page === current ? " current" : ""}>${page}</NavbarLink>`,
    )
    .join("\n");
  const code = `<Navbar${collapse === "md" ? "" : ` collapse="${collapse}"`}>
  <NavbarBrand>Acme</NavbarBrand>
  <NavbarNav aria-label="Main">
${links}
  </NavbarNav>
  <NavbarActions>
    <Button size="sm">New order</Button>
    <NavbarMenu>{/* the same links */}</NavbarMenu>
  </NavbarActions>
</Navbar>`;

  const items = pages.map((page) => (
    <NavbarLink
      key={page}
      href={`#${page.toLowerCase()}`}
      current={page === current}
    >
      {page}
    </NavbarLink>
  ));

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="collapse"
            value={collapse}
            options={collapses}
            onChange={setCollapse}
          />
          <SelectControl
            label="current"
            value={current}
            options={pages}
            onChange={setCurrent}
          />
        </>
      }
    >
      <Navbar collapse={collapse} style={{ inlineSize: "100%" }}>
        <NavbarBrand>Acme</NavbarBrand>
        <NavbarNav aria-label="Main">{items}</NavbarNav>
        <NavbarActions>
          <Button size="sm">New order</Button>
          <NavbarMenu>
            <nav aria-label="Main">{items}</nav>
          </NavbarMenu>
        </NavbarActions>
      </Navbar>
    </Playground>
  );
}
