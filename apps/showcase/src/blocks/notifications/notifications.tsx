"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
} from "@nuvui/react";
import { type FormEvent, useState } from "react";
import "./notifications.scss";

const groups = [
  {
    id: "email",
    title: "Email",
    about: "Sent to ada@example.com.",
    items: [
      {
        id: "email-mentions",
        label: "Mentions",
        hint: "When someone mentions you in a comment.",
        on: true,
      },
      {
        id: "email-invoices",
        label: "Invoices",
        hint: "When an invoice is paid or goes overdue.",
        on: true,
      },
      {
        id: "email-summary",
        label: "Weekly summary",
        hint: "What your team did, on Monday morning.",
        on: false,
      },
    ],
  },
  {
    id: "push",
    title: "On this device",
    about: "Shown by your browser while you're signed in.",
    items: [
      {
        id: "push-mentions",
        label: "Mentions",
        hint: "When someone mentions you in a comment.",
        on: true,
      },
      {
        id: "push-approvals",
        label: "Approvals",
        hint: "When something is waiting for you to approve it.",
        on: false,
      },
    ],
  },
];

export default function Notifications() {
  const [saved, setSaved] = useState(false);

  // Save the preferences from here. Each switch is sent under its name
  // when it's on.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(true);
  };

  return (
    <main className="notifications">
      <header className="notifications__head">
        <h1 className="notifications__title">Notifications</h1>
        <p className="notifications__text">
          Choose what you hear about, and where.
        </p>
      </header>
      <form className="notifications__form" onSubmit={submit}>
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle asChild>
                <h2>{group.title}</h2>
              </CardTitle>
              <CardDescription>{group.about}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="notifications__list">
                {group.items.map((item) => (
                  <li key={item.id} className="notifications__item">
                    <div className="notifications__about">
                      <label className="notifications__label" htmlFor={item.id}>
                        {item.label}
                      </label>
                      <p className="notifications__hint" id={`${item.id}-hint`}>
                        {item.hint}
                      </p>
                    </div>
                    <Switch
                      id={item.id}
                      name={item.id}
                      defaultChecked={item.on}
                      aria-describedby={`${item.id}-hint`}
                      onCheckedChange={() => setSaved(false)}
                    />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
        <div className="notifications__actions">
          <Button type="submit">Save preferences</Button>
          {/* Always in the page, so that what's put in it is read out. */}
          <p className="notifications__status" role="status">
            {saved ? "Saved." : null}
          </p>
        </div>
      </form>
    </main>
  );
}
