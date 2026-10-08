"use client";

import {
  Button,
  Checkbox,
  Field,
  FieldControl,
  FieldLabel,
  Input,
  PasswordInput,
} from "@nuvui/react";
import { Hexagon } from "lucide-react";
import type { FormEvent } from "react";
import "./sign-in.scss";

export default function SignIn() {
  // Send the form to your own sign-in from here.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <main className="sign-in">
      {/* Dark in both themes. Everything inside takes the dark theme's
          colors, with the contrast that theme was checked for. */}
      <aside className="sign-in__aside" data-theme="dark">
        <p className="sign-in__brand">
          <Hexagon aria-hidden="true" size={24} />
          Acme
        </p>
        <p className="sign-in__statement">
          Every order, invoice and customer, in one place your whole team can
          work from.
        </p>
        <p className="sign-in__small">Acme, Inc.</p>
      </aside>
      <div className="sign-in__panel">
        <div className="sign-in__box">
          <p className="sign-in__brand sign-in__brand--top">
            <Hexagon aria-hidden="true" size={24} />
            Acme
          </p>
          <div className="sign-in__intro">
            <h1 className="sign-in__title">Sign in</h1>
            <p className="sign-in__text">
              Welcome back. Enter your details to carry on.
            </p>
          </div>
          <form className="sign-in__form" onSubmit={submit}>
            <Field required>
              <FieldLabel>Email</FieldLabel>
              <FieldControl>
                <Input type="email" name="email" autoComplete="email" />
              </FieldControl>
            </Field>
            <Field required>
              <div className="sign-in__row">
                <FieldLabel>Password</FieldLabel>
                <a className="sign-in__link" href="#forgot">
                  Forgot your password?
                </a>
              </div>
              <FieldControl>
                <PasswordInput
                  name="password"
                  autoComplete="current-password"
                />
              </FieldControl>
            </Field>
            <div className="sign-in__check">
              <Checkbox id="sign-in-remember" name="remember" />
              <label htmlFor="sign-in-remember">Keep me signed in</label>
            </div>
            <Button type="submit" size="lg" className="sign-in__submit">
              Sign in
            </Button>
          </form>
          <p className="sign-in__text">
            New to Acme?{" "}
            <a className="sign-in__link" href="#sign-up">
              Create an account
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
