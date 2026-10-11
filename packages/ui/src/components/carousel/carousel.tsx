"use client";

import { useComposedRefs } from "@radix-ui/react-compose-refs";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import {
  type ButtonHTMLAttributes,
  createContext,
  type FocusEvent,
  forwardRef,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";

/** The carousel's engine, for what the props here don't reach. */
export type CarouselApi = NonNullable<UseEmblaCarouselType[1]>;
/** What the engine can be told: looping, how slides line up, and the rest. */
export type CarouselOptions = NonNullable<
  Parameters<typeof useEmblaCarousel>[0]
>;

interface CarouselContextValue {
  viewportRef: (element: HTMLElement | null) => void;
  orientation: "horizontal" | "vertical";
  /** Which stop the carousel is at, and how many it has. */
  index: number;
  count: number;
  canPrevious: boolean;
  canNext: boolean;
  previous: () => void;
  next: () => void;
  goTo: (index: number) => void;
  /** Whether it moves by itself at all, and whether it's doing so now. */
  autoplay: boolean;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  contentId: string;
}

const CarouselContext = createContext<CarouselContextValue | null>(null);

function useCarousel(part: string) {
  const context = useContext(CarouselContext);
  if (!context) throw new Error(`${part} has to be inside a Carousel.`);
  return context;
}

const reducedMotion = () =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface CarouselOwnProps {
  /**
   * Which way the slides move: sideways, or up and down. Up and down needs
   * a height on `CarouselContent`.
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
  /** The stop it's at, counted from 0, when you control it. */
  index?: number;
  /**
   * The stop it starts at, when you don't.
   * @default 0
   */
  defaultIndex?: number;
  /** Called with the stop it has moved to. */
  onIndexChange?: (index: number) => void;
  /**
   * Whether going on from the last slide comes round to the first.
   * @default false
   */
  loop?: boolean;
  /**
   * Moves to the next slide by itself, this many milliseconds after the
   * last. It needs a `CarouselPlayPause` inside, so it can be stopped. It
   * waits while the pointer is over the carousel, stops for good when the
   * keyboard reaches it, and doesn't start for someone who has asked for
   * less motion.
   */
  autoplay?: number;
  /**
   * What a screen reader calls each slide, from its number and how many
   * there are.
   * @default "1 of 5", and so on
   */
  getSlideLabel?: (index: number, count: number) => string;
  /**
   * More for the engine, Embla Carousel: `align`, `slidesToScroll`,
   * `dragFree` and the rest of its options.
   */
  options?: CarouselOptions;
  /** Called with the engine once it's running, and with `undefined` after. */
  onApi?: (api: CarouselApi | undefined) => void;
}

export interface CarouselProps
  extends CarouselOwnProps,
    HTMLAttributes<HTMLDivElement> {}

/**
 * Slides to move through, one or a few at a time, by dragging or with
 * buttons. Give it a name with `aria-label`, which a screen reader says
 * with the word "carousel".
 */
export const Carousel = forwardRef<HTMLDivElement, CarouselProps>(
  function Carousel(
    {
      orientation = "horizontal",
      index: indexProp,
      defaultIndex = 0,
      onIndexChange,
      loop = false,
      autoplay,
      getSlideLabel,
      options,
      onApi,
      className,
      onPointerEnter,
      onPointerLeave,
      onFocus,
      children,
      ...props
    },
    ref,
  ) {
    const root = useRef<HTMLDivElement>(null);
    const status = useRef<HTMLSpanElement>(null);
    const contentId = useId();
    // Which way the page reads is known once it's drawn. The engine has to
    // be told, or a drag and the buttons go the wrong way.
    const [rtl, setRtl] = useState(false);
    useEffect(() => {
      if (root.current) {
        setRtl(getComputedStyle(root.current).direction === "rtl");
      }
    }, []);

    const [viewportRef, api] = useEmblaCarousel({
      ...options,
      loop,
      axis: orientation === "horizontal" ? "x" : "y",
      direction: rtl ? "rtl" : "ltr",
      startIndex: indexProp ?? defaultIndex,
    });

    const [index = 0, setIndex] = useControllableState({
      prop: indexProp,
      defaultProp: defaultIndex,
      onChange: onIndexChange,
    });
    const [count, setCount] = useState(0);
    const [canPrevious, setCanPrevious] = useState(false);
    const [canNext, setCanNext] = useState(false);

    const moves = autoplay !== undefined && autoplay > 0;
    const [playing, setPlaying] = useState(moves);
    // The pointer is over it. It waits, and goes on when the pointer leaves.
    const [held, setHeld] = useState(false);
    const label = useRef(getSlideLabel);
    label.current = getSlideLabel;
    const quiet = useRef(playing);
    quiet.current = playing;

    // What the engine knows, kept where the parts can read it, and each
    // slide told which it is and whether it can be seen.
    useEffect(() => {
      if (!api) return;
      const horizontal = orientation === "horizontal";
      // Which slides can be seen, by measuring them against the window.
      // A slide that's out of sight is put out of reach too: Tab doesn't
      // go to what's in it, and a screen reader doesn't read it. The
      // engine's own list counts a slide that only touches the edge.
      //
      // It's what's in the slide that's measured, without the padding that
      // makes the space between two: that space can be in the window with
      // nothing of the slide to see.
      const reach = () => {
        const window = api.rootNode().getBoundingClientRect();
        for (const slide of api.slideNodes()) {
          const box = slide.getBoundingClientRect();
          const pad = getComputedStyle(slide);
          const inset = (side: string) => Number.parseFloat(side) || 0;
          const showing = horizontal
            ? Math.min(box.right - inset(pad.paddingRight), window.right) -
              Math.max(box.left + inset(pad.paddingLeft), window.left)
            : Math.min(box.bottom - inset(pad.paddingBottom), window.bottom) -
              Math.max(box.top + inset(pad.paddingTop), window.top);
          slide.toggleAttribute("inert", showing < 2);
        }
      };
      const read = () => {
        setCount(api.scrollSnapList().length);
        setCanPrevious(api.canScrollPrev());
        setCanNext(api.canScrollNext());
        setIndex(api.selectedScrollSnap());
        const slides = api.slideNodes();
        slides.forEach((slide, number) => {
          // The attribute is there with nothing in it, so it's whether
          // it's there that's asked.
          if (!slide.hasAttribute("data-named")) {
            slide.setAttribute(
              "aria-label",
              label.current?.(number, slides.length) ??
                `${number + 1} of ${slides.length}`,
            );
          }
        });
      };
      const chosen = () => {
        read();
        // Said only when it's the reader who moved it. Said while it moves
        // by itself, it would never stop talking.
        if (status.current) {
          status.current.textContent = quiet.current
            ? ""
            : `Slide ${api.selectedScrollSnap() + 1} of ${api.scrollSnapList().length}`;
        }
      };
      const again = () => {
        read();
        reach();
      };
      again();
      api
        .on("select", chosen)
        .on("reInit", again)
        .on("resize", reach)
        .on("scroll", reach)
        .on("settle", reach)
        .on("slidesInView", reach);
      return () => {
        api
          .off("select", chosen)
          .off("reInit", again)
          .off("resize", reach)
          .off("scroll", reach)
          .off("settle", reach)
          .off("slidesInView", reach);
      };
    }, [api, orientation, setIndex]);

    // Told when the engine starts and when it's gone, and not each time
    // you pass a function that's new but the same.
    const tell = useRef(onApi);
    tell.current = onApi;
    useEffect(() => {
      if (!api) return;
      tell.current?.(api);
      return () => tell.current?.(undefined);
    }, [api]);

    // An index of yours that the carousel isn't at yet.
    useEffect(() => {
      if (!api || indexProp === undefined) return;
      if (api.selectedScrollSnap() !== indexProp) {
        api.scrollTo(indexProp, reducedMotion());
      }
    }, [api, indexProp]);

    const previous = useCallback(() => api?.scrollPrev(reducedMotion()), [api]);
    const next = useCallback(() => api?.scrollNext(reducedMotion()), [api]);
    const goTo = useCallback(
      (to: number) => api?.scrollTo(to, reducedMotion()),
      [api],
    );

    // Someone who has asked for less motion gets none they didn't start.
    useEffect(() => {
      if (moves && reducedMotion()) setPlaying(false);
    }, [moves]);

    useEffect(() => {
      if (!api || !moves || !playing || held) return;
      const timer = window.setInterval(() => {
        // Not in a tab nobody is looking at.
        if (document.hidden) return;
        if (api.canScrollNext()) api.scrollNext();
        else api.scrollTo(0);
      }, autoplay);
      return () => window.clearInterval(timer);
    }, [api, moves, playing, held, autoplay]);

    function handleFocus(event: FocusEvent<HTMLDivElement>) {
      onFocus?.(event);
      // Reached with the keyboard, it stops, and stays stopped until it's
      // started again: what's being read shouldn't move away. Moving about
      // inside it afterwards isn't reaching it.
      if (
        moves &&
        event.target.matches(":focus-visible") &&
        !event.currentTarget.contains(event.relatedTarget)
      ) {
        setPlaying(false);
      }
    }

    function handlePointer(event: PointerEvent<HTMLDivElement>, over: boolean) {
      (over ? onPointerEnter : onPointerLeave)?.(event);
      // A finger is never over something it isn't pressing.
      if (event.pointerType !== "touch") setHeld(over);
    }

    const context = useMemo<CarouselContextValue>(
      () => ({
        viewportRef,
        orientation,
        index,
        count,
        canPrevious,
        canNext,
        previous,
        next,
        goTo,
        autoplay: moves,
        playing,
        setPlaying,
        contentId,
      }),
      [
        viewportRef,
        orientation,
        index,
        count,
        canPrevious,
        canNext,
        previous,
        next,
        goTo,
        moves,
        playing,
        contentId,
      ],
    );

    return (
      <CarouselContext.Provider value={context}>
        {/* biome-ignore lint/a11y/useSemanticElements: a section is a region only with a name, and this is one either way */}
        <div
          ref={useComposedRefs(ref, root)}
          role="region"
          aria-roledescription="carousel"
          data-orientation={orientation}
          className={cx("nuv-carousel", className)}
          onFocus={handleFocus}
          onPointerEnter={(event) => handlePointer(event, true)}
          onPointerLeave={(event) => handlePointer(event, false)}
          {...props}
        >
          {children}
          <span ref={status} role="status" className="nuv-carousel__status" />
        </div>
      </CarouselContext.Provider>
    );
  },
);

export type CarouselContentProps = HTMLAttributes<HTMLDivElement>;

/**
 * The window the slides are seen through, and the row of them behind it.
 * Put `CarouselItem`s in it. `ref` and the rest go on the row.
 */
export const CarouselContent = forwardRef<HTMLDivElement, CarouselContentProps>(
  function CarouselContent({ className, ...props }, ref) {
    const carousel = useCarousel("CarouselContent");
    return (
      <div ref={carousel.viewportRef} className="nuv-carousel__viewport">
        <div
          ref={ref}
          id={carousel.contentId}
          className={cx("nuv-carousel__content", className)}
          {...props}
        />
      </div>
    );
  },
);

export type CarouselItemProps = HTMLAttributes<HTMLDivElement>;

/**
 * One slide. A screen reader calls it "slide" and says which of how many
 * it is, unless you name it with `aria-label` or `aria-labelledby`.
 */
export const CarouselItem = forwardRef<HTMLDivElement, CarouselItemProps>(
  function CarouselItem(
    { "aria-label": label, "aria-labelledby": labelledBy, className, ...props },
    ref,
  ) {
    useCarousel("CarouselItem");
    const named = label !== undefined || labelledBy !== undefined;
    return (
      // biome-ignore lint/a11y/useSemanticElements: a fieldset is for the fields of a form
      <div
        ref={ref}
        role="group"
        aria-roledescription="slide"
        aria-label={label}
        aria-labelledby={labelledBy}
        // With a name of yours, the carousel leaves the name alone.
        data-named={named ? "" : undefined}
        className={cx("nuv-carousel__item", className)}
        {...props}
      />
    );
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

const arrow = (
  <svg
    aria-hidden="true"
    className="nuv-carousel__arrow"
    viewBox="0 0 16 16"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 3l5 5-5 5" />
  </svg>
);

export type CarouselPreviousProps = ButtonProps;

/**
 * The button that goes back a slide. It's disabled at the first slide of
 * a carousel that doesn't loop.
 */
export const CarouselPrevious = forwardRef<
  HTMLButtonElement,
  CarouselPreviousProps
>(function CarouselPrevious({ className, onClick, children, ...props }, ref) {
  const carousel = useCarousel("CarouselPrevious");
  return (
    <button
      ref={ref}
      type="button"
      aria-label={children ? undefined : "Previous slide"}
      aria-controls={carousel.contentId}
      disabled={!carousel.canPrevious}
      className={cx(
        "nuv-carousel__button",
        "nuv-carousel__button--previous",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) carousel.previous();
      }}
      {...props}
    >
      {children ?? arrow}
    </button>
  );
});

export type CarouselNextProps = ButtonProps;

/**
 * The button that goes on a slide. It's disabled at the last slide of a
 * carousel that doesn't loop.
 */
export const CarouselNext = forwardRef<HTMLButtonElement, CarouselNextProps>(
  function CarouselNext({ className, onClick, children, ...props }, ref) {
    const carousel = useCarousel("CarouselNext");
    return (
      <button
        ref={ref}
        type="button"
        aria-label={children ? undefined : "Next slide"}
        aria-controls={carousel.contentId}
        disabled={!carousel.canNext}
        className={cx(
          "nuv-carousel__button",
          "nuv-carousel__button--next",
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) carousel.next();
        }}
        {...props}
      >
        {children ?? arrow}
      </button>
    );
  },
);

export interface CarouselDotsOwnProps {
  /**
   * What a screen reader calls each dot, from its number and how many
   * there are.
   * @default "Go to slide 1", and so on
   */
  getDotLabel?: (index: number, count: number) => string;
}

export interface CarouselDotsProps
  extends CarouselDotsOwnProps,
    HTMLAttributes<HTMLDivElement> {}

/**
 * A dot for each stop, which goes to it when pressed. The one the carousel
 * is at is marked. Give it a name with `aria-label` in another language.
 */
export const CarouselDots = forwardRef<HTMLDivElement, CarouselDotsProps>(
  function CarouselDots(
    {
      getDotLabel,
      "aria-label": label = "Choose a slide",
      className,
      ...props
    },
    ref,
  ) {
    const carousel = useCarousel("CarouselDots");
    return (
      // biome-ignore lint/a11y/useSemanticElements: a fieldset is for the fields of a form
      <div
        ref={ref}
        role="group"
        aria-label={label}
        className={cx("nuv-carousel__dots", className)}
        {...props}
      >
        {Array.from({ length: carousel.count }, (_, at) => (
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: a dot is its place and nothing else
            key={at}
            type="button"
            aria-label={
              getDotLabel?.(at, carousel.count) ?? `Go to slide ${at + 1}`
            }
            aria-current={at === carousel.index ? "true" : undefined}
            aria-controls={carousel.contentId}
            className="nuv-carousel__dot"
            onClick={() => carousel.goTo(at)}
          />
        ))}
      </div>
    );
  },
);

export type CarouselThumbnailsProps = HTMLAttributes<HTMLDivElement>;

/**
 * A row of `CarouselThumbnail`s: small pictures of the slides to go to
 * them by. Give it a name with `aria-label` in another language.
 */
export const CarouselThumbnails = forwardRef<
  HTMLDivElement,
  CarouselThumbnailsProps
>(function CarouselThumbnails(
  { "aria-label": label = "Choose a slide", className, ...props },
  ref,
) {
  useCarousel("CarouselThumbnails");
  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset is for the fields of a form
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={cx("nuv-carousel__thumbnails", className)}
      {...props}
    />
  );
});

