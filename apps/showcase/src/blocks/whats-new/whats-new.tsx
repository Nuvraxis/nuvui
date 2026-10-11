"use client";

import {
  Badge,
  Button,
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
} from "@nuvui/react";
import { FileSpreadsheet, KeyRound, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./whats-new.scss";

// Made-up release notes for a made-up product.
const notes = [
  {
    id: "export",
    icon: FileSpreadsheet,
    kind: "New",
    title: "Export invoices as CSV",
    text: "Choose the invoices you want in the table and export them, with the columns you have showing.",
  },
  {
    id: "roles",
    icon: ShieldCheck,
    kind: "New",
    title: "A read-only role",
    text: "A viewer can see everything in the workspace and change nothing. Good for auditors and for finance.",
  },
  {
    id: "sso",
    icon: KeyRound,
    kind: "Improved",
    title: "Single sign-on is out of beta",
    text: "Sign in through your identity provider. Set it up under Settings, then Security.",
  },
];

export default function WhatsNew() {
  // The carousel is told which note it's at, so the buttons under it can
  // be ordinary ones with words on them.
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const last = index === notes.length - 1;
  // Done takes the button that was pressed out of the page, and so does
  // reading them again. Focus goes to the button that takes its place.
  const again = useRef<HTMLButtonElement>(null);
  const onward = useRef<HTMLButtonElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (moved.current) (done ? again : onward).current?.focus();
    moved.current = true;
  }, [done]);

  return (
    <main className="whats-new">
      <section className="whats-new__card" aria-labelledby="whats-new-title">
        <header className="whats-new__head">
          <h1 id="whats-new-title" className="whats-new__title">
            What's new
          </h1>
          <p className="whats-new__text">October 2026</p>
        </header>

        {done ? (
          <div className="whats-new__done">
            <p role="status" className="whats-new__text">
              You're up to date.
            </p>
            <Button
              ref={again}
              intent="secondary"
              onClick={() => {
                setIndex(0);
                setDone(false);
              }}
            >
              Read them again
            </Button>
          </div>
        ) : (
          <Carousel
            aria-label="What's new in October"
            index={index}
            onIndexChange={setIndex}
          >
            <CarouselContent>
              {notes.map((note) => (
                <CarouselItem key={note.id}>
                  <article className="whats-new__note">
                    <div className="whats-new__picture">
                      <note.icon aria-hidden="true" size={40} />
                    </div>
                    <Badge variant="outline">{note.kind}</Badge>
                    <h2 className="whats-new__heading">{note.title}</h2>
                    <p className="whats-new__text">{note.text}</p>
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="whats-new__foot">
              <CarouselDots />
              <div className="whats-new__actions">
                <Button
                  intent="ghost"
                  disabled={index === 0}
                  onClick={() => setIndex(index - 1)}
                >
                  Back
                </Button>
                {last ? (
                  <Button onClick={() => setDone(true)}>Done</Button>
                ) : (
                  <Button ref={onward} onClick={() => setIndex(index + 1)}>
                    Next
                  </Button>
                )}
              </div>
            </div>
          </Carousel>
        )}
      </section>
    </main>
  );
}
