"use client";

import {
  Button,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  OtpField,
} from "@nuvui/react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import "./verify-code.scss";

export default function VerifyCode() {
  const [said, setSaid] = useState("");

  // Check the code on your server from here.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaid("Checking the code.");
  };

  return (
    <main className="verify-code">
      <div className="verify-code__card">
        <div className="verify-code__intro">
          <span className="verify-code__icon">
            <ShieldCheck aria-hidden="true" size={22} />
          </span>
          <h1 className="verify-code__title">Enter the code</h1>
          <p className="verify-code__text">
            We sent six digits to <strong>ada@example.com</strong>. The code
            works for ten minutes.
          </p>
        </div>
        <form className="verify-code__form" onSubmit={submit}>
          <Field required>
            {/* A set of boxes isn't something a <label> can point at. */}
            <FieldLabel asChild>
              <span>Verification code</span>
            </FieldLabel>
            <FieldControl>
              {/* The form is sent when the last digit is typed. The button
                  is still there for anyone who would sooner press it. */}
              <OtpField
                name="code"
                groupSize={3}
                autoComplete="one-time-code"
                autoSubmit
              />
            </FieldControl>
            <FieldDescription>
              You can paste the whole code into any box.
            </FieldDescription>
          </Field>
          <Button type="submit" size="lg" className="verify-code__wide">
            Verify
          </Button>
        </form>
        <div className="verify-code__resend">
          <p className="verify-code__text">
            Nothing arrived?{" "}
            <button
              type="button"
              className="verify-code__link"
              onClick={() => setSaid("We sent a new code.")}
            >
              Send a new code
            </button>
          </p>
          {/* Said to a screen reader as well as shown. */}
          <p className="verify-code__said" role="status">
            {said}
          </p>
        </div>
        <a className="verify-code__back" href="#sign-in">
          <ArrowLeft aria-hidden="true" size={16} />
          Back to sign in
        </a>
      </div>
    </main>
  );
}
