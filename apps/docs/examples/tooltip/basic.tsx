import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@nuvui/react";

export default function Example() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button intent="secondary">Archive</Button>
      </TooltipTrigger>
      <TooltipContent>
        Takes the project out of your list. You can bring it back later.
      </TooltipContent>
    </Tooltip>
  );
}
