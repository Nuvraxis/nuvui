import { forwardRef, type ReactNode, type SVGAttributes } from "react";
import { cx } from "../../utils/cx";
import { type BarcodeType, encodeBarcode } from "./encode";

export interface BarcodeOwnProps {
  /** What the barcode holds. */
  value: string;
  /**
   * The kind of barcode. Each takes its own values: an EAN-13 is twelve
   * or thirteen digits, a Code 39 is capitals, digits and a few signs,
   * and a Code 128 is any ASCII text.
   * @default "code128"
   */
  type?: BarcodeType;
  /**
   * The width of the narrowest bar, in pixels. A scanner needs it to be
   * a whole number of the screen's or the printer's dots.
   * @default 2
   */
  barWidth?: number;
  /**
   * The height of the bars, in pixels. The text is under that.
   * @default 64
   */
  height?: number;
  /**
   * The empty space at each end, counted in narrowest bars. A scanner
   * finds the barcode by it, and most kinds ask for ten.
   * @default 10
   */
  quietZone?: number;
  /**
   * Writes the value under the bars, for someone to type when it won't
   * scan.
   * @default true
   */
  showText?: boolean;
  /**
   * Written under the bars in place of the value: the same number with
   * spaces in it, say. An EAN or a UPC writes its own digits whatever
   * this is.
   */
  text?: string;
  /**
   * The size of the text, in pixels.
   * @default 14
   */
  textSize?: number;
  /**
   * An EAN or a UPC with every bar the same height and its digits in one
   * line, in place of the usual look with taller bars at the ends and in
   * the middle.
   * @default false
   */
  flat?: boolean;
  /**
   * What's drawn when the value can't be a barcode of this kind. Without
   * it there's an empty box with a line through it, which no scanner
   * reads as anything.
   */
  fallback?: ReactNode;
}

export interface BarcodeProps
  extends BarcodeOwnProps,
    Omit<SVGAttributes<SVGSVGElement>, keyof BarcodeOwnProps> {}

// Between the bars and the text.
const gap = 2;
// How wide the box is when there's nothing to measure, in narrowest bars.
const emptyModules = 96;

/**
 * A barcode, drawn as an SVG. It's a picture with a name: say what the
 * code is for with `aria-label`, and without one the name is the value.
 *
 * It has no state and needs no browser, so it can be a server component.
 */
export const Barcode = forwardRef<SVGSVGElement, BarcodeProps>(function Barcode(
  {
    value,
    type = "code128",
    barWidth = 2,
    height = 64,
    quietZone = 10,
    showText = true,
    text,
    textSize = 14,
    flat = false,
    fallback,
    className,
    "aria-label": label,
    "aria-labelledby": labelledBy,
    ...props
  },
  ref,
) {
  const encoding = encodeBarcode(value, type, { text, flat });
  if (!encoding && fallback !== undefined) return fallback;

  const edge = quietZone * barWidth;
  const width =
    ((encoding?.modules ?? emptyModules) + quietZone * 2) * barWidth;
  // Room under the bars for the text and what hangs below its line.
  const total = showText ? height + gap + textSize * 1.25 : height;
  const guardHeight = showText ? height + gap + textSize / 2 : height;
  const name = labelledBy ? undefined : (label ?? encoding?.text ?? value);

  const root = {
    ref,
    width,
    height: total,
    viewBox: `0 0 ${width} ${total}`,
    ...props,
  };

  if (!encoding) {
    return (
      <svg
        {...root}
        role="img"
        aria-label={name}
        aria-labelledby={labelledBy}
        className={cx("nuv-barcode", className)}
        data-invalid=""
      >
        <rect className="nuv-barcode__ground" width="100%" height="100%" />
        <path
          className="nuv-barcode__mark"
          d={`M0.5 0.5H${width - 0.5}V${total - 0.5}H0.5ZM0.5 ${total - 0.5}L${width - 0.5} 0.5`}
        />
      </svg>
    );
  }

  let bars = "";
  const texts: ReactNode[] = [];
  let start = edge;

  for (const [index, part] of encoding.parts.entries()) {
    const tall = part.guard ? guardHeight : height;
    // One shape for each run of bars that touch.
    for (const run of part.bars.matchAll(/1+/g)) {
      const x = start + run.index * barWidth;
      const across = run[0].length * barWidth;
      bars += `M${x} 0h${across}v${tall}h${-across}z`;
    }
    const end = start + part.bars.length * barWidth;
    if (showText && part.text) {
      const [x, anchor] =
        part.align === "start"
          ? ([start, "start"] as const)
          : part.align === "end"
            ? ([end, "end"] as const)
            : ([(start + end) / 2, "middle"] as const);
      texts.push(
        <text
          // The parts of one barcode never change places.
          key={index}
          className="nuv-barcode__text"
          x={x}
          y={height + gap + textSize}
          textAnchor={anchor}
          fontSize={textSize}
        >
          {part.text}
        </text>,
      );
    }
    start = end;
  }

  return (
    <svg
      {...root}
      role="img"
      aria-label={name}
      aria-labelledby={labelledBy}
      className={cx("nuv-barcode", className)}
      data-type={encoding.type}
    >
      <rect className="nuv-barcode__ground" width="100%" height="100%" />
      <path className="nuv-barcode__bars" d={bars} />
      {texts}
    </svg>
  );
});
