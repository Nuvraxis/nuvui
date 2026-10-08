import { Card, CardDescription, CardHeader, CardTitle } from "@nuvui/react";
import {
  ArrowRight,
  BellRing,
  ChartColumn,
  FileDown,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import "./feature-grid.scss";

const features = [
  {
    Icon: Send,
    title: "Send in one step",
    text: "Write an invoice once and send it by email, as a link or as a PDF.",
  },
  {
    Icon: BellRing,
    title: "Reminders that go by themselves",
    text: "A nudge three days before the due date, and another a week after.",
  },
  {
    Icon: ChartColumn,
    title: "See what's owed",
    text: "What's out, what's late and what came in, for any span of months.",
  },
  {
    Icon: Users,
    title: "A role for everyone",
    text: "Let someone send invoices without letting them change the prices.",
  },
  {
    Icon: ShieldCheck,
    title: "A record of every change",
    text: "Who changed what and when, kept for a year and ready to export.",
  },
  {
    Icon: FileDown,
    title: "Your data stays yours",
    text: "Export everything as CSV whenever you ask, with nothing held back.",
  },
];

export default function FeatureGrid() {
  return (
    <section className="feature-grid" aria-labelledby="feature-grid-title">
      <div className="feature-grid__intro">
        <p className="feature-grid__label">What's in it</p>
        <h2 className="feature-grid__title" id="feature-grid-title">
          Everything between the work and the payment
        </h2>
        <p className="feature-grid__lead">
          Six things a team needs to get paid on time, and nothing to set up
          before the first invoice goes out.
        </p>
        <a className="feature-grid__link" href="#features">
          See everything it does
          <ArrowRight aria-hidden="true" size={16} />
        </a>
      </div>
      <ul className="feature-grid__list">
        {features.map(({ Icon, title, text }) => (
          <li key={title}>
            <Card className="feature-grid__card">
              <CardHeader>
                <span className="feature-grid__icon">
                  <Icon aria-hidden="true" size={20} />
                </span>
                <CardTitle asChild>
                  <h3>{title}</h3>
                </CardTitle>
                <CardDescription>{text}</CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
