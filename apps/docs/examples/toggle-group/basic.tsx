import { ToggleGroup, ToggleGroupItem } from "@nuvui/react";

export default function Example() {
  return (
    <ToggleGroup type="single" aria-label="View" defaultValue="list">
      <ToggleGroupItem value="list">List</ToggleGroupItem>
      <ToggleGroupItem value="board">Board</ToggleGroupItem>
      <ToggleGroupItem value="calendar">Calendar</ToggleGroupItem>
    </ToggleGroup>
  );
}
