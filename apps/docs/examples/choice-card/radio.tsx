import {
  ChoiceCardDescription,
  ChoiceCardTitle,
  RadioCard,
  RadioGroup,
} from "@nuvui/react";

const plans = [
  { value: "starter", name: "Starter", text: "Up to 5 people. $0 a month." },
  { value: "team", name: "Team", text: "Up to 50 people. $12 a seat." },
  {
    value: "enterprise",
    name: "Enterprise",
    text: "Any number of people, single sign-on and an audit log.",
  },
];

export default function Example() {
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 420 }}>
      <span
        id="choice-plan-label"
        style={{ display: "block", marginBottom: 8 }}
      >
        Plan
      </span>
      <RadioGroup
        defaultValue="team"
        aria-labelledby="choice-plan-label"
        style={{ display: "grid", gap: 8 }}
      >
        {plans.map((plan) => (
          <RadioCard key={plan.value} value={plan.value}>
            <ChoiceCardTitle>{plan.name}</ChoiceCardTitle>
            <ChoiceCardDescription>{plan.text}</ChoiceCardDescription>
          </RadioCard>
        ))}
      </RadioGroup>
    </div>
  );
}
