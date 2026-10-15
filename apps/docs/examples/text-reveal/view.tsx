import { TextReveal } from "@nuvui/react";

export default function Example() {
  return (
    <p style={{ margin: 0, fontSize: "var(--text-2xl)", lineHeight: 1.3 }}>
      <TextReveal
        trigger="view"
        lines={[
          "Rises the first time",
          <>
            it's <em>scrolled</em> into view.
          </>,
        ]}
      />
    </p>
  );
}
