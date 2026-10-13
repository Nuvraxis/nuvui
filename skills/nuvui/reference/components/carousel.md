<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/carousel.mdx. Don't edit it here: run `pnpm skill`. -->

# Carousel

Slides to move through by dragging or with buttons, with dots or thumbnails to go straight to one.

Use a carousel for a few things of the same kind where one at a time is enough: the photographs of a product, the steps of a tour, cards that don't all fit in a row. It hides most of what it holds, so don't put anything in it that everyone has to see. A list or a grid shows all of it at once.

```tsx
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
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
  CarouselThumbnails,
  CarouselThumbnail,
  CarouselPlayPause,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Carousel` | The carousel. It keeps which slide it's at. |
| `CarouselContent` | The window the slides are seen through, and the row of them. |
| `CarouselItem` | One slide. |
| `CarouselPrevious`, `CarouselNext` | The buttons that go back and on. |
| `CarouselDots` | A dot for each stop, to go straight to it. |
| `CarouselThumbnails`, `CarouselThumbnail` | The same with a small picture of yours for each. |
| `CarouselPlayPause` | The button that stops and starts a carousel that moves by itself. |

Only the first three are needed. The parts are set out one under another, in the order you write them. Where the buttons and the dots sit is yours to say, with an element of your own around them.

It's built on [Embla Carousel](https://www.embla-carousel.com/), which does the dragging and the moving.

## More than one slide at a time

A slide is as wide as the carousel unless you say otherwise. `--nuv-carousel-slide-size` makes it a share of that, and `--nuv-carousel-gap` is the space between two. A size that leaves part of the next slide showing says there is a next slide.

```tsx
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
```

`options` goes to the engine. `align: "start"` lines slides up with the start of the carousel, and `slidesToScroll` moves several at once.

With several slides in view there are fewer stops than slides: the carousel stops where the last slide reaches the end. `CarouselDots` draws a dot for each stop.

## Up and down

`orientation="vertical"` moves the slides up and down. Give `CarouselContent` a height: the slides fill it.

```tsx
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
```

## Thumbnails

A `CarouselThumbnail` is a button that goes to one slide, with whatever you put in it. Name each one, with `aria-label` or with the `alt` of a picture inside it.

```tsx
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
```

## Moving by itself

`autoplay` moves to the next slide every so many milliseconds. Think twice. Something that moves while it's being read is hard on anyone who reads slowly, and most people have left before the second slide.

With `autoplay`, put a `CarouselPlayPause` inside, before the slides, so the keyboard reaches it first. The carousel also:

- waits while the pointer is over it, and goes on when the pointer leaves
- stops when the keyboard reaches it, and stays stopped until the button starts it again
- doesn't move while its tab is in the background
- doesn't start at all for someone who has asked their system for less motion

```tsx
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
```

Give each slide at least five seconds, and more for more words.

## Keeping the slide yourself

`index` and `onIndexChange` put the slide it's at in your hands, counted from 0. `defaultIndex` says where it starts and leaves the rest to the carousel.

```tsx
const [index, setIndex] = useState(0);

<Carousel aria-label="Tour" index={index} onIndexChange={setIndex}>
```

For anything the props don't reach, `onApi` gives you the engine itself once it's running.

## Carousel props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Which way the slides move: sideways, or up and down. Up and down needs a height on `CarouselContent`. |
| `index` | `number` |  | The stop it's at, counted from 0, when you control it. |
| `defaultIndex` | `number` | `0` | The stop it starts at, when you don't. |
| `onIndexChange` | `((index: number) => void)` |  | Called with the stop it has moved to. |
| `loop` | `boolean` | `false` | Whether going on from the last slide comes round to the first. |
| `autoplay` | `number` |  | Moves to the next slide by itself, this many milliseconds after the last. It needs a `CarouselPlayPause` inside, so it can be stopped. It waits while the pointer is over the carousel, stops for good when the keyboard reaches it, and doesn't start for someone who has asked for less motion. |
| `getSlideLabel` | `((index: number, count: number) => string)` | `"1 of 5", and so on` | What a screen reader calls each slide, from its number and how many there are. |
| `options` | `Partial<OptionsType>` |  | More for the engine, Embla Carousel: `align`, `slidesToScroll`, `dragFree` and the rest of its options. |
| `onApi` | `((api: CarouselApi \| undefined) => void)` |  | Called with the engine once it's running, and with `undefined` after. |

