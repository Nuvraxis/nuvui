---
"@nuvui/react": minor
---

A new component.

- `Carousel` is slides to move through by dragging or with buttons: the photographs of a product, the steps of a tour, cards that don't fit in a row. Its parts are `CarouselContent` and `CarouselItem` for the slides, `CarouselPrevious` and `CarouselNext`, `CarouselDots`, `CarouselThumbnails` with `CarouselThumbnail`, and `CarouselPlayPause`. It moves sideways or up and down, can loop, can show several slides at once, and can be kept by you with `index` and `onIndexChange`.
- A slide that's out of sight can't be reached with Tab or read by a screen reader. A screen reader is told which slide it's at when a button moves it. With `autoplay` it waits under the pointer, stops when the keyboard reaches it, and doesn't start for someone who has asked for less motion.
- It's built on `embla-carousel-react`, which is now a dependency of `@nuvui/react`.
