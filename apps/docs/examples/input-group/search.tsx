"use client";

import {
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@nuvui/react";
import { useRef, useState } from "react";

export default function Example() {
  const [query, setQuery] = useState("invoices");
  const input = useRef<HTMLInputElement>(null);

  return (
    <InputGroup style={{ maxInlineSize: 360 }}>
      <InputGroupAddon>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5L14 14" />
        </svg>
      </InputGroupAddon>
      <Input
        ref={input}
        aria-label="Search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {query ? (
        <InputGroupButton
          aria-label="Clear search"
          onClick={() => {
            setQuery("");
            input.current?.focus();
          }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M3.5 3.5l9 9m0-9l-9 9" />
          </svg>
        </InputGroupButton>
      ) : null}
    </InputGroup>
  );
}
