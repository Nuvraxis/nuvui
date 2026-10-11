import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@nuvui/react";
import "./case-studies.scss";

// Made-up companies, people and figures. Nothing here is a real customer
// or a real result.
const studies = [
  {
    id: "northwind",
    company: "Northwind",
    sector: "Logistics",
    figure: "38%",
    gain: "less time closing the month",
    quote:
      "The month used to end with three people and a spreadsheet. Now it ends with a button.",
    person: "Grace Hopper, Finance lead",
  },
  {
    id: "contoso",
    company: "Contoso",
    sector: "Healthcare",
    figure: "2 days",
    gain: "from invoice to payment, down from 11",
    quote:
      "Our customers pay sooner because the invoice reaches them sooner. That's all it took.",
    person: "Alan Turing, Operations",
  },
  {
    id: "fabrikam",
    company: "Fabrikam",
    sector: "Manufacturing",
    figure: "1,200",
    gain: "invoices a month, with one person",
    quote:
      "We tripled what we send out and nobody was hired to send it. I check the exceptions and go home.",
    person: "Katherine Johnson, Accounts",
  },
  {
    id: "adventure",
    company: "Adventure Works",
    sector: "Retail",
    figure: "0",
    gain: "audit findings, two years running",
    quote:
      "The auditors ask who approved something and when. It's there, every time, without anyone digging.",
    person: "Edsger Dijkstra, Controller",
  },
  {
    id: "wingtip",
    company: "Wingtip Toys",
    sector: "Wholesale",
    figure: "6 hours",
    gain: "a week given back to each of the team",
    quote:
      "Nobody chases approvals in chat any more. The request waits where the approver already is.",
    person: "Ada Lovelace, Head of finance",
  },
];

export default function CaseStudies() {
  return (
    <main className="case-studies">
      {/* How many show at once is the stylesheet's: one and a bit on a
          phone, two from the md breakpoint, three from lg. */}
      <Carousel
        aria-labelledby="case-studies-title"
        options={{ align: "start" }}
        className="case-studies__carousel"
      >
        <header className="case-studies__head">
          <div className="case-studies__about">
            <h1 id="case-studies-title" className="case-studies__title">
              Customer stories
            </h1>
            <p className="case-studies__text">
              What changed for five teams, in their words.
            </p>
          </div>
          <div className="case-studies__arrows">
            <CarouselPrevious aria-label="Earlier stories" />
            <CarouselNext aria-label="More stories" />
          </div>
        </header>
        <CarouselContent>
          {studies.map((study) => (
            <CarouselItem key={study.id} aria-label={study.company}>
              <article className="case-studies__card">
                <p className="case-studies__sector">
                  {study.company} · {study.sector}
                </p>
                <p className="case-studies__figure">{study.figure}</p>
                <p className="case-studies__gain">{study.gain}</p>
                <blockquote className="case-studies__quote">
                  {study.quote}
                </blockquote>
                <p className="case-studies__text">{study.person}</p>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </main>
  );
}
