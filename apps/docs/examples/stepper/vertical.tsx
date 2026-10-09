"use client";

import {
  Button,
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperTitle,
} from "@nuvui/react";
import { useState } from "react";

const steps = [
  { title: "Order placed", text: "We have your order and your payment." },
  { title: "Packed", text: "Two parcels, leaving from Rotterdam." },
  { title: "On its way", text: "With the carrier, due on Thursday." },
  { title: "Delivered", text: "Signed for at the front desk." },
];

export default function Example() {
  const [current, setCurrent] = useState(2);

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        inlineSize: "100%",
        maxInlineSize: 360,
      }}
    >
      <Stepper value={current} orientation="vertical" aria-label="Order 1042">
        {steps.map((step, index) => (
          <StepperItem key={step.title} step={index + 1}>
            <StepperIndicator />
            <StepperContent>
              <StepperTitle>{step.title}</StepperTitle>
              <StepperDescription>{step.text}</StepperDescription>
            </StepperContent>
          </StepperItem>
        ))}
      </Stepper>
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          intent="secondary"
          disabled={current === 1}
          onClick={() => setCurrent(current - 1)}
        >
          Back
        </Button>
        <Button
          disabled={current > steps.length}
          onClick={() => setCurrent(current + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
