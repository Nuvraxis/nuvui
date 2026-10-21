import { GridBackground } from "@nuvui/backgrounds/grid-background";

// Dots where the lines would cross, in smaller cells, over the whole box.
export default function Example() {
  return (
    <GridBackground
      variant="dots"
      fade={false}
      className="grid min-h-64 w-full place-items-center rounded-lg p-8 [--nuv-grid-background-cell:1.25rem]"
    >
      <p className="m-0 text-2xl font-semibold">Drop files to upload</p>
    </GridBackground>
  );
}
