"use client";

import { TableOfContents } from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl } from "./controls";

// The headings of the page this is on.
const items = [
  { id: "install", title: "Install" },
  { id: "import", title: "Import" },
  { id: "try-it", title: "Try it" },
  { id: "props", title: "Props" },
  { id: "accessibility", title: "Accessibility" },
];

const values = ["follows the page", "install", "props", "null"] as const;
// This site's headings stop 112 pixels down when a link jumps to them, so
// the default of 96 would mark the heading before.
const offsets = ["0", "128", "240"] as const;

export function TableOfContentsPlayground() {
  const [value, setValue] =
    useState<(typeof values)[number]>("follows the page");
  const [offset, setOffset] = useState<(typeof offsets)[number]>("128");

  const props = [
    "items={items}",
    value === "null" && "value={null}",
    value !== "null" && value !== "follows the page" && `value="${value}"`,
    `offset={${offset}}`,
  ].filter(Boolean);
  const code = `<TableOfContents aria-label="On this page" ${props.join(" ")} />`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="value"
            value={value}
            options={values}
            onChange={setValue}
          />
          <SelectControl
            label="offset"
            value={offset}
            options={offsets}
            onChange={setOffset}
          />
        </>
      }
    >
      <TableOfContents
        aria-label="On this page"
        items={items}
        value={
          value === "follows the page"
            ? undefined
            : value === "null"
              ? null
              : value
        }
        offset={Number(offset)}
        style={{ inlineSize: "100%", maxInlineSize: 260 }}
      />
    </Playground>
  );
}
