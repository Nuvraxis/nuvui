"use client";

import { Badge, Button, HoloCard, VisuallyHidden } from "@nuvui/react";
import { useId, useState } from "react";
import "./member-card.scss";

// Made up, and stands in for the member your server knows.
const member = {
  name: "Sajan",
  number: "4821 0093 5567",
  tier: "Gold",
  since: "March 2023",
  points: "12,480",
};

const perks = [
  "Free delivery on every order",
  "A day's head start on each sale",
  "Returns for 60 days where others have 30",
];

export default function MemberCard() {
  const id = useId();
  const [shown, setShown] = useState(false);

  // All but the last four digits, until it's asked for.
  const number = shown
    ? member.number
    : member.number.replace(/\d(?=.*\d{4})/g, "•");

  return (
    <main className="member-card">
      <header className="member-card__head">
        <h1 className="member-card__title">Membership</h1>
        <p className="member-card__text">
          Your card, and what it gets you. Show it at the till or give the
          number when you order.
        </p>
      </header>
      <div className="member-card__columns">
        <div className="member-card__pass">
          <HoloCard className="member-card__card">
            <div className="member-card__face">
              <div className="member-card__top">
                <span className="member-card__brand">Northwind Rewards</span>
                <span className="member-card__tier">{member.tier}</span>
              </div>
              <div className="member-card__bottom">
                <span className="member-card__name">{member.name}</span>
                <span className="member-card__number" aria-live="polite">
                  <VisuallyHidden>Member number </VisuallyHidden>
                  {number}
                </span>
              </div>
            </div>
          </HoloCard>
          <Button
            type="button"
            intent="secondary"
            aria-pressed={shown}
            onClick={() => setShown((now) => !now)}
          >
            Show the number
          </Button>
        </div>
        <section className="member-card__details" aria-labelledby={id}>
          <h2 className="member-card__heading" id={id}>
            {member.tier} member <Badge intent="success">Active</Badge>
          </h2>
          <dl className="member-card__facts">
            <div className="member-card__fact">
              <dt className="member-card__term">Member since</dt>
              <dd className="member-card__value">{member.since}</dd>
            </div>
            <div className="member-card__fact">
              <dt className="member-card__term">Points</dt>
              <dd className="member-card__value">{member.points}</dd>
            </div>
          </dl>
          <ul className="member-card__perks">
            {perks.map((perk) => (
              <li key={perk}>{perk}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
