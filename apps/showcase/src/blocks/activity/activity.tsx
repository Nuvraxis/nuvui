"use client";

import {
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@nuvui/react";
import { BellOff } from "lucide-react";
import { useState } from "react";
import "./activity.scss";

// Made-up people and events. `at` is the time for a machine, and `when`
// is how you'd say it.
const events = [
  {
    id: "1",
    who: "Grace Hopper",
    initials: "GH",
    what: "approved invoice",
    subject: "INV-2041",
    at: "2026-10-08T09:42",
    when: "12 minutes ago",
  },
  {
    id: "2",
    who: "Alan Turing",
    initials: "AT",
    what: "refunded order",
    subject: "ORD-7228",
    at: "2026-10-08T08:55",
    when: "1 hour ago",
  },
  {
    id: "3",
    who: "Katherine Johnson",
    initials: "KJ",
    what: "invited",
    subject: "dorothy@example.com",
    at: "2026-10-08T07:10",
    when: "3 hours ago",
  },
  {
    id: "4",
    who: "Ada Lovelace",
    initials: "AL",
    what: "changed the plan to",
    subject: "Business, yearly",
    at: "2026-10-07T16:31",
    when: "Yesterday",
  },
  {
    id: "5",
    who: "Edsger Dijkstra",
    initials: "ED",
    what: "exported",
    subject: "the September report",
    at: "2026-10-06T11:02",
    when: "2 days ago",
  },
];

export default function Activity() {
  const [shown, setShown] = useState(events);

  return (
    <section className="activity">
      <Card>
        <CardHeader>
          <CardTitle asChild>
            <h2>Recent activity</h2>
          </CardTitle>
          <CardDescription>What your team did, newest first.</CardDescription>
          {shown.length > 0 ? (
            <CardAction>
              <Button intent="secondary" size="sm" onClick={() => setShown([])}>
                Clear
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          {shown.length > 0 ? (
            <ol className="activity__list">
              {shown.map((event) => (
                <li key={event.id} className="activity__item">
                  <Avatar size="sm">
                    <AvatarFallback>{event.initials}</AvatarFallback>
                  </Avatar>
                  <p className="activity__text">
                    <span className="activity__strong">{event.who}</span>{" "}
                    {event.what}{" "}
                    <span className="activity__strong">{event.subject}</span>
                  </p>
                  <time className="activity__time" dateTime={event.at}>
                    {event.when}
                  </time>
                </li>
              ))}
            </ol>
          ) : (
            <Empty>
              <EmptyMedia>
                <BellOff aria-hidden="true" size={24} />
              </EmptyMedia>
              <EmptyTitle>Nothing yet</EmptyTitle>
              <EmptyDescription>
                When someone on your team approves, refunds or invites, it shows
                up here.
              </EmptyDescription>
              <EmptyActions>
                <Button intent="secondary" onClick={() => setShown(events)}>
                  Show the examples again
                </Button>
              </EmptyActions>
            </Empty>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
