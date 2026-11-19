"use client";

import { DiffEditor } from "@nuvui/editor/code";

const before = `export const shipping = {
  carrier: "Northwind Freight",
  days: 5,
  free_over: 80,
};

export function cost(total: number) {
  if (total > shipping.free_over) return 0;
  return 6.5;
}
`;

const after = `export const shipping = {
  carrier: "Northwind Freight",
  days: 3,
  freeOver: 60,
};

export function cost(total: number, express = false) {
  if (total >= shipping.freeOver) return 0;
  return express ? 12 : 6.5;
}
`;

export default function Example() {
  return (
    <div style={{ inlineSize: "100%" }}>
      <DiffEditor
        aria-label="Changes to shipping.ts"
        original={before}
        defaultModified={after}
        language="typescript"
      />
    </div>
  );
}
