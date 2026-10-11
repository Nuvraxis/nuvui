"use client";

import { Message, MessageContent, MessageLoader } from "@nuvui/chat";
import { Button } from "@nuvui/react";
import { useEffect, useRef, useState } from "react";

const words =
  "Revenue for March was 48,200, up 8% on February. Most of the rise came from three new customers on the Team plan.".split(
    " ",
  );

export default function Example() {
  // How many words have arrived. None yet is the wait before a reply.
  const [count, setCount] = useState(words.length);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => () => clearInterval(timer.current), []);

  function again() {
    clearInterval(timer.current);
    setCount(0);
    timer.current = setInterval(() => {
      setCount((now) => {
        if (now + 1 >= words.length) clearInterval(timer.current);
        return Math.min(now + 1, words.length);
      });
    }, 150);
  }

  const streaming = count < words.length;

  return (
    <div
      style={{
        display: "grid",
        gap: "1rem",
        justifyItems: "start",
        inlineSize: "100%",
        maxInlineSize: 520,
      }}
    >
      <Message from="assistant" streaming={streaming}>
        {count === 0 ? (
          <MessageLoader />
        ) : (
          <MessageContent>{words.slice(0, count).join(" ")}</MessageContent>
        )}
      </Message>
      <Button intent="secondary" disabled={streaming} onClick={again}>
        Reply again
      </Button>
    </div>
  );
}
