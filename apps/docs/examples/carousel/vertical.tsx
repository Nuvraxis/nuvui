import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@nuvui/react";

const notes = ["Monday", "Tuesday", "Wednesday", "Thursday"];

const slide = {
  display: "grid",
  placeItems: "center",
  blockSize: "100%",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-muted)",
};

export default function Example() {
  return (
    <Carousel
      aria-label="This week"
      orientation="vertical"
      style={{ inlineSize: "100%", maxInlineSize: 320 }}
    >
      <CarouselContent style={{ blockSize: 180 }}>
        {notes.map((day) => (
          <CarouselItem key={day}>
            <div style={slide}>{day}</div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <CarouselPrevious />
        <CarouselNext />
      </div>
    </Carousel>
  );
}
