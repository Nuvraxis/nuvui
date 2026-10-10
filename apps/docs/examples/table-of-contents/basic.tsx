import { TableOfContents, type TableOfContentsItem } from "@nuvui/react";

// The headings of the page this example is on.
const items: TableOfContentsItem[] = [
  { id: "install", title: "Install" },
  { id: "import", title: "Import" },
  { id: "props", title: "Props" },
  { id: "accessibility", title: "Accessibility" },
  {
    id: "what-the-component-handles",
    title: "What the component handles",
    depth: 2,
  },
  { id: "css-variables", title: "CSS variables" },
];

export default function Example() {
  return (
    <TableOfContents
      aria-label="On this page"
      items={items}
      // This site's headings stop 112 pixels down when a link jumps to
      // them, under its header.
      offset={128}
      style={{ inlineSize: "100%", maxInlineSize: 260 }}
    />
  );
}
