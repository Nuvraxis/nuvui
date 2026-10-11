import { forwardRef, type ReactNode, type SVGAttributes } from "react";
import { cx } from "../../utils/cx";
import { encodeQRCode, type QRCodeErrorCorrection } from "./encode";

export interface QRCodeOwnProps {
  /** What the code holds: an address, most often, or any text. */
  value: string;
  /**
   * The width and the height, in pixels, with the empty edge.
   * @default 160
   */
  size?: number;
  /**
   * How much of the code can be lost and still be read, from `"L"`, about
   * 7%, to `"H"`, about 30%. Left out, it's `"M"`, or `"H"` when there's
   * an `overlay`, which covers part of the code.
   */
  errorCorrection?: QRCodeErrorCorrection;
  /**
   * The empty space around the code, counted in its squares. A scanner
   * finds the code by it, and the standard asks for four.
   * @default 4
   */
  quietZone?: number;
  /**
   * Something drawn over the middle, such as a logo. It's SVG, drawn in a
   * box 100 by 100: an `<image>`, shapes of your own, or
   * `<QRCodeSwissCross />`. The squares under it are lost, which the
   * error correction makes up for.
   */
  overlay?: ReactNode;
  /**
   * How much of the code's side the overlay takes, from 0.1 to 0.3. More
   * than a fifth and some phones stop reading it: try the code you ship.
   * @default 0.2
   */
  overlaySize?: number;
  /**
   * What's drawn when the value can't be a QR code: nothing to encode, or
   * more than one holds. Without it there's an empty box with a line
   * through it, which no scanner reads as anything.
   */
  fallback?: ReactNode;
}

export interface QRCodeProps
  extends QRCodeOwnProps,
    Omit<SVGAttributes<SVGSVGElement>, keyof QRCodeOwnProps> {}

// How many squares the empty box has along a side: the smallest code's.
const emptySize = 21;

/**
 * A QR code, drawn as an SVG. It's a picture with a name: say what the
 * code is for with `aria-label`, and without one the name is the value.
 *
 * It has no state and needs no browser, so it can be a server component.
 */
export const QRCode = forwardRef<SVGSVGElement, QRCodeProps>(function QRCode(
  {
    value,
    size = 160,
    errorCorrection,
    quietZone = 4,
    overlay,
    overlaySize = 0.2,
    fallback,
    className,
    "aria-label": label,
    "aria-labelledby": labelledBy,
    ...props
  },
  ref,
) {
  const covered =
    overlay !== undefined && overlay !== null && overlay !== false;
  const encoding = encodeQRCode(value, {
    errorCorrection: errorCorrection ?? (covered ? "H" : "M"),
  });
  if (!encoding && fallback !== undefined) return fallback;

  const side = encoding?.size ?? emptySize;
  const whole = side + quietZone * 2;
  const name = labelledBy ? undefined : (label ?? value);
  const root = {
    ref,
    width: size,
    height: size,
    viewBox: `0 0 ${whole} ${whole}`,
    ...props,
  };

  if (!encoding) {
    // The line is drawn in the code's squares, so its width is set against
    // the size the code is shown at.
    const hair = whole / size;
    return (
      <svg
        {...root}
        role="img"
        aria-label={name}
        aria-labelledby={labelledBy}
        className={cx("nuv-qrcode", className)}
        data-invalid=""
      >
        <rect className="nuv-qrcode__ground" width="100%" height="100%" />
        <path
          className="nuv-qrcode__mark"
          strokeWidth={hair}
          strokeDasharray={`${hair * 4} ${hair * 3}`}
          d={`M${hair / 2} ${hair / 2}H${whole - hair / 2}V${whole - hair / 2}H${hair / 2}ZM${hair / 2} ${whole - hair / 2}L${whole - hair / 2} ${hair / 2}`}
        />
      </svg>
    );
  }

  let squares = "";
  for (const [y, row] of encoding.rows.entries()) {
    // One shape for each run of dark squares in a row.
    let x = 0;
    while (x < side) {
      if (!row[x]) {
        x += 1;
        continue;
      }
      let end = x;
      while (end < side && row[end]) end += 1;
      squares += `M${x + quietZone} ${y + quietZone}h${end - x}v1h${x - end}z`;
      x = end;
    }
  }

  const share = Math.min(0.3, Math.max(0.1, overlaySize));
  // To a thousandth of a square, so the markup has no long fractions.
  const box = Math.round(side * share * 1000) / 1000;
  const corner = Math.round((quietZone + (side - box) / 2) * 1000) / 1000;

  return (
    <svg
      {...root}
      role="img"
      aria-label={name}
      aria-labelledby={labelledBy}
      className={cx("nuv-qrcode", className)}
      data-error-correction={encoding.errorCorrection}
      data-version={encoding.version}
    >
      <rect className="nuv-qrcode__ground" width="100%" height="100%" />
      <path className="nuv-qrcode__squares" d={squares} />
      {covered ? (
        // Part of the picture above, which has the name.
        // biome-ignore lint/a11y/noSvgWithoutTitle: see above
        <svg
          className="nuv-qrcode__overlay"
          x={corner}
          y={corner}
          width={box}
          height={box}
          viewBox="0 0 100 100"
        >
          <rect className="nuv-qrcode__ground" width="100" height="100" />
          {overlay}
        </svg>
      ) : null}
    </svg>
  );
});

export interface QRCodeSwissCrossProps extends SVGAttributes<SVGGElement> {}

/**
 * The Swiss cross that marks a QR-bill's code, for `overlay`. The rules
 * for a QR-bill ask for error correction `"M"` and a cross 7 mm wide on a
 * code of 46 mm, which is an `overlaySize` of 0.152.
 */
export const QRCodeSwissCross = forwardRef<SVGGElement, QRCodeSwissCrossProps>(
  function QRCodeSwissCross(props, ref) {
    return (
      <g ref={ref} {...props}>
        <rect
          className="nuv-qrcode__cross-ground"
          x="8"
          y="8"
          width="84"
          height="84"
        />
        <path
          className="nuv-qrcode__cross-arms"
          d="M42.125 23.75h15.75v18.375h18.375v15.75H57.875v18.375h-15.75V57.875H23.75v-15.75h18.375z"
        />
      </g>
    );
  },
);
