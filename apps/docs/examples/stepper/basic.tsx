import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperTitle,
} from "@nuvui/react";

const steps = ["Account", "Team", "Billing", "Review"];

export default function Example() {
  return (
    <Stepper value={3} aria-label="Setting up" style={{ inlineSize: "100%" }}>
      {steps.map((title, index) => (
        <StepperItem key={title} step={index + 1}>
          <StepperIndicator />
          <StepperContent>
            <StepperTitle>{title}</StepperTitle>
          </StepperContent>
        </StepperItem>
      ))}
    </Stepper>
  );
}
