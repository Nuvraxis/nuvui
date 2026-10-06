"use client";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@nuvui/react";
import { useState } from "react";
import {
  CheckboxControl,
  Playground,
  SelectControl,
  TextControl,
} from "./controls";

const separators = ["arrow", "/", "·"] as const;
type Separator = (typeof separators)[number];

export function BreadcrumbPlayground() {
  const [separator, setSeparator] = useState<Separator>("arrow");
  const [collapsed, setCollapsed] = useState(false);
  const [current, setCurrent] = useState("Breadcrumb");

  const mark =
    separator === "arrow" ? (
      <BreadcrumbSeparator />
    ) : (
      <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
    );
  const markCode =
    separator === "arrow"
      ? "<BreadcrumbSeparator />"
      : `<BreadcrumbSeparator>${separator}</BreadcrumbSeparator>`;
  const middle = collapsed
    ? "<BreadcrumbEllipsis />"
    : '<BreadcrumbLink href="/docs">Docs</BreadcrumbLink>';
  const code = `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    ${markCode}
    <BreadcrumbItem>
      ${middle}
    </BreadcrumbItem>
    ${markCode}
    <BreadcrumbItem>
      <BreadcrumbPage>${current}</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="separator"
            value={separator}
            options={separators}
            onChange={setSeparator}
          />
          <TextControl
            label="current page"
            value={current}
            onChange={setCurrent}
          />
          <CheckboxControl
            label="collapse the middle"
            checked={collapsed}
            onChange={setCollapsed}
          />
        </>
      }
    >
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          {mark}
          <BreadcrumbItem>
            {collapsed ? (
              <BreadcrumbEllipsis />
            ) : (
              <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {mark}
          <BreadcrumbItem>
            <BreadcrumbPage>{current}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </Playground>
  );
}
