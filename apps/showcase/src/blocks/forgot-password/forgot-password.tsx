"use client";

import { Button, Field, FieldControl, FieldLabel, Input } from "@nuvui/react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import "./forgot-password.scss";

export default function ForgotPassword() {
  const [sentTo, setSentTo] = useState("");

  // Ask your server for the email from here. The message is the same
  // whether or not the address has an account, so the form can't be used
  // to find out who has one.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSentTo(String(new FormData(event.currentTarget).get("email")));
  };

  return (
    <main className="forgot-password">
      <div className="forgot-password__card">
        {sentTo ? (
          // Read out when it appears, to someone who can't see the form go.
          <div className="forgot-password__intro" role="status">
            <span className="forgot-password__icon">
              <MailCheck aria-hidden="true" size={22} />
            </span>
            <h1 className="forgot-password__title">Check your email</h1>
            <p className="forgot-password__text">
              If <strong>{sentTo}</strong> has an account, a link to choose a
              new password is on its way. It works for one hour.
            </p>
            <Button
              intent="secondary"
              size="lg"
              className="forgot-password__wide"
              onClick={() => setSentTo("")}
            >
              Use another address
            </Button>
          </div>
        ) : (
          <>
            <div className="forgot-password__intro">
              <h1 className="forgot-password__title">Forgot your password?</h1>
              <p className="forgot-password__text">
                Enter the email you signed up with and we'll send a link to
                choose a new one.
              </p>
            </div>
            <form className="forgot-password__form" onSubmit={submit}>
              <Field required>
                <FieldLabel>Email</FieldLabel>
                <FieldControl>
                  <Input type="email" name="email" autoComplete="email" />
                </FieldControl>
              </Field>
              <Button type="submit" size="lg" className="forgot-password__wide">
                Send the link
              </Button>
            </form>
          </>
        )}
        <a className="forgot-password__back" href="#sign-in">
          <ArrowLeft aria-hidden="true" size={16} />
          Back to sign in
        </a>
      </div>
    </main>
  );
}
