import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselThumbnail,
  CarouselThumbnails,
} from "@nuvui/react";

// Stand-ins for photographs: a color and a name.
const photos = [
  { name: "Front", tone: "var(--color-blue-200)" },
  { name: "Side", tone: "var(--color-green-200)" },
  { name: "Back", tone: "var(--color-amber-200)" },
  { name: "Detail", tone: "var(--color-red-200)" },
];

export default function Example() {
  return (
    <Carousel
      aria-label="Photographs of the chair"
      style={{ inlineSize: "100%", maxInlineSize: 420 }}
    >
      <CarouselContent>
        {photos.map((photo) => (
          <CarouselItem key={photo.name}>
            <div
              style={{
                display: "grid",
                placeItems: "center",
                blockSize: 200,
                borderRadius: "var(--radius-lg)",
                background: photo.tone,
                color: "var(--color-black)",
              }}
            >
              {photo.name}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselThumbnails>
        {photos.map((photo, index) => (
          <CarouselThumbnail
            key={photo.name}
            index={index}
            aria-label={photo.name}
            style={{ background: photo.tone }}
          />
        ))}
      </CarouselThumbnails>
    </Carousel>
  );
}
