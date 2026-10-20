"use client";

import { StarsBackground } from "@nuvui/backgrounds/stars-background";
import { Button } from "@nuvui/react";
import { ArrowRight, Pause, Play } from "lucide-react";
import { useState } from "react";
import "./stars-hero.scss";

export default function StarsHero() {
  // Anything that moves for more than five seconds needs a way to stop it.
  const [paused, setPaused] = useState(false);

  return (
    <section className="stars-hero" aria-labelledby="stars-hero-title">
      {/* Dark in both themes, as a night sky is. Everything inside takes
          the dark theme's colors, with the contrast that theme was checked
          for. */}
      <StarsBackground
        className="stars-hero__sky"
        data-theme="dark"
        scrim="soft"
        paused={paused}
      >
        <div className="stars-hero__inner">
          <a className="stars-hero__news" href="#changelog">
            New: forecasts for every account
            <ArrowRight aria-hidden="true" size={14} />
          </a>
          <h1 className="stars-hero__title" id="stars-hero-title">
            See where the quarter is heading, before it gets there
          </h1>
          <p className="stars-hero__lead">
            Acme reads your pipeline every night and tells you which deals will
            close, which won't, and what to do about the rest.
          </p>
          <div className="stars-hero__actions">
            <Button asChild size="lg">
              <a href="#start">Start free</a>
            </Button>
            <Button asChild size="lg" intent="secondary">
              <a href="#demo">Book a demo</a>
            </Button>
          </div>
        </div>
        <Button
          intent="ghost"
          size="sm"
          className="stars-hero__pause"
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
      </StarsBackground>
    </section>
  );
}
