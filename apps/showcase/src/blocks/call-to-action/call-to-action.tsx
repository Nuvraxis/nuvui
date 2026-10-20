"use client";

import { GradientBackground } from "@nuvui/backgrounds/gradient-background";
import { Button } from "@nuvui/react";
import { Pause, Play } from "lucide-react";
import { useState } from "react";
import "./call-to-action.scss";

export default function CallToAction() {
  // Anything that moves for more than five seconds needs a way to stop it.
  const [paused, setPaused] = useState(false);

  return (
    <section className="call-to-action" aria-labelledby="call-to-action-title">
      <GradientBackground
        className="call-to-action__panel"
        scrim="soft"
        paused={paused}
      >
        <h2 className="call-to-action__title" id="call-to-action-title">
          Ready to close the month on time?
        </h2>
        <p className="call-to-action__text">
          Start with your own invoices. It takes ten minutes, and the first
          fourteen days are free.
        </p>
        <div className="call-to-action__actions">
          <Button asChild size="lg">
            <a href="#start">Start free</a>
          </Button>
          <Button asChild size="lg" intent="secondary">
            <a href="#sales">Talk to sales</a>
          </Button>
        </div>
        <Button
          intent="ghost"
          size="sm"
          className="call-to-action__pause"
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
      </GradientBackground>
    </section>
  );
}
