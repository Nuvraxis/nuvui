"use client";

import { Button } from "@nuvui/react/button";
import { VisuallyHidden } from "@nuvui/react/visually-hidden";
import { Check, Copy, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type State = "idle" | "copied" | "failed";

const said: Record<State, string> = {
  idle: "",
  copied: "Copied",
  failed: "Couldn't copy",
};

interface CopyButtonProps {
  /** What goes on the clipboard. */
  code: string;
  /** The button's name, which says whose code it is. */
  label: string;
  /** Shows the word next to the icon. Without it the button is the icon. */
  text?: boolean;
}

export function CopyButton({ code, label, text = false }: CopyButtonProps) {
  const [state, setState] = useState<State>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      // Refused on a page that isn't served securely, and by a browser
      // that's been told not to allow it.
      await navigator.clipboard.writeText(code);
      setState("copied");
    } catch {
      setState("failed");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  };

  const Icon = state === "copied" ? Check : state === "failed" ? X : Copy;

  return (
    <>
      <Button
        intent={text ? "secondary" : "ghost"}
        size="sm"
        className={text ? undefined : "site-chart__icon-button"}
        aria-label={label}
        data-state={state}
        onClick={copy}
      >
        <Icon aria-hidden="true" size={16} />
        {text ? (state === "idle" ? "Copy" : said[state]) : null}
      </Button>
      {/* The icon changing says nothing to a screen reader. This does. */}
      <VisuallyHidden role="status">{said[state]}</VisuallyHidden>
    </>
  );
}
