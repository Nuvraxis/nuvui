"use client";

import { GridBackground } from "@nuvui/backgrounds/grid-background";
import {
  Button,
  Field,
  FieldControl,
  FieldLabel,
  Input,
  PasswordInput,
} from "@nuvui/react";
import { Hexagon } from "lucide-react";
import type { FormEvent } from "react";
import "./sign-in-grid.scss";

export default function SignInGrid() {
  // Send the form to your own sign-in from here.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <main className="sign-in-grid">
      <GridBackground className="sign-in-grid__stage">
        <div className="sign-in-grid__card">
          <p className="sign-in-grid__brand">
            <Hexagon aria-hidden="true" size={24} />
            Acme
          </p>
          <div className="sign-in-grid__intro">
            <h1 className="sign-in-grid__title">Sign in</h1>
            <p className="sign-in-grid__text">
              Welcome back. Enter your details to carry on.
            </p>
          </div>
          <form className="sign-in-grid__form" onSubmit={submit}>
            <Field required>
              <FieldLabel>Email</FieldLabel>
              <FieldControl>
                <Input type="email" name="email" autoComplete="email" />
              </FieldControl>
            </Field>
            <Field required>
              <FieldLabel>Password</FieldLabel>
              <FieldControl>
                <PasswordInput
                  name="password"
                  autoComplete="current-password"
                />
              </FieldControl>
            </Field>
            <Button type="submit" size="lg">
              Sign in
            </Button>
          </form>
          <p className="sign-in-grid__text">
            <a className="sign-in-grid__link" href="#forgot">
              Forgot your password?
            </a>
          </p>
        </div>
      </GridBackground>
    </main>
  );
}
