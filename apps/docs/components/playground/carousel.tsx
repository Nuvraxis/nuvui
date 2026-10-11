"use client";

import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@nuvui/react";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

const orientations = ["horizontal", "vertical"] as const;
const slides = ["One", "Two", "Three", "Four"];

export function CarouselPlayground() {
  const [orientation, setOrientation] =
    useState<(typeof orientations)[number]>("horizontal");
  const [loop, setLoop] = useState(false);
  const [dots, setDots] = useState(true);
  const vertical = orientation === "vertical";

  const code = `<Carousel aria-label="Steps"${
    vertical ? ' orientation="vertical"' : ""
  }${loop ? " loop" : ""}>
  <CarouselContent${vertical ? " style={{ blockSize: 160 }}" : ""}>
    <CarouselItem>One</CarouselItem>
    <CarouselItem>Two</CarouselItem>
    <CarouselItem>Three</CarouselItem>
    <CarouselItem>Four</CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />${dots ? "\n  <CarouselDots />" : ""}
</Carousel>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="orientation"
            value={orientation}
            options={orientations}
            onChange={setOrientation}
          />
          <CheckboxControl label="loop" checked={loop} onChange={setLoop} />
          <CheckboxControl label="dots" checked={dots} onChange={setDots} />
        </>
      }
    >
      <Carousel
        // Which way it moves is the engine's from the start. Starting again
        // puts the slides back where the code says.
        key={orientation}
        aria-label="Steps"
        orientation={orientation}
        loop={loop}
        style={{ inlineSize: "100%", maxInlineSize: 360 }}
      >
        <CarouselContent style={vertical ? { blockSize: 160 } : undefined}>
          {slides.map((name) => (
            <CarouselItem key={name}>
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  blockSize: vertical ? "100%" : 140,
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--color-muted)",
                }}
              >
                {name}
              </div>
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
          {dots ? <CarouselDots /> : null}
          <CarouselNext />
        </div>
      </Carousel>
    </Playground>
  );
}