It also takes what a `div` takes, including `ref` and `className`.

## CarouselDots props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `getDotLabel` | `((index: number, count: number) => string)` | `"Go to slide 1", and so on` | What a screen reader calls each dot, from its number and how many there are. |

It also takes what a `div` takes.

## CarouselThumbnail props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `index` (required) | `number` |  | The stop it goes to, counted from 0. |
| `children` | `ReactNode` |  | What it shows: a small picture, most often. |

It also takes what a `button` takes.

## CarouselPlayPause props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `getLabel` | `((playing: boolean) => string)` | `"Stop the slides moving" and "Start the slides moving"` | What a screen reader calls the button, from whether the carousel is moving by itself. |

It also takes what a `button` takes. So do `CarouselPrevious` and `CarouselNext`: put something of yours in one and it replaces the arrow, and is then what names the button. `CarouselContent`, `CarouselItem` and `CarouselThumbnails` take what a `div` takes.

## Accessibility

It follows the [carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) of the ARIA Authoring Practices, in the form with a button for each slide.

### Keyboard

Every control is a button and a stop for Tab. There are no arrow keys: they belong to whatever has focus inside a slide.

| Key | What it does |
| --- | --- |
| Tab | Moves through the buttons, and through what's in the slides that can be seen. |
| Enter, Space | Presses the button: back, on, a dot, a thumbnail, or stop and start. |

### What the component handles

- The carousel is a `region` that a screen reader calls a "carousel", and each slide a `group` it calls a "slide", named "1 of 5" and so on.
- A slide that's out of sight is `inert`: Tab doesn't go to what's in it, and a screen reader doesn't read it.
- When a button moves the carousel, a screen reader is told "Slide 2 of 5". While the carousel moves by itself it's told nothing, or it would never stop talking.
- The dot or thumbnail the carousel is at has `aria-current="true"`. The dot is longer as well as darker, and the thumbnail has a ring, so neither is told apart by color alone.
- A dot is 8 pixels across, inside a button that's larger. With a finger the button is 44 pixels tall and 24 wide: dots sit in a row, and wider ones would overlap. With a mouse it's 24 both ways. The buttons to go back and on are 44 both ways.
- The buttons to go back and on are disabled at the ends of a carousel that doesn't loop.
- Someone who has asked for less motion gets slides that change at once, without the slide across.
- In a right-to-left page the slides run the other way, and so do a drag and the arrows.

### What you need to handle

- Name the carousel with `aria-label`, such as "Photographs of the chair". Don't put the word "carousel" in it: a screen reader adds it.
- Name each thumbnail.
- With `autoplay`, include a `CarouselPlayPause`. Without one there's no way to stop it, and WCAG's 2.2.2 asks for one.
- Give a slide a name of its own with `aria-label` where "3 of 5" says too little.
- In another language, give the words: `getSlideLabel` on the carousel, `getDotLabel` and `aria-label` on the dots, `aria-label` on the buttons and the thumbnails' row, and `getLabel` on the stop and start button. The words said when a slide changes are English for now.
- Dragging is one way to move it and not the only one. Keep the buttons, or the dots.

## On small screens

A swipe moves the slides, and the page still scrolls the other way. The buttons are 44 pixels with a finger and 36 with a mouse. Several slides in view on a desktop are too many on a phone: set `--nuv-carousel-slide-size` from a media query.

## CSS variables

Set any of these on the `Carousel`, or on anything around it.

```css
.gallery {
  --nuv-carousel-slide-size: 50%;
  --nuv-carousel-gap: 1.5rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-carousel-controls-gap` | `calc(var(--spacing) * 3)` | Space between the slides and what you put after them. |
