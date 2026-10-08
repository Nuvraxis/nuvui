"use client";

import {
  Button,
  Checkbox,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  Input,
  PasswordInput,
} from "@nuvui/react";
import { Check, Hexagon } from "lucide-react";
import type { FormEvent } from "react";
import "./sign-up.scss";

const points = [
  "Orders, invoices and customers in one place",
  "Roles for everyone on the team",
  "Your data exported whenever you ask",
];

export default function SignUp() {
  // Create the account from here.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <main className="sign-up">
      <div className="sign-up__panel">
        <div className="sign-up__box">
          <p className="sign-up__brand">
            <Hexagon aria-hidden="true" size={24} />
            Acme
          </p>
          <div className="sign-up__intro">
            <h1 className="sign-up__title">Create your account</h1>
            <p className="sign-up__text">
              Already have one?{" "}
              <a className="sign-up__link" href="#sign-in">
                Sign in
              </a>
            </p>
          </div>
          <form className="sign-up__form" onSubmit={submit}>
            <div className="sign-up__pair">
              <Field required>
                <FieldLabel>First name</FieldLabel>
                <FieldControl>
                  <Input name="first-name" autoComplete="given-name" />
                </FieldControl>
              </Field>
              <Field required>
                <FieldLabel>Last name</FieldLabel>
                <FieldControl>
                  <Input name="last-name" autoComplete="family-name" />
                </FieldControl>
              </Field>
            </div>
            <Field required>
              <FieldLabel>Work email</FieldLabel>
              <FieldControl>
                <Input type="email" name="email" autoComplete="email" />
              </FieldControl>
            </Field>
            <Field required>
              <FieldLabel>Password</FieldLabel>
              <FieldControl>
                <PasswordInput
                  name="password"
                  autoComplete="new-password"
                  minLength={12}
                />
              </FieldControl>
              <FieldDescription>At least 12 characters.</FieldDescription>
            </Field>
            <div className="sign-up__check">
              <Checkbox id="sign-up-terms" name="terms" required />
              <label htmlFor="sign-up-terms">
                I agree to the{" "}
                <a className="sign-up__link" href="#terms">
                  terms of service
                </a>{" "}
                and the{" "}
                <a className="sign-up__link" href="#privacy">
                  privacy policy
                </a>
              </label>
            </div>
            <Button type="submit" size="lg" className="sign-up__submit">
              Create account
            </Button>
          </form>
        </div>
      </div>
      {/* Dark in both themes. Everything inside takes the dark theme's
          colors, with the contrast that theme was checked for. */}
      <aside className="sign-up__aside" data-theme="dark">
        <p className="sign-up__statement">
          Set up in an afternoon, not a quarter.
        </p>
        <ul className="sign-up__points">
          {points.map((point) => (
            <li key={point} className="sign-up__point">
              <Check aria-hidden="true" size={18} />
              {point}
            </li>
          ))}
        </ul>
      </aside>
    </main>
  );
}
