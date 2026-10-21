"use client";

import { FireworksBackground } from "@nuvui/backgrounds/fireworks-background";
import { Button } from "@nuvui/react";
import { Check, Copy, Pause, Play } from "lucide-react";
import { useState } from "react";
import "./launch-complete.scss";

const done = [
  "Your products are imported",
  "Payments are switched on",
  "The domain points to your store",
];

const address = "https://shop.example.com";

export default function LaunchComplete() {
  // Anything that moves for more than five seconds needs a way to stop it.
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="launch-complete">
      <FireworksBackground
        className="launch-complete__stage"
        scrim="soft"
        paused={paused}
      >
        <div className="launch-complete__card">
          <h1 className="launch-complete__title">Your store is live</h1>
          <p className="launch-complete__text">
            Everything's in place. Share the address, and the first orders will
            show on your dashboard.
          </p>
          <ul className="launch-complete__list">
            {done.map((item) => (
              <li key={item} className="launch-complete__item">
                <Check aria-hidden="true" size={16} />
                {item}
              </li>
            ))}
          </ul>
          <div className="launch-complete__address">
            <code className="launch-complete__url">{address}</code>
            <Button intent="secondary" size="sm" onClick={copy}>
              <Copy aria-hidden="true" size={16} />
              Copy the address
            </Button>
          </div>
          <p className="launch-complete__status" role="status">
            {copied ? "Copied" : ""}
          </p>
          <Button asChild size="lg">
            <a href="#dashboard">Go to the dashboard</a>
          </Button>
        </div>
        <Button
          intent="ghost"
          size="sm"
          className="launch-complete__pause"
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
      </FireworksBackground>
    </main>
  );
}
