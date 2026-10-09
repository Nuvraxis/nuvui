import { FormattedNumber } from "@nuvui/react";

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
      <dt>Seats</dt>
      <dd style={{ margin: 0, textAlign: "end" }}>
        <FormattedNumber value={12480} />
      </dd>
      <dt>Revenue</dt>
      <dd style={{ margin: 0, textAlign: "end" }}>
        <FormattedNumber value={48250.5} currency="USD" />
      </dd>
      <dt>Conversion</dt>
      <dd style={{ margin: 0, textAlign: "end" }}>
        <FormattedNumber
          value={0.0734}
          format="percent"
          maximumFractionDigits={1}
        />
      </dd>
      <dt>Requests</dt>
      <dd style={{ margin: 0, textAlign: "end" }}>
        <FormattedNumber value={3_482_900} compact />
      </dd>
    </dl>
  );
}
