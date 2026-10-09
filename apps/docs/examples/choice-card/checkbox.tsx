import {
  CheckboxCard,
  ChoiceCardDescription,
  ChoiceCardTitle,
} from "@nuvui/react";

const addOns = [
  {
    name: "sso",
    title: "Single sign-on",
    text: "Sign in through your identity provider.",
    on: true,
  },
  {
    name: "audit",
    title: "Audit log",
    text: "Who changed what, kept for a year.",
    on: false,
  },
  {
    name: "support",
    title: "Priority support",
    text: "An answer within four working hours.",
    on: false,
    disabled: true,
  },
];

export default function Example() {
  return (
    <fieldset
      style={{
        display: "grid",
        gap: 8,
        gridTemplateColumns: "repeat(auto-fit, minmax(min(12rem, 100%), 1fr))",
        inlineSize: "100%",
        margin: 0,
        padding: 0,
        border: 0,
      }}
    >
      <legend style={{ marginBottom: 8, padding: 0 }}>Add-ons</legend>
      {addOns.map((addOn) => (
        <CheckboxCard
          key={addOn.name}
          name={addOn.name}
          defaultChecked={addOn.on}
          disabled={addOn.disabled}
          indicator="end"
        >
          <ChoiceCardTitle>{addOn.title}</ChoiceCardTitle>
          <ChoiceCardDescription>{addOn.text}</ChoiceCardDescription>
        </CheckboxCard>
      ))}
    </fieldset>
  );
}
