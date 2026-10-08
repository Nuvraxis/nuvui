"use client";

import { Button } from "@nuvui/react/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@nuvui/react/dropdown-menu";
import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { isTheme, type Theme, themeKey } from "@/lib/theme";

const options = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

// The choice lives in localStorage and on <html>, not in React, so that the
// script in <head> and this control can't disagree. Other tabs, and the docs
// app, report a change through the storage event.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function read(): Theme {
  try {
    const stored = localStorage.getItem(themeKey);
    return isTheme(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function choose(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(themeKey, theme);
  } catch {
    // Storage is off. The choice holds for this page.
  }
  for (const listener of listeners) listener();
}

export function ThemeControl() {
  // The server can't know the choice, and draws the control as "system".
  const theme = useSyncExternalStore(subscribe, read, () => "system" as const);
  const current = options.find((option) => option.value === theme);
  const Icon = current?.Icon ?? Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          intent="ghost"
          size="sm"
          className="site-header__icon-button"
          aria-label={`Theme: ${current?.label ?? "System"}`}
        >
          <Icon aria-hidden="true" size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => {
            if (isTheme(value)) choose(value);
          }}
        >
          {options.map(({ value, label }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
