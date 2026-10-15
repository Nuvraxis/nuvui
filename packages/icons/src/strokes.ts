// How each style ends and joins its lines, as the cover page of the Figma
// file has it. The generator reads this too: what an icon's own lines say
// the same as its style is left out of the icon, and only what differs is
// written into it.

export const iconStyles = ["rounded", "standard", "sharp"] as const;

export type IconStyle = (typeof iconStyles)[number];

export const strokes = {
  rounded: { strokeLinecap: "round", strokeLinejoin: "round" },
  standard: { strokeLinecap: "round", strokeLinejoin: "round" },
  sharp: {
    strokeLinecap: "square",
    strokeLinejoin: "miter",
    strokeMiterlimit: "3",
  },
} as const satisfies Record<IconStyle, Record<string, string>>;

// The grid every icon is drawn on, and the weight of its line.
export const iconSize = 24;
export const iconStrokeWidth = 1.5;
