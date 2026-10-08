import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@nuvui/react";
import "./faq.scss";

const questions = [
  {
    id: "trial",
    question: "What happens when the trial ends?",
    answer:
      "The workspace becomes read-only. Nothing is removed, and it opens up again the moment you choose a plan.",
  },
  {
    id: "seats",
    question: "Who counts as a person on my plan?",
    answer:
      "Anyone who can send or change an invoice. People who only read reports are free on every plan.",
  },
  {
    id: "change",
    question: "Can I change plans part way through a month?",
    answer:
      "Yes. Moving up starts at once, and you pay the difference for the days that are left. Moving down starts at the next renewal.",
  },
  {
    id: "export",
    question: "Can I take my data with me?",
    answer:
      "Every invoice, customer and payment can be exported as CSV from the settings, at any time and on any plan.",
  },
  {
    id: "payment",
    question: "How can I pay?",
    answer:
      "By card on every plan. On the Business plan you can also pay by bank transfer against a yearly invoice.",
  },
];

export default function Faq() {
  return (
    <section className="faq" aria-labelledby="faq-title">
      <div className="faq__intro">
        <h2 className="faq__title" id="faq-title">
          Questions people ask
        </h2>
        <p className="faq__lead">
          If yours isn't here,{" "}
          <a className="faq__link" href="#contact">
            write to us
          </a>{" "}
          and a person will answer.
        </p>
      </div>
      {/* One answer open at a time, and the open one can be closed. */}
      <Accordion type="single" collapsible className="faq__list">
        {questions.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
