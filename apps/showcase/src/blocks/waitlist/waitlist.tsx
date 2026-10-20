"use client";

import { HoleBackground } from "@nuvui/backgrounds/hole-background";
import { Button, Field, FieldControl, FieldLabel, Input } from "@nuvui/react";
import { Pause, Play } from "lucide-react";
import { type FormEvent, useState } from "react";
import "./waitlist.scss";

export default function Waitlist() {
  // Anything that moves for more than five seconds needs a way to stop it.
  const [paused, setPaused] = useState(false);
  const [joined, setJoined] = useState("");

  // Send the address to your own list from here.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email");
    setJoined(typeof email === "string" ? email : "");
  };

  return (
    <main className="waitlist">
      {/* Dark in both themes, so the tunnel reads as deep. Everything
          inside takes the dark theme's colors. */}
      <HoleBackground
        className="waitlist__stage"
        data-theme="dark"
        scrim="soft"
        paused={paused}
      >
        <div className="waitlist__inner">
          <p className="waitlist__eyebrow">Coming this winter</p>
          <h1 className="waitlist__title">Forecasts that explain themselves</h1>
          <p className="waitlist__text">
            Every number Acme predicts will come with the reasons behind it.
            Join the list, and be among the first to try it.
          </p>
          {joined ? (
            <p className="waitlist__done" role="status">
              You're on the list. We'll write to {joined} when it's ready.
            </p>
          ) : (
            <form className="waitlist__form" onSubmit={submit}>
              <Field required className="waitlist__field">
                <FieldLabel>Work email</FieldLabel>
                <FieldControl>
                  <Input type="email" name="email" autoComplete="email" />
                </FieldControl>
              </Field>
              <Button type="submit" size="lg">
                Join the list
              </Button>
            </form>
          )}
        </div>
        <Button
          intent="ghost"
          size="sm"
          className="waitlist__pause"
          aria-pressed={paused}
          onClick={() => setPaused((now) => !now)}
        >
          {paused ? (
            <Play aria-hidden="true" size={16} />
          ) : (
            <Pause aria-hidden="true" size={16} />
          )}
          Pause the background
        </Button>
      </HoleBackground>
    </main>
  );
}
