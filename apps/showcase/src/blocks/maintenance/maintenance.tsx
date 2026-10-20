"use client";

import { TopographyBackground } from "@nuvui/backgrounds/topography-background";
import { Button } from "@nuvui/react";
import { Pause, Play } from "lucide-react";
import { useState } from "react";
import "./maintenance.scss";

// When the work started and when it's meant to end. Put your own times
// here, from wherever you plan the work. They're shown in UTC, which reads
// the same on the server and in every browser.
const from = new Date("2026-10-24T22:00:00Z");
const until = new Date("2026-10-25T02:00:00Z");
const time = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export default function Maintenance() {
  // Anything that moves for more than five seconds needs a way to stop it.
  const [paused, setPaused] = useState(false);

  return (
    <main className="maintenance">
      <TopographyBackground
        className="maintenance__stage"
        scrim="soft"
        paused={paused}
      >
        <div className="maintenance__inner">
          <h1 className="maintenance__title">We're making some changes</h1>
          <p className="maintenance__text">
            Acme is down for planned work from{" "}
            <time dateTime={from.toISOString()}>{time.format(from)}</time> until{" "}
            <time dateTime={until.toISOString()}>{time.format(until)}</time>{" "}
            UTC. Nothing you've saved is affected.
          </p>
          <div className="maintenance__actions">
            <Button asChild>
              <a href="#status">See the status page</a>
            </Button>
            <Button asChild intent="secondary">
              <a href="#contact">Contact support</a>
            </Button>
          </div>
        </div>
        <Button
          intent="ghost"
          size="sm"
          className="maintenance__pause"
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
      </TopographyBackground>
    </main>
  );
}
