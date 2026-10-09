import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from "@nuvui/react";
import type { ReactNode } from "react";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export default function Example() {
  return (
    <Toolbar aria-label="Formatting">
      <ToolbarButton aria-label="Undo">
        <Icon>
          <path d="M3 6h7a3.5 3.5 0 010 7H6M3 6l3-3M3 6l3 3" />
        </Icon>
      </ToolbarButton>
      <ToolbarButton aria-label="Redo" disabled>
        <Icon>
          <path d="M13 6H6a3.5 3.5 0 000 7h4M13 6l-3-3M13 6l-3 3" />
        </Icon>
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarToggleGroup type="multiple" aria-label="Text style">
        <ToolbarToggleItem value="bold" aria-label="Bold">
          <Icon>
            <path d="M4.5 3h4a2.5 2.5 0 010 5h-4zm0 5h4.5a2.5 2.5 0 010 5H4.5z" />
          </Icon>
        </ToolbarToggleItem>
        <ToolbarToggleItem value="italic" aria-label="Italic">
          <Icon>
            <path d="M6.5 3h5M4.5 13h5M9.5 3l-3 10" />
          </Icon>
        </ToolbarToggleItem>
        <ToolbarToggleItem value="underline" aria-label="Underline">
          <Icon>
            <path d="M4.5 3v4.5a3.5 3.5 0 007 0V3M4 13.5h8" />
          </Icon>
        </ToolbarToggleItem>
      </ToolbarToggleGroup>
    </Toolbar>
  );
}
