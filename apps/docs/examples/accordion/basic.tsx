import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@nuvui/react";

export default function Example() {
  return (
    <Accordion type="single" collapsible style={{ inlineSize: "100%" }}>
      <AccordionItem value="shipping">
        <AccordionTrigger>How long does shipping take?</AccordionTrigger>
        <AccordionContent>
          Orders leave the warehouse within two working days. Delivery takes
          another three to five.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionTrigger>Can I send something back?</AccordionTrigger>
        <AccordionContent>
          Yes, within 30 days, as long as it hasn't been used.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="warranty">
        <AccordionTrigger>Is there a warranty?</AccordionTrigger>
        <AccordionContent>Two years on everything we sell.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
