import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@nuvui/react";

const sides = ["top", "right", "bottom", "left"] as const;

export default function Example() {
  return (
    <TooltipProvider>
      {sides.map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger asChild>
            <Button intent="secondary">{side}</Button>
          </TooltipTrigger>
          <TooltipContent side={side}>Opens on the {side}</TooltipContent>
        </Tooltip>
      ))}
    </TooltipProvider>
  );
}
