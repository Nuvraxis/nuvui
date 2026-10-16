"use client";

import { Badge, Button, Compare } from "@nuvui/react";
import { Armchair } from "lucide-react";
import { useState } from "react";
import "./image-review.scss";

type Decision = "waiting" | "approved" | "changes";

const badges = {
  waiting: { intent: "warning", text: "Waiting for review" },
  approved: { intent: "success", text: "Approved" },
  changes: { intent: "danger", text: "Changes asked for" },
} as const;

// What the retoucher says they did, so it can be checked against the
// pictures, and read by someone who can't see them.
const edits = [
  "Brought the light up and warmed it",
  "Took out the crease in the seat",
  "Cleaned the floor around the legs",
];

// Stand-ins for the two photographs: a tint and an icon. The tints are the
// palette's own and the same in a dark theme, as a photograph would be.
function Photo({ edited }: { edited: boolean }) {
  return (
    <div
      role="img"
      aria-label={
        edited
          ? "The armchair after retouching, in warm light"
          : "The armchair as photographed, in flat gray light"
      }
      className={`image-review__photo image-review__photo--${edited ? "after" : "before"}`}
    >
      <Armchair aria-hidden="true" size={120} strokeWidth={1} />
    </div>
  );
}

export default function ImageReview() {
  const [decision, setDecision] = useState<Decision>("waiting");
  const [said, setSaid] = useState("");
  const badge = badges[decision];

  // Each would call your server.
  const decide = (next: Decision, words: string) => {
    setDecision(next);
    setSaid(words);
  };

  return (
    <main className="image-review">
      <header className="image-review__head">
        <div className="image-review__heading">
          <h1 className="image-review__title">Linden armchair, front</h1>
          <p className="image-review__meta">
            Retouched by Studio North, sent for review today
          </p>
        </div>
        <Badge intent={badge.intent}>{badge.text}</Badge>
      </header>

      <div className="image-review__layout">
        <Compare
          mode="toggle"
          beforeLabel="Original"
          afterLabel="Retouched"
          switchLabel="Show the photograph"
          className="image-review__compare"
          before={<Photo edited={false} />}
          after={<Photo edited />}
        />

        <aside
          className="image-review__side"
          aria-labelledby="image-review-edits"
        >
          <h2 className="image-review__subtitle" id="image-review-edits">
            What was changed
          </h2>
          <ul className="image-review__edits">
            {edits.map((edit) => (
              <li key={edit}>{edit}</li>
            ))}
          </ul>
          <div className="image-review__actions">
            <Button
              disabled={decision === "approved"}
              onClick={() =>
                decide("approved", "Approved. Studio North has been told.")
              }
            >
              Approve
            </Button>
            <Button
              intent="secondary"
              disabled={decision === "changes"}
              onClick={() =>
                decide(
                  "changes",
                  "Changes asked for. Studio North has been told.",
                )
              }
            >
              Ask for changes
            </Button>
          </div>
          {/* In the page from the start, so a screen reader hears each
              change. */}
          <p role="status" className="image-review__said">
            {said}
          </p>
        </aside>
      </div>
    </main>
  );
}
