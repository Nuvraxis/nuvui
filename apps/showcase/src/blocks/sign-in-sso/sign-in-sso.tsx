"use client";

import {
  Button,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  Input,
  Separator,
} from "@nuvui/react";
import { Building2, Hexagon, KeyRound } from "lucide-react";
import type { FormEvent } from "react";
import "./sign-in-sso.scss";

export default function SignInSso() {
  // Look the email's domain up from here, and send the person on to the
  // sign-in page their company uses.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <main className="sign-in-sso">
      <div className="sign-in-sso__card">
        <p className="sign-in-sso__brand">
          <Hexagon aria-hidden="true" size={24} />
          Acme
        </p>
        <div className="sign-in-sso__intro">
          <h1 className="sign-in-sso__title">Sign in with your company</h1>
          <p className="sign-in-sso__text">
            Enter your work email and we'll take you to your company's sign-in
            page.
          </p>
        </div>
        <form className="sign-in-sso__form" onSubmit={submit}>
          <Field required>
            <FieldLabel>Work email</FieldLabel>
            <FieldControl>
              <Input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@company.com"
              />
            </FieldControl>
            <FieldDescription>
              Use the address your company gave you.
            </FieldDescription>
          </Field>
          <Button type="submit" size="lg" className="sign-in-sso__wide">
            <Building2 aria-hidden="true" size={18} />
            Continue with single sign-on
          </Button>
        </form>
        <div className="sign-in-sso__or">
          <Separator decorative />
          <span>or</span>
          <Separator decorative />
        </div>
        <Button
          asChild
          intent="secondary"
          size="lg"
          className="sign-in-sso__wide"
        >
          <a href="#password">
            <KeyRound aria-hidden="true" size={18} />
            Sign in with a password
          </a>
        </Button>
        <p className="sign-in-sso__small">
          Single sign-on is set up by your company's administrator.{" "}
          <a className="sign-in-sso__link" href="#help">
            Get help signing in
          </a>
        </p>
      </div>
    </main>
  );
}
