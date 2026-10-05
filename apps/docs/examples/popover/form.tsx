import {
  Button,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@nuvui/react";

const field = {
  inlineSize: "100%",
  minBlockSize: 44,
  paddingInline: 12,
  border: "1px solid var(--color-border-strong)",
  borderRadius: "var(--radius-md)",
  backgroundColor: "var(--color-surface)",
  color: "inherit",
  // 16px keeps iOS from zooming in when the field takes focus.
  fontSize: 16,
};

export default function Example() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button intent="secondary">Rename</Button>
      </PopoverTrigger>
      <PopoverContent aria-labelledby="rename-title" align="start">
        <div style={{ display: "grid", gap: 12 }}>
          <label id="rename-title" htmlFor="rename-name">
            Project name
          </label>
          <input id="rename-name" defaultValue="Website" style={field} />
          <PopoverClose asChild>
            <Button size="sm">Save</Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
}
