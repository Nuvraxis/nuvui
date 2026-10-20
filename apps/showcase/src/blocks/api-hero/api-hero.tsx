"use client";

import { GlyphBackground } from "@nuvui/backgrounds/glyph-background";
import { Button } from "@nuvui/react";
import { Pause, Play } from "lucide-react";
import { useState } from "react";
import "./api-hero.scss";

const request = `curl https://api.example.com/v1/invoices \\
  -H "Authorization: Bearer $ACME_KEY" \\
  -d customer=cus_42 \\
  -d amount=12000 \\
  -d currency=eur`;

export default function ApiHero() {
  // Anything that moves for more than five seconds needs a way to stop it.
  const [paused, setPaused] = useState(false);

  return (
    <section className="api-hero" aria-labelledby="api-hero-title">
      <GlyphBackground className="api-hero__stage" scrim="soft" paused={paused}>
        <div className="api-hero__inner">
          <div className="api-hero__words">
            <h1 className="api-hero__title" id="api-hero-title">
              An invoice is one request away
            </h1>
            <p className="api-hero__lead">
              Create, send and settle invoices from your own code, with webhooks
              for every change and a log of every call.
            </p>
            <div className="api-hero__actions">
              <Button asChild size="lg">
                <a href="#keys">Get an API key</a>
              </Button>
              <Button asChild size="lg" intent="secondary">
                <a href="#reference">Read the reference</a>
              </Button>
            </div>
          </div>
          <figure className="api-hero__code">
            <figcaption className="api-hero__caption">
              Create an invoice
            </figcaption>
            <pre className="api-hero__pre">
              <code>{request}</code>
            </pre>
          </figure>
        </div>
        <Button
          intent="ghost"
          size="sm"
          className="api-hero__pause"
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
      </GlyphBackground>
    </section>
  );
}
