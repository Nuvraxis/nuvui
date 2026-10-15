import { Button, TextReveal } from "@nuvui/react";
import { ArrowRight } from "lucide-react";
import "./launch-hero.scss";

export default function LaunchHero() {
  return (
    <section className="launch-hero" aria-labelledby="launch-hero-title">
      <p className="launch-hero__eyebrow">Acme Reports 3.0</p>
      <h1 className="launch-hero__title" id="launch-hero-title">
        {/* Where the lines break is chosen here, so each reads on its own
            as it rises. */}
        <TextReveal
          lines={["Every report your team", "asks for, before they ask"]}
        />
      </h1>
      <p className="launch-hero__lead">
        Reports that build themselves from the data you already have, and land
        in the right inbox on the first of the month.
      </p>
      <div className="launch-hero__actions">
        <Button asChild size="lg">
          <a href="#start">
            Try it free
            <ArrowRight aria-hidden="true" size={16} />
          </a>
        </Button>
        <Button asChild size="lg" intent="secondary">
          <a href="#tour">Take the tour</a>
        </Button>
      </div>
    </section>
  );
}
