import { Badge, TextShimmer } from "@nuvui/react";
import type { CSSProperties } from "react";

/**
 * The word "New" beside a page's name, with a shine that crosses it twice
 * and then stops: something that goes on moving beside what's being read
 * needs a way to stop it, and this stops by itself. It's still from the
 * start for a visitor who asked for less motion.
 *
 * Which pages get it is lib/new-pages.ts. The space before it is so that
 * a screen reader says two words and not one.
 */
export function NewBadge() {
  return (
    <>
      {" "}
      <Badge
        variant="outline"
        data-new=""
        className="ms-1 align-middle text-[0.6875rem] leading-none"
      >
        <TextShimmer style={{ animationIterationCount: 2 } as CSSProperties}>
          New
        </TextShimmer>
      </Badge>
    </>
  );
}