| `--nuv-carousel-fg` | `var(--color-foreground)` | Color of the text in the carousel. |
| `--nuv-carousel-gap` | `calc(var(--spacing) * 4)` | Space between two slides. |
| `--nuv-carousel-slide-size` | `100%` | How much of the carousel a slide takes: its width, or its height when the slides move up and down. |
| `--nuv-carousel-button-size` | `var(--nuv-touch-size)`, `calc(var(--spacing) * 9)` | Size of the buttons. Larger by default with a finger than with a mouse. |
| `--nuv-carousel-button-border` | `var(--color-border-strong)` | Color of a button's edge. |
| `--nuv-carousel-button-bg` | `var(--color-background)` | Background of a button. |
| `--nuv-carousel-button-fg` | `var(--color-foreground)` | Color of the arrow in a button. |
| `--nuv-carousel-button-hover-bg` | `var(--color-muted)` | Background of a button under the pointer. |
| `--nuv-carousel-arrow-turn` | `none` | Set by the component: how the arrow is turned to point back, up or down. |
| `--nuv-carousel-dot-target` | `calc(var(--spacing) * 6)` | Least width of what takes a press around a dot, and its height with a mouse. Keep it at 24px or more. |
| `--nuv-carousel-dot-gap` | `calc(var(--spacing) * 2)` | Space between dots. |
| `--nuv-carousel-dot-size` | `calc(var(--spacing) * 2)` | Size of a dot. |
| `--nuv-carousel-dot-border` | `var(--color-muted-foreground)` | Color of a dot's edge. Keep it at 3:1 against the page. |
| `--nuv-carousel-dot-bg` | `transparent` | Fill of a dot the carousel isn't at. |
| `--nuv-carousel-dot-current` | `var(--color-primary)` | Color of the dot the carousel is at. |
| `--nuv-carousel-thumbnail-gap` | `calc(var(--spacing) * 2)` | Space between thumbnails. |
| `--nuv-carousel-thumbnail-size` | `calc(var(--spacing) * 16)` | Size of a thumbnail. |
| `--nuv-carousel-thumbnail-border` | `var(--color-border)` | Color of a thumbnail's edge. |
| `--nuv-carousel-thumbnail-radius` | `var(--radius-md)` | Corner radius of a thumbnail. |
| `--nuv-carousel-thumbnail-bg` | `var(--color-muted)` | Background of a thumbnail, behind what you put in it. |
| `--nuv-carousel-thumbnail-opacity` | `0.7` | How faded a thumbnail is when the carousel isn't at it. |
| `--nuv-carousel-thumbnail-current` | `var(--color-primary)` | Color of the ring round the thumbnail the carousel is at. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-carousel` | Carousel |
| `.nuv-carousel__arrow` | The arrow in the buttons that go back and on. |
| `.nuv-carousel__button` | CarouselPrevious, CarouselNext and CarouselPlayPause. |
| `.nuv-carousel__button--next` | CarouselNext |
| `.nuv-carousel__button--previous` | CarouselPrevious |
| `.nuv-carousel__content` | CarouselContent: the row of slides. |
| `.nuv-carousel__dot` | The button around one dot. The dot is its ::before. |
| `.nuv-carousel__dots` | CarouselDots |
| `.nuv-carousel__item` | CarouselItem |
| `.nuv-carousel__status` | What a screen reader is told when the slide changes. Drawn for nobody. |
| `.nuv-carousel__thumbnail` | CarouselThumbnail |
| `.nuv-carousel__thumbnails` | CarouselThumbnails |
| `.nuv-carousel__viewport` | The window the slides are seen through. |

The carousel has `data-orientation`. The stop and start button has `data-playing` while the carousel moves by itself.

## Server components

Carousel starts with `"use client"`: it keeps which slide it's at. You can render it from a server component with slides written there, as long as you leave out `onIndexChange`, `onApi` and the functions that make labels, since a function can't be passed from the server.

## Do and don't

**Do**

- Show part of the next slide, or dots, so it's plain there's more.
- Keep it to a handful of slides. Past six or seven, few people reach the end.

**Don't**

- Don't put the one thing everyone must see on the third slide.
- Don't use `autoplay` for anything that has to be read.
- Don't use it for steps that have to be done in order. That's a [stepper](stepper.md).
