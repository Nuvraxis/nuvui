import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperTitle,
} from "@nuvui/react";

const steps = ["Draft", "In review", "Approved", "Published"];

export default function Example() {
  return (
    <Stepper
      value={2}
      variant="dot"
      aria-label="Where the article is"
      style={{ inlineSize: "100%" }}
    >
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
