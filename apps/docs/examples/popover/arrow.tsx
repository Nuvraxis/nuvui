import { Button, Popover, PopoverContent, PopoverTrigger } from "@nuvui/react";

export default function Example() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button intent="secondary">Storage</Button>
      </PopoverTrigger>
      <PopoverContent showArrow aria-label="Storage used">
        7.2 GB of 10 GB used. Files in the trash count until it's emptied.
      </PopoverContent>
    </Popover>
  );
}