export interface CarouselThumbnailOwnProps {
  /** The stop it goes to, counted from 0. */
  index: number;
  /** What it shows: a small picture, most often. */
  children?: ReactNode;
}

export interface CarouselThumbnailProps
  extends CarouselThumbnailOwnProps,
    Omit<ButtonProps, "children"> {}

/**
 * A button that goes to one slide, and is marked while the carousel is
 * there. Name it with `aria-label`, or with the `alt` of a picture in it.
 */
export const CarouselThumbnail = forwardRef<
  HTMLButtonElement,
  CarouselThumbnailProps
>(function CarouselThumbnail({ index, className, onClick, ...props }, ref) {
  const carousel = useCarousel("CarouselThumbnail");
  return (
    <button
      ref={ref}
      type="button"
      aria-current={index === carousel.index ? "true" : undefined}
      aria-controls={carousel.contentId}
      className={cx("nuv-carousel__thumbnail", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) carousel.goTo(index);
      }}
      {...props}
    />
  );
});

export interface CarouselPlayPauseOwnProps {
  /**
   * What a screen reader calls the button, from whether the carousel is
   * moving by itself.
   * @default "Stop the slides moving" and "Start the slides moving"
   */
  getLabel?: (playing: boolean) => string;
}

export interface CarouselPlayPauseProps
  extends CarouselPlayPauseOwnProps,
    ButtonProps {}

/**
 * The button that stops a carousel with `autoplay` and starts it again.
 * Put it before the slides, so it's the first thing the keyboard reaches.
 * Without `autoplay` it draws nothing.
 */
export const CarouselPlayPause = forwardRef<
  HTMLButtonElement,
  CarouselPlayPauseProps
>(function CarouselPlayPause(
  { getLabel, className, onClick, children, ...props },
  ref,
) {
  const carousel = useCarousel("CarouselPlayPause");
  if (!carousel.autoplay) return null;
  const { playing } = carousel;
  return (
    <button
      ref={ref}
      type="button"
      aria-label={
        children
          ? undefined
          : (getLabel?.(playing) ??
            (playing ? "Stop the slides moving" : "Start the slides moving"))
      }
      data-playing={playing ? "" : undefined}
      className={cx("nuv-carousel__button", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) carousel.setPlaying(!playing);
      }}
      {...props}
    >
      {children ?? (
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill="currentColor"
        >
          {playing ? (
            <path d="M4 3h3v10H4zM9 3h3v10H9z" />
          ) : (
            <path d="M5 3l8 5-8 5z" />
          )}
        </svg>
      )}
    </button>
  );
});
