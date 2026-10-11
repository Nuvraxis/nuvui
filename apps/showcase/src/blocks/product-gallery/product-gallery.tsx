"use client";

import {
  Badge,
  Button,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselThumbnail,
  CarouselThumbnails,
} from "@nuvui/react";
import { Armchair } from "lucide-react";
import { useState } from "react";
import "./product-gallery.scss";

// A made-up chair. The pictures are stand-ins: a tint and an icon where
// your photographs go.
const views = [
  { id: "front", name: "Front", tone: "blue" },
  { id: "side", name: "Side", tone: "green" },
  { id: "back", name: "Back", tone: "amber" },
  { id: "detail", name: "Detail of the seam", tone: "red" },
];

export default function ProductGallery() {
  const [added, setAdded] = useState(0);

  return (
    <main className="product-gallery">
      <div className="product-gallery__layout">
        <Carousel aria-label="Photographs of the Linden armchair" loop>
          <div className="product-gallery__stage">
            <CarouselContent>
              {views.map((view) => (
                <CarouselItem key={view.id}>
                  <figure
                    className={`product-gallery__photo product-gallery__photo--${view.tone}`}
                  >
                    <Armchair aria-hidden="true" size={96} strokeWidth={1} />
                    <figcaption>{view.name}</figcaption>
                  </figure>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="product-gallery__arrows">
              <CarouselPrevious />
              <CarouselNext />
            </div>
          </div>
          <CarouselThumbnails aria-label="Choose a photograph">
            {views.map((view, index) => (
              <CarouselThumbnail
                key={view.id}
                index={index}
                aria-label={view.name}
                className={`product-gallery__thumb product-gallery__photo--${view.tone}`}
              >
                <Armchair aria-hidden="true" size={28} strokeWidth={1.5} />
              </CarouselThumbnail>
            ))}
          </CarouselThumbnails>
        </Carousel>

        <section
          className="product-gallery__about"
          aria-labelledby="product-gallery-name"
        >
          <Badge intent="success" variant="outline">
            In stock
          </Badge>
          <h1 id="product-gallery-name" className="product-gallery__name">
            Linden armchair
          </h1>
          <p className="product-gallery__price">$420</p>
          <p className="product-gallery__text">
            Oak frame, wool seat. Made to order in four weeks, and delivered
            assembled.
          </p>
          {/* This would add it to a cart on your server. */}
          <Button onClick={() => setAdded((count) => count + 1)}>
            Add to cart
          </Button>
          {/* In the page from the start, so a screen reader hears each one. */}
          <p role="status" className="product-gallery__text">
            {added === 0
              ? ""
              : added === 1
                ? "Added to your cart."
                : `${added} in your cart.`}
          </p>
        </section>
      </div>
    </main>
  );
}
