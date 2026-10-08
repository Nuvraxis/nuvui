"use client";

import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ToggleGroup,
  ToggleGroupItem,
} from "@nuvui/react";
import { Check } from "lucide-react";
import { useState } from "react";
import "./pricing.scss";

// Made-up plans and prices, in dollars for each person each month.
const plans = [
  {
    id: "starter",
    name: "Starter",
    about: "For one person sending a few invoices a month.",
    month: 0,
    year: 0,
    action: "Start free",
    points: ["20 invoices a month", "One person", "Email reminders"],
  },
  {
    id: "team",
    name: "Team",
    about: "For a team that sends invoices every day.",
    month: 12,
    year: 10,
    action: "Start a free trial",
    popular: true,
    points: [
      "Invoices without a limit",
      "Roles for everyone",
      "Reports by month",
      "Reminders on your schedule",
    ],
  },
  {
    id: "business",
    name: "Business",
    about: "For a company with rules about who sees what.",
    month: 29,
    year: 24,
    action: "Talk to sales",
    points: [
      "Everything in Team",
      "Single sign-on",
      "An audit log kept for a year",
      "A reply within four hours",
    ],
  },
];

type Period = "month" | "year";

export default function Pricing() {
  const [period, setPeriod] = useState<Period>("year");

  return (
    <section className="pricing" aria-labelledby="pricing-title">
      <div className="pricing__intro">
        <h2 className="pricing__title" id="pricing-title">
          One price for each person
        </h2>
        <p className="pricing__lead">
          Every plan can be tried for 14 days. Pay by the year and it comes to
          two months free.
        </p>
        <ToggleGroup
          type="single"
          aria-label="Pay by"
          value={period}
          onValueChange={(value) => value && setPeriod(value as Period)}
        >
          <ToggleGroupItem value="month">Monthly</ToggleGroupItem>
          <ToggleGroupItem value="year">Yearly</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <ul className="pricing__list">
        {plans.map((plan) => (
          <li key={plan.id}>
            <Card
              className={
                plan.popular
                  ? "pricing__card pricing__card--popular"
                  : "pricing__card"
              }
            >
              <CardHeader>
                <CardTitle asChild>
                  <h3>{plan.name}</h3>
                </CardTitle>
                <CardDescription>{plan.about}</CardDescription>
                {plan.popular ? (
                  <CardAction>
                    <Badge intent="primary">Most chosen</Badge>
                  </CardAction>
                ) : null}
              </CardHeader>
              <CardContent className="pricing__body">
                <p className="pricing__price">
                  <span className="pricing__amount">${plan[period]}</span>{" "}
                  {plan.month === 0
                    ? "for good"
                    : period === "year"
                      ? "a person a month, paid by the year"
                      : "a person a month"}
                </p>
                <ul className="pricing__points">
                  {plan.points.map((point) => (
                    <li key={point} className="pricing__point">
                      <Check
                        aria-hidden="true"
                        size={16}
                        className="pricing__check"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  intent={plan.popular ? "primary" : "secondary"}
                  className="pricing__action"
                >
                  <a
                    href={`#${plan.id}`}
                    aria-label={`${plan.action}, ${plan.name}`}
                  >
                    {plan.action}
                  </a>
                </Button>
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
