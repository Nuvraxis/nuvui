// The published packages, with the core first. The home page counts the
// add-ons from this list, and a test holds it to the packages folder.
export const packages = [
  {
    name: "@nuvui/react",
    text: "The React components, the tokens and the presets",
    href: "/docs",
  },
  {
    name: "@nuvui/table",
    text: "Tables, and a data table on TanStack Table",
    href: "/docs/table",
  },
  {
    name: "@nuvui/charts",
    text: "Charts on Recharts",
    href: "/docs/charts",
  },
  {
    name: "@nuvui/date-picker",
    text: "A calendar, a date field and a date range field",
    href: "/docs/date-picker",
  },
  {
    name: "@nuvui/scheduler",
    text: "An event calendar and a timeline, edited in place",
    href: "/docs/scheduler",
  },
  {
    name: "@nuvui/chat",
    text: "The parts of a conversation with an assistant",
    href: "/docs/chat",
  },
  {
    name: "@nuvui/kanban",
    text: "A board of cards, moved by mouse, touch or keyboard",
    href: "/docs/kanban",
  },
  {
    name: "@nuvui/editor",
    text: "A rich text editor on Tiptap",
    href: "/docs/editor",
  },
  {
    name: "@nuvui/map",
    text: "A map on MapLibre, with markers, routes and clusters",
    href: "/docs/map",
  },
  {
    name: "@nuvui/flow",
    text: "Flow diagrams that pan, zoom and can be edited",
    href: "/docs/flow",
  },
  {
    name: "@nuvui/media",
    text: "Video and audio players, with HLS and DASH streams",
    href: "/docs/media",
  },
  {
    name: "@nuvui/barcodes",
    text: "Barcodes and QR codes, drawn as SVG",
    href: "/docs/barcodes",
  },
  {
    name: "@nuvui/emoji",
    text: "An emoji picker and a reaction button",
    href: "/docs/emoji",
  },
  {
    name: "@nuvui/backgrounds",
    text: "Moving backgrounds, still for anyone who asked for less motion",
    href: "/docs/backgrounds",
  },
  {
    name: "@nuvui/3d",
    text: "A 3D model viewer for glTF, GLB and STL files",
    href: "/docs/3d",
  },
  {
    name: "@nuvui/icons",
    text: "Line icons in three styles",
    href: "/docs/icons",
  },
];

export const addOnCount = packages.length - 1;
