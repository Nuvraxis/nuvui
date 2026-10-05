import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@nuvui/react";

export default function Example() {
  return (
    <Accordion
      type="multiple"
      defaultValue={["size", "color"]}
      style={{ inlineSize: "100%" }}
    >
      <AccordionItem value="size">
        <AccordionTrigger>Size</AccordionTrigger>
        <AccordionContent>Small, medium and large.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="color">
        <AccordionTrigger>Color</AccordionTrigger>
        <AccordionContent>Black, gray and blue.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="material">
        <AccordionTrigger>Material</AccordionTrigger>
        <AccordionContent>Cotton and linen.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
