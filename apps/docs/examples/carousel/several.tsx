import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@nuvui/react";
import type { CSSProperties } from "react";

const plans = ["Starter", "Team", "Business", "Enterprise", "Education"];

const slide = {
  display: "grid",
  placeItems: "center",
  blockSize: 120,
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-muted)",
};

export default function Example() {
  return (
    <Carousel
      aria-label="Plans"
      options={{ align: "start" }}
      style={
        {
          inlineSize: "100%",
          maxInlineSize: 520,
          // Two and a bit, so the next one shows there is a next one.
          "--nuv-carousel-slide-size": "40%",
        } as CSSProperties
      }
    >
      <CarouselContent>
        {plans.map((plan) => (
          <CarouselItem key={plan}>
            <div style={slide}>{plan}</div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <CarouselPrevious />
        <CarouselNext />
      </div>
    </Carousel>
  );
}
