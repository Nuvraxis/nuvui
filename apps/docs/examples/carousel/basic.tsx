import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@nuvui/react";

const slides = ["Plan the quarter", "Invite the team", "Connect billing"];

const slide = {
  display: "grid",
  placeItems: "center",
  blockSize: 160,
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-muted)",
};

export default function Example() {
  return (
    <Carousel
      aria-label="Getting started"
      style={{ inlineSize: "100%", maxInlineSize: 420 }}
    >
      <CarouselContent>
        {slides.map((title) => (
          <CarouselItem key={title}>
            <div style={slide}>{title}</div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <CarouselPrevious />
        <CarouselDots />
        <CarouselNext />
      </div>
    </Carousel>
  );
}
