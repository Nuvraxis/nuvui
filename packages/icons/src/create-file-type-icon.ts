import {
  createElement,
  type ForwardRefExoticComponent,
  forwardRef,
  type RefAttributes,
  type SVGProps,
} from "react";
import { type IconNode, named } from "./create-icon";
import { fileTypeSize } from "./strokes";

/** The props a file type icon has of its own, beside what an `<svg>` takes. */
export interface FileTypeIconOwnProps {
  /**
   * Width and height. A number is in pixels. The extension on the tag is
   * hard to read below 24.
   * @default 32
   */
  size?: number | string;
  /**
   * What the icon means, for a screen reader, when nothing next to it says
   * so. Without it, or an `aria-label`, the icon is hidden from screen
   * readers, which is right for one beside the file's name.
   */
  title?: string;
}

export interface FileTypeIconProps
  extends FileTypeIconOwnProps,
    Omit<SVGProps<SVGSVGElement>, "ref" | keyof FileTypeIconOwnProps> {}

export type FileTypeIconComponent = ForwardRefExoticComponent<
  FileTypeIconProps & RefAttributes<SVGSVGElement>
>;

/**
 * A file type icon: a page in the color of the text around it, with a tag
 * on it in colors of its own. Each shape carries its own paint, since the
 * tag's colors are part of the drawing.
 */
export function createFileTypeIcon(
  name: string,
  nodes: IconNode,
): FileTypeIconComponent {
  const Icon = forwardRef<SVGSVGElement, FileTypeIconProps>(function Icon(
    { size = fileTypeSize, title, children, ...rest },
    ref,
  ) {
    return createElement(
      "svg",
      {
        ref,
        width: size,
        height: size,
        viewBox: `0 0 ${fileTypeSize} ${fileTypeSize}`,
        fill: "none",
        ...named(title, rest),
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
