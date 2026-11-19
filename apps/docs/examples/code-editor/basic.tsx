"use client";

import { CodeEditor } from "@nuvui/editor/code";

const start = `// Splits an order into the boxes it ships in.
interface Item {
  sku: string;
  weight: number;
}

export function pack(items: Item[], most = 20): Item[][] {
  const boxes: Item[][] = [[]];
  let load = 0;
  for (const item of items) {
    if (load + item.weight > most) {
      boxes.push([]);
      load = 0;
    }
    boxes[boxes.length - 1]?.push(item);
    load += item.weight;
  }
  return boxes;
}
`;

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 720 }}>
      <CodeEditor
        aria-label="Packing script"
        defaultLanguage="typescript"
        defaultValue={start}
        maxLines={18}
      />
    </div>
  );
}
