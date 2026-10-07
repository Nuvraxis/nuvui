import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
} from "@nuvui/react";

export default function Example() {
  return (
    <Combobox>
      <ComboboxTrigger aria-label="Assignee">
        <ComboboxValue placeholder="Assign to" />
      </ComboboxTrigger>
      <ComboboxContent label="Search people" searchPlaceholder="Search">
        <ComboboxEmpty>Nobody by that name.</ComboboxEmpty>
        <ComboboxGroup heading="Design">
          <ComboboxItem value="Ada Okafor">Ada Okafor</ComboboxItem>
          <ComboboxItem value="Mei Tanaka">Mei Tanaka</ComboboxItem>
        </ComboboxGroup>
        <ComboboxSeparator />
        <ComboboxGroup heading="Engineering">
          <ComboboxItem value="José Álvarez">José Álvarez</ComboboxItem>
          <ComboboxItem value="Priya Nair">Priya Nair</ComboboxItem>
          <ComboboxItem value="Tom Becker" disabled>
            Tom Becker
          </ComboboxItem>
        </ComboboxGroup>
      </ComboboxContent>
    </Combobox>
  );
}
