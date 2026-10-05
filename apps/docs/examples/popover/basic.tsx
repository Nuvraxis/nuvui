import {
  Button,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@nuvui/react";

export default function Example() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button intent="secondary">Share</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Share this page">
        <p style={{ margin: 0 }}>Anyone with the link can view this page.</p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBlockStart: 12,
          }}
        >
          <PopoverClose asChild>
            <Button size="sm">Done</Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
}
