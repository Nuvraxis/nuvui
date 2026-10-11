import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPlayPause,
  CarouselPrevious,
} from "@nuvui/react";

const news = [
  "Invoices can be exported as CSV",
  "Roles now have a read-only kind",
  "Single sign-on is out of beta",
];

const slide = {
  display: "grid",
  placeItems: "center",
  blockSize: 140,
  padding: 16,
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-muted)",
  textAlign: "center",
} as const;

export default function Example() {
  return (
    <Carousel
      aria-label="What is new"
      autoplay={4000}
      loop
      style={{ inlineSize: "100%", maxInlineSize: 420 }}
    >
      {/* First, so it is the first thing the keyboard reaches. */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <CarouselPlayPause />
        <CarouselPrevious />
        <CarouselNext />
        <CarouselDots style={{ marginInlineStart: "auto" }} />
      </div>
      <CarouselContent>
        {news.map((item) => (
          <CarouselItem key={item}>
            <div style={slide}>{item}</div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
