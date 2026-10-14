import {
  createElement,
  type ForwardRefExoticComponent,
  forwardRef,
  type RefAttributes,
  type SVGProps,
} from "react";
import { type IconStyle, iconSize, iconStrokeWidth, strokes } from "./strokes";

export type { IconStyle } from "./strokes";

/** The shapes of an icon: each an SVG element's name and its attributes. */
export type IconNode = readonly (readonly [
  element: string,
  attributes: Readonly<Record<string, string>>,
])[];

/** The props an icon has of its own, beside what an `<svg>` takes. */
export interface IconOwnProps {
  /**
   * Width and height. A number is in pixels.
   * @default 24
   */
  size?: number | string;
  /**
   * How thick the lines are, in the units of the 24 by 24 grid the icon is
   * drawn on, so it grows and shrinks with `size`.
   * @default 1.5
   */
  strokeWidth?: number | string;
  /**
   * What the icon means, for a screen reader, when nothing next to it says
   * so. Without it, or an `aria-label`, the icon is hidden from screen
   * readers, which is right for one beside text that says the same.
   */
  title?: string;
}

export interface IconProps
  extends IconOwnProps,
    Omit<SVGProps<SVGSVGElement>, "ref" | keyof IconOwnProps> {}

export type IconComponent = ForwardRefExoticComponent<
  IconProps & RefAttributes<SVGSVGElement>
>;

/**
 * An icon component drawn the way the set's own icons are: in the color of
 * the text around it, on a 24 by 24 grid, with lines ended and joined as
 * `style` has them.
 */
export function createIcon(
  name: string,
  style: IconStyle,
  nodes: IconNode,
): IconComponent {
  const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
    {
      size = iconSize,
      strokeWidth = iconStrokeWidth,
      title,
      children,
      ...rest
    },
    ref,
  ) {
    const named =
      title !== undefined ||
      rest["aria-label"] !== undefined ||
      rest["aria-labelledby"] !== undefined;
    return createElement(
      "svg",
      {
        ref,
        width: size,
        height: size,
        viewBox: `0 0 ${iconSize} ${iconSize}`,
        fill: "none",
        stroke: "currentColor",
        strokeWidth,
        ...strokes[style],
        ...(named ? { role: "img" } : { "aria-hidden": true }),
        ...rest,
      },
      title === undefined ? null : createElement("title", null, title),
      ...nodes.map(([element, attributes]) =>
        createElement(element, attributes),
      ),
      children,
    );
  });
  Icon.displayName = name;
  return Icon;
}
