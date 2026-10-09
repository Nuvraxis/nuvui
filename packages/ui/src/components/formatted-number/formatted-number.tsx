import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";

export interface FormatNumberOptions {
  /**
   * The language and region whose rules the number is written by, as a
   * BCP 47 tag such as `"de-DE"`. It's `"en-US"` unless you say otherwise,
   * and never the visitor's own: the server and the browser would then
   * write two different texts for one page.
   * @default "en-US"
   */
  locale?: string;
  /**
   * `"percent"` takes a ratio, so 0.25 is written as 25%. `"currency"`
   * needs `currency`.
   * @default "decimal"
   */
  format?: "decimal" | "percent" | "currency";
  /**
   * The currency, as an ISO 4217 code such as `"EUR"`. Giving one is enough
   * to get a currency: `format` can be left out.
   */
  currency?: string;
  /**
   * Writes a large number short, as in 1.2M.
   * @default false
   */
  compact?: boolean;
  /**
   * When the sign is written. `"exceptZero"` writes a plus on a gain, for
   * a number that's a change.
   * @default "auto"
   */
  signDisplay?: "auto" | "always" | "exceptZero" | "never";
  /** The fewest digits after the decimal point. */
  minimumFractionDigits?: number;
  /** The most digits after the decimal point. */
  maximumFractionDigits?: number;
  /**
   * Anything else `Intl.NumberFormat` takes, such as a unit. What's here
   * wins over the props above.
   */
  options?: Intl.NumberFormatOptions;
}

// Making a formatter costs far more than using one, and a table writes
// hundreds of numbers the same way.
const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor({
  locale = "en-US",
  format,
  currency,
  compact = false,
  signDisplay,
  minimumFractionDigits,
  maximumFractionDigits,
  options,
}: FormatNumberOptions): Intl.NumberFormat {
  const settings: Intl.NumberFormatOptions = {
    style: format ?? (currency ? "currency" : "decimal"),
    ...(currency ? { currency } : {}),
    ...(compact ? { notation: "compact" } : {}),
    ...(signDisplay ? { signDisplay } : {}),
    ...(minimumFractionDigits === undefined ? {} : { minimumFractionDigits }),
    ...(maximumFractionDigits === undefined ? {} : { maximumFractionDigits }),
    ...options,
  };
  const key = `${locale} ${JSON.stringify(settings)}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, settings);
    formatters.set(key, formatter);
  }
  return formatter;
}

/**
 * A number as text, the way `FormattedNumber` writes it. For the places a
 * component can't go: an `aria-label`, a chart's axis, a page's title.
 */
export function formatNumber(
  value: number,
  options: FormatNumberOptions = {},
): string {
  return formatterFor(options).format(value);
}

export interface FormattedNumberOwnProps extends FormatNumberOptions {
  /** The number. */
  value: number;
}

export interface FormattedNumberProps
  extends FormattedNumberOwnProps,
    Omit<HTMLAttributes<HTMLDataElement>, "children"> {}

/**
 * A number written for a language and region: grouped digits, a currency, a
 * percentage, or a short form. It's a `data` element, which keeps the plain
 * number next to the text for anything that reads the page.
 */
export const FormattedNumber = forwardRef<
  HTMLDataElement,
  FormattedNumberProps
>(function FormattedNumber(
  {
    value,
    locale,
    format,
    currency,
    compact,
    signDisplay,
    minimumFractionDigits,
    maximumFractionDigits,
    options,
    className,
    ...props
  },
  ref,
) {
  return (
    <data
      ref={ref}
      value={value}
      className={cx("nuv-formatted-number", className)}
      {...props}
    >
      {formatNumber(value, {
        locale,
        format,
        currency,
        compact,
        signDisplay,
        minimumFractionDigits,
        maximumFractionDigits,
        options,
      })}
    </data>
  );
});
