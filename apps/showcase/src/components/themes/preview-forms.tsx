"use client";

import { Button } from "@nuvui/react/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@nuvui/react/card";
import { Checkbox } from "@nuvui/react/checkbox";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@nuvui/react/field";
import { Input } from "@nuvui/react/input";
import { InputGroup, InputGroupAddon } from "@nuvui/react/input-group";
import { Label } from "@nuvui/react/label";
import { NativeSelect } from "@nuvui/react/native-select";
import { RadioGroup, RadioGroupItem } from "@nuvui/react/radio-group";
import { Slider } from "@nuvui/react/slider";
import { Switch } from "@nuvui/react/switch";
import { Textarea } from "@nuvui/react/textarea";
import { useId, useState } from "react";

const plans = [
  { value: "starter", label: "Starter" },
  { value: "team", label: "Team" },
  { value: "enterprise", label: "Enterprise" },
];

// Two forms the way an admin screen has them: one to fill in, and one of
// settings. Nothing is sent anywhere. The preview is drawn twice on a wide
// screen, so every id here is made, not written.
export function FormsPreview() {
  const id = useId();
  const [seats, setSeats] = useState([25]);

  return (
    <div className="site-preview__forms">
      <Card>
        <CardHeader>
          <CardTitle asChild>
            <h3>New workspace</h3>
          </CardTitle>
          <CardDescription>
            A place for one team's projects and billing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="site-preview__form"
            noValidate
            onSubmit={(event) => event.preventDefault()}
          >
            <Field required>
              <FieldLabel>Name</FieldLabel>
              <FieldControl>
                <Input defaultValue="Northwind" autoComplete="off" />
              </FieldControl>
            </Field>
            <Field>
              <FieldLabel>Address</FieldLabel>
              <InputGroup>
                <InputGroupAddon>app.example.com/</InputGroupAddon>
                <FieldControl>
                  <Input defaultValue="northwind" autoComplete="off" />
                </FieldControl>
              </InputGroup>
              <FieldDescription>
                Lowercase letters, digits and hyphens.
              </FieldDescription>
            </Field>
            <Field invalid>
              <FieldLabel>Billing email</FieldLabel>
              <FieldControl>
                <Input
                  type="email"
                  defaultValue="finance@"
                  autoComplete="off"
                />
              </FieldControl>
              <FieldError>Enter a whole address, with its domain.</FieldError>
            </Field>
            <Field>
              <FieldLabel>Region</FieldLabel>
              <FieldControl>
                <NativeSelect defaultValue="eu">
                  <option value="eu">Europe</option>
                  <option value="us">North America</option>
                  <option value="ap">Asia Pacific</option>
                </NativeSelect>
              </FieldControl>
            </Field>
            <Field>
              <FieldLabel>What it's for</FieldLabel>
              <FieldControl>
                <Textarea placeholder="A sentence or two" rows={3} />
              </FieldControl>
            </Field>
          </form>
        </CardContent>
        <CardFooter className="site-preview__actions">
          <Button intent="secondary">Cancel</Button>
          <Button>Create workspace</Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle asChild>
            <h3>Plan and notices</h3>
          </CardTitle>
          <CardDescription>What this workspace pays for.</CardDescription>
        </CardHeader>
        <CardContent className="site-preview__form">
          <div className="site-preview__group">
            <Label asChild>
              <span id={`${id}-plan`}>Plan</span>
            </Label>
            <RadioGroup aria-labelledby={`${id}-plan`} defaultValue="team">
              {plans.map((plan) => (
                <div key={plan.value} className="site-preview__choice">
                  <RadioGroupItem
                    value={plan.value}
                    id={`${id}-${plan.value}`}
                  />
                  <label htmlFor={`${id}-${plan.value}`}>{plan.label}</label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="site-preview__group">
            <div className="site-preview__row">
              <Label asChild>
                <span id={`${id}-seats`}>Seats</span>
              </Label>
              <output>{seats[0]}</output>
            </div>
            <Slider
              aria-labelledby={`${id}-seats`}
              min={5}
              max={100}
              step={5}
              value={seats}
              onValueChange={setSeats}
            />
          </div>
          <div className="site-preview__choice">
            <Switch id={`${id}-invoices`} defaultChecked />
            <label htmlFor={`${id}-invoices`}>Email each invoice</label>
          </div>
          <div className="site-preview__choice">
            <Switch id={`${id}-usage`} />
            <label htmlFor={`${id}-usage`}>Warn at 80% of the seats</label>
          </div>
          <div className="site-preview__choice">
            <Checkbox id={`${id}-terms`} defaultChecked />
            <label htmlFor={`${id}-terms`}>Renew automatically each year</label>
          </div>
        </CardContent>
        <CardFooter className="site-preview__actions">
          <Button intent="danger">Cancel the plan</Button>
          <Button>Save</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
