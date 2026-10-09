import { FormattedNumber } from "@nuvui/react";

const places = [
  { locale: "en-US", currency: "USD", name: "United States" },
  { locale: "de-DE", currency: "EUR", name: "Germany" },
  { locale: "fr-CH", currency: "CHF", name: "Switzerland, in French" },
  { locale: "en-IN", currency: "INR", name: "India" },
  { locale: "ja-JP", currency: "JPY", name: "Japan" },
];

export default function Example() {
  return (
    <dl
      style={{
        display: "grid",
        gridTemplateColumns: "auto auto",
        gap: "0.5rem 2rem",
        margin: 0,
      }}
    >
      {places.map(({ locale, currency, name }) => (
        <div key={locale} style={{ display: "contents" }}>
          <dt>{name}</dt>
          <dd style={{ margin: 0, textAlign: "end" }}>
            <FormattedNumber
              value={1234567.5}
              locale={locale}
              currency={currency}
            />
          </dd>
        </div>
      ))}
    </dl>
  );
}
