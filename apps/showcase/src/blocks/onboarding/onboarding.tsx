"use client";

import {
  Button,
  CheckboxCard,
  ChoiceCardDescription,
  ChoiceCardTitle,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  FormattedNumber,
  NumberField,
  RadioCard,
  RadioGroup,
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperTitle,
} from "@nuvui/react";
import { useEffect, useRef, useState } from "react";
import "./onboarding.scss";

// Made-up plans and prices. `price` is for one seat for a month.
const plans = [
  { id: "starter", name: "Starter", about: "For trying it out.", price: 0 },
  { id: "team", name: "Team", about: "For one team's work.", price: 12 },
  {
    id: "business",
    name: "Business",
    about: "For a whole company.",
    price: 24,
  },
];

// `price` is for the workspace for a month, however many seats it has.
const extras = [
  {
    id: "audit",
    name: "Audit log",
    about: "Who changed what, kept for a year.",
    price: 20,
  },
  {
    id: "sso",
    name: "Single sign-on",
    about: "Sign in with your company's account.",
    price: 50,
  },
];

const steps = ["Plan", "Team", "Review"];

const dollars = { currency: "USD", maximumFractionDigits: 0 } as const;

export default function Onboarding() {
  // One more than the last step means the workspace is made.
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState("team");
  const [seats, setSeats] = useState<number | null>(5);
  const [chosen, setChosen] = useState<string[]>(["audit"]);

  // A screen reader isn't told that the step changed, so focus goes to
  // the new step's heading. Not on the first one: nothing has changed yet.
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: the step is what it waits for
  useEffect(() => {
    if (moved.current) heading.current?.focus();
    moved.current = true;
  }, [step]);

  const price = plans.find((item) => item.id === plan)?.price ?? 0;
  const added = extras.filter((extra) => chosen.includes(extra.id));
  const total =
    price * (seats ?? 1) + added.reduce((sum, extra) => sum + extra.price, 0);

  return (
    <main className="onboarding">
      <header className="onboarding__head">
        <h1 className="onboarding__title">Set up your workspace</h1>
        <p className="onboarding__text">Three steps. Nothing is charged yet.</p>
      </header>

      <Stepper value={step} aria-label="Setting up">
        {steps.map((title, index) => (
          <StepperItem key={title} step={index + 1}>
            <StepperIndicator />
            <StepperContent>
              <StepperTitle>{title}</StepperTitle>
            </StepperContent>
          </StepperItem>
        ))}
      </Stepper>

      {/* Create the workspace from here, with the plan, the seats and the
          extras that were chosen. */}
      <form
        className="onboarding__form"
        onSubmit={(event) => {
          event.preventDefault();
          setStep(step + 1);
        }}
      >
        {step === 1 ? (
          <>
            <h2
              ref={heading}
              tabIndex={-1}
              id="onboarding-plan"
              className="onboarding__step"
            >
              Choose a plan
            </h2>
            <RadioGroup
              aria-labelledby="onboarding-plan"
              value={plan}
              onValueChange={setPlan}
              className="onboarding__choices"
            >
              {plans.map((item) => (
                <RadioCard key={item.id} value={item.id}>
                  <ChoiceCardTitle>{item.name}</ChoiceCardTitle>
                  <ChoiceCardDescription>
                    {item.about}{" "}
                    {item.price === 0 ? (
                      "Free."
                    ) : (
                      <>
                        <FormattedNumber value={item.price} {...dollars} /> a
                        seat each month.
                      </>
                    )}
                  </ChoiceCardDescription>
                </RadioCard>
              ))}
            </RadioGroup>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2 ref={heading} tabIndex={-1} className="onboarding__step">
              Your team
            </h2>
            <Field className="onboarding__seats">
              <FieldLabel>Seats</FieldLabel>
              <FieldControl>
                <NumberField
                  min={1}
                  max={500}
                  value={seats}
                  // An emptied field goes back to one seat.
                  onValueChange={(value) => setSeats(value ?? 1)}
                  format={{ maximumFractionDigits: 0 }}
                />
              </FieldControl>
              <FieldDescription>
                One for each person. You can add more later.
              </FieldDescription>
            </Field>
            <fieldset className="onboarding__extras">
              <legend className="onboarding__legend">Extras</legend>
              <div className="onboarding__choices">
                {extras.map((extra) => (
                  <CheckboxCard
                    key={extra.id}
                    checked={chosen.includes(extra.id)}
                    onCheckedChange={(checked) =>
                      setChosen((current) =>
                        checked === true
                          ? [...current, extra.id]
                          : current.filter((id) => id !== extra.id),
                      )
                    }
                  >
                    <ChoiceCardTitle>{extra.name}</ChoiceCardTitle>
                    <ChoiceCardDescription>
                      {extra.about}{" "}
                      <FormattedNumber value={extra.price} {...dollars} /> each
                      month.
                    </ChoiceCardDescription>
                  </CheckboxCard>
                ))}
              </div>
            </fieldset>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h2 ref={heading} tabIndex={-1} className="onboarding__step">
              Check it over
            </h2>
            <dl className="onboarding__summary">
              <div className="onboarding__row">
                <dt className="onboarding__term">Plan</dt>
                <dd className="onboarding__value">
                  {plans.find((item) => item.id === plan)?.name}
                </dd>
              </div>
              <div className="onboarding__row">
                <dt className="onboarding__term">Seats</dt>
                <dd className="onboarding__value">
                  <FormattedNumber value={seats ?? 1} />
                </dd>
              </div>
              <div className="onboarding__row">
                <dt className="onboarding__term">Extras</dt>
                <dd className="onboarding__value">
                  {added.length > 0
                    ? added.map((extra) => extra.name).join(", ")
                    : "None"}
                </dd>
              </div>
              <div className="onboarding__row onboarding__row--total">
                <dt className="onboarding__term">Each month</dt>
                <dd className="onboarding__value">
                  <FormattedNumber value={total} {...dollars} />
                </dd>
              </div>
            </dl>
          </>
        ) : null}

        {step > steps.length ? (
          <>
            <h2 ref={heading} tabIndex={-1} className="onboarding__step">
              Your workspace is ready
            </h2>
            <p className="onboarding__text">
              We sent a link to invite the rest of your team.
            </p>
          </>
        ) : null}

        <div className="onboarding__actions">
          {step > steps.length ? (
            <Button type="button" intent="secondary" onClick={() => setStep(1)}>
              Start again
            </Button>
          ) : (
            <>
              <Button
                type="button"
                intent="secondary"
                disabled={step === 1}
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>
              <Button type="submit">
                {step === steps.length ? "Create workspace" : "Continue"}
              </Button>
            </>
          )}
        </div>
      </form>
    </main>
  );
}
