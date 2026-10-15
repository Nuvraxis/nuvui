"use client";

import { AnimatedNumber, Button } from "@nuvui/react";
import { useState } from "react";
import { Playground, SelectControl } from "./controls";

const animations = ["roll", "pop"] as const;
const formats = ["decimal", "percent", "compact"] as const;
// Any ISO 4217 code works. These are a few, written differently: a sign
// before the number or after it, and a currency with no cents.
const currencies = ["none", "EUR", "GBP", "USD", "JPY", "INR", "CHF"] as const;
const locales = ["en-US", "en-GB", "de-DE", "fr-FR", "ar-EG", "hi-IN"] as const;

// Each step is a different size, so a press moves a different number of
// digits.
const steps = [7, 160, 2_315, -48, 91_004, -1_200];

export function AnimatedNumberPlayground() {
  const [animation, setAnimation] =
    useState<(typeof animations)[number]>("roll");
  const [format, setFormat] = useState<(typeof formats)[number]>("decimal");
  const [currency, setCurrency] = useState<(typeof currencies)[number]>("EUR");
  const [locale, setLocale] = useState<(typeof locales)[number]>("en-US");
  const [value, setValue] = useState(48_250);
  const [step, setStep] = useState(0);

  // A percentage is a ratio, so it gets a small one.
  const shown = format === "percent" ? value / 100_000 : value;
  const money = format !== "percent" && currency !== "none";
  const props = {
    ...(money ? { currency } : {}),
    ...(format === "percent"
      ? { format: "percent" as const, maximumFractionDigits: 1 }
      : {}),
    ...(format === "compact" ? { compact: true } : {}),
  };
  const attributes = [
    `value={${shown}}`,
    animation === "roll" ? "" : `animation="${animation}"`,
    locale === "en-US" ? "" : `locale="${locale}"`,
    money ? `currency="${currency}"` : "",
    format === "percent" ? `format="percent" maximumFractionDigits={1}` : "",
    format === "compact" ? "compact" : "",
  ].filter(Boolean);

  return (
    <Playground
      code={`<AnimatedNumber ${attributes.join(" ")} />`}
      controls={
        <>
          <SelectControl
            label="animation"
            value={animation}
            options={animations}
            onChange={setAnimation}
          />
          <SelectControl
            label="format"
            value={format}
            options={formats}
            onChange={setFormat}
          />
          <SelectControl
            label="currency"
            value={currency}
            options={currencies}
            onChange={setCurrency}
          />
          <SelectControl
            label="locale"
            value={locale}
            options={locales}
            onChange={setLocale}
          />
        </>
      }
    >
      <div style={{ display: "grid", gap: 16, justifyItems: "center" }}>
        <span style={{ fontSize: "var(--text-4xl)", fontWeight: 600 }}>
          <AnimatedNumber
            value={shown}
            animation={animation}
            locale={locale}
            {...props}
          />
        </span>
        <Button
          intent="secondary"
          onClick={() => {
            setValue((now) => now + (steps[step] ?? 0));
            setStep((now) => (now + 1) % steps.length);
          }}
        >
          Change the number
        </Button>
      </div>
    </Playground>
  );
}
