import { QRCode } from "@nuvui/barcodes";
import { Badge } from "@nuvui/react";
import "./event-ticket.scss";

// A made-up event, at a made-up place, for a made-up person.
const ticket = {
  code: "NS26-8841-KQ",
  event: "Northwind Summit 2026",
  kind: "Full conference",
  holder: "Ada Lovelace",
  facts: [
    { name: "Date", value: "Thursday 12 November 2026" },
    { name: "Doors", value: "08:30" },
    { name: "Venue", value: "Harbour Hall, Bristol" },
    { name: "Seat", value: "Row F, seat 14" },
  ],
};
const page = `https://example.com/t/${ticket.code}`;

export default function EventTicket() {
  return (
    <main className="event-ticket">
      <article
        className="event-ticket__card"
        aria-labelledby="event-ticket-title"
      >
        <div className="event-ticket__details">
          <header className="event-ticket__head">
            <Badge intent="primary" variant="outline">
              {ticket.kind}
            </Badge>
            <h1 id="event-ticket-title" className="event-ticket__title">
              {ticket.event}
            </h1>
            <p className="event-ticket__holder">{ticket.holder}</p>
          </header>
          <dl className="event-ticket__facts">
            {ticket.facts.map((fact) => (
              <div key={fact.name} className="event-ticket__fact">
                <dt className="event-ticket__name">{fact.name}</dt>
                <dd className="event-ticket__value">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The part that's torn off at the door. A server component: the
            code is worked out on the server and arrives as markup. */}
        <div className="event-ticket__stub">
          <QRCode
            value={page}
            size={176}
            errorCorrection="Q"
            aria-label={`Ticket ${ticket.code}, to scan at the door`}
          />
          <p className="event-ticket__code">{ticket.code}</p>
          {/* For whoever is reading this on the phone they'd scan with. */}
          <a className="event-ticket__link" href={page}>
            Open the ticket
          </a>
        </div>
      </article>
    </main>
  );
}
