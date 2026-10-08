import { Button } from "@nuvui/react";
import { ArrowRight, Check } from "lucide-react";
import "./hero.scss";

const points = [
  "Free for the first 14 days",
  "No card to start",
  "Your data exported whenever you ask",
];

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__inner">
        <a className="hero__news" href="#changelog">
          New: reports sent on a schedule
          <ArrowRight aria-hidden="true" size={14} />
        </a>
        <h1 className="hero__title" id="hero-title">
          Invoices out the door in minutes, not days
        </h1>
        <p className="hero__lead">
          Acme sends your invoices, tracks which have been paid, and chases the
          ones that haven't, so the month closes on time.
        </p>
        <div className="hero__actions">
          <Button asChild size="lg">
            <a href="#start">Start free</a>
          </Button>
          <Button asChild size="lg" intent="secondary">
            <a href="#demo">Book a demo</a>
          </Button>
        </div>
        <ul className="hero__points">
          {points.map((point) => (
            <li key={point} className="hero__point">
              <Check aria-hidden="true" size={16} />
              {point}
            </li>
          ))}
        </ul>
      </div>
      {/* Stands in for a picture of the product. It's drawn in CSS from the
          theme's colors, so it follows the theme, and it's hidden from
          screen readers because it says nothing. */}
      <div className="hero__window" aria-hidden="true">
        <div className="hero__chrome">
          <span className="hero__dot" />
          <span className="hero__dot" />
          <span className="hero__dot" />
        </div>
        <div className="hero__screen">
          <div className="hero__side">
            <span className="hero__bar hero__bar--mid" />
            <span className="hero__bar hero__bar--short" />
            <span className="hero__bar hero__bar--mid" />
          </div>
          <div className="hero__rows">
            <div className="hero__tiles">
              <span className="hero__tile" />
              <span className="hero__tile" />
              <span className="hero__tile hero__tile--strong" />
            </div>
            <span className="hero__bar hero__bar--long" />
            <span className="hero__bar hero__bar--short" />
            <span className="hero__bar hero__bar--mid" />
            <span className="hero__bar hero__bar--long" />
            <span className="hero__bar hero__bar--mid" />
          </div>
        </div>
      </div>
    </section>
  );
}
