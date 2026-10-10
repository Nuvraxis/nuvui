"use client";

import {
  Button,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  Progress,
  Rating,
  Textarea,
} from "@nuvui/react";
import { type FormEvent, useState } from "react";
import "./reviews.scss";

// Made-up reviews of a made-up product. How many gave each number of
// stars, from five down to one.
const counts = [79, 31, 11, 4, 3];
const total = counts.reduce((sum, count) => sum + count, 0);
// To one decimal, which is how it's said and how much of a star is filled.
const average =
  Math.round(
    (counts.reduce((sum, count, index) => sum + count * (5 - index), 0) /
      total) *
      10,
  ) / 10;

const reviews = [
  {
    id: "1",
    who: "Grace Hopper",
    stars: 5,
    at: "2026-10-02",
    when: "2 October",
    text: "We moved our invoicing over in an afternoon. The audit log has already settled two arguments.",
  },
  {
    id: "2",
    who: "Alan Turing",
    stars: 4,
    at: "2026-09-24",
    when: "24 September",
    text: "Does what it says. I'd like the export to remember the columns I chose last time.",
  },
  {
    id: "3",
    who: "Katherine Johnson",
    stars: 5,
    at: "2026-09-11",
    when: "11 September",
    text: "The numbers add up, which is more than I could say for what we had before.",
  },
];

export default function Reviews() {
  const [stars, setStars] = useState(0);
  const [missing, setMissing] = useState(false);
  const [sent, setSent] = useState(false);

  // Send the review from here. A rating is asked for, and words aren't.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMissing(stars === 0);
    setSent(stars > 0);
  };

  return (
    <section className="reviews" aria-labelledby="reviews-title">
      <div className="reviews__summary">
        <h2 id="reviews-title" className="reviews__title">
          What customers say
        </h2>
        <div className="reviews__average">
          <span className="reviews__number" aria-hidden="true">
            {average}
          </span>
          <div>
            <Rating readOnly value={average} />
            <p className="reviews__text">From {total} reviews</p>
          </div>
        </div>
        <ul className="reviews__bars">
          {counts.map((count, index) => {
            const share = Math.round((count / total) * 100);
            const name = `${5 - index} ${index === 4 ? "star" : "stars"}`;
            return (
              <li key={name} className="reviews__bar">
                <span aria-hidden="true">{name}</span>
                <Progress
                  size="sm"
                  value={share}
                  aria-label={name}
                  getValueLabel={() => `${share}% of reviews`}
                />
                <span className="reviews__share" aria-hidden="true">
                  {share}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="reviews__main">
        <ul className="reviews__list">
          {reviews.map((review) => (
            <li key={review.id} className="reviews__item">
              <Rating readOnly size="sm" value={review.stars} />
              <p className="reviews__quote">{review.text}</p>
              <p className="reviews__text">
                {review.who}, <time dateTime={review.at}>{review.when}</time>
              </p>
            </li>
          ))}
        </ul>

        <form className="reviews__form" onSubmit={submit} noValidate>
          <h3 className="reviews__subtitle">Leave a review</h3>
          <div className="reviews__field">
            <span id="reviews-stars" className="reviews__label">
              Your rating
            </span>
            <Rating
              aria-labelledby="reviews-stars"
              aria-describedby={missing ? "reviews-missing" : undefined}
              aria-invalid={missing || undefined}
              value={stars}
              onValueChange={(value) => {
                setStars(value);
                setMissing(false);
                setSent(false);
              }}
            />
            {missing ? (
              <p id="reviews-missing" role="alert" className="reviews__error">
                Choose a number of stars.
              </p>
            ) : null}
          </div>
          <Field>
            <FieldLabel>Your review</FieldLabel>
            <FieldControl>
              <Textarea
                name="review"
                rows={3}
                onChange={() => setSent(false)}
              />
            </FieldControl>
            <FieldDescription>
              It's shown with your name once we've checked it.
            </FieldDescription>
          </Field>
          <div className="reviews__actions">
            <Button type="submit">Send review</Button>
            <p role="status" className="reviews__text">
              {sent ? "Thanks. Your review is waiting to be checked." : ""}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
