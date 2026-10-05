import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@nuvui/react";

const tools = [
  { name: "Bold", keys: "Ctrl+B", glyph: "B", weight: 700 },
  { name: "Italic", keys: "Ctrl+I", glyph: "I", weight: 400 },
  { name: "Underline", keys: "Ctrl+U", glyph: "U", weight: 400 },
];

export default function Example() {
  return (
    <TooltipProvider>
      {tools.map((tool) => (
        <Tooltip key={tool.name}>
          <TooltipTrigger asChild>
            <Button
              intent="secondary"
              aria-label={tool.name}
              style={{ fontWeight: tool.weight }}
            >
              {tool.glyph}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{tool.keys}</TooltipContent>
        </Tooltip>
      ))}
    </TooltipProvider>
  );
}
