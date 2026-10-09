import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@nuvui/react";

const timeZones = [
  "Africa/Lagos",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/Berlin",
  "Europe/London",
  "Pacific/Auckland",
];

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label htmlFor="time-zone">Time zone</label>
      <Combobox defaultValue="Europe/Berlin">
        <ComboboxTrigger id="time-zone">
          <ComboboxValue placeholder="Pick a time zone" />
        </ComboboxTrigger>
        <ComboboxContent
          aria-label="Time zone"
          label="Search time zones"
          searchPlaceholder="Search"
        >
          <ComboboxEmpty>No time zone found.</ComboboxEmpty>
          {timeZones.map((zone) => (
            <ComboboxItem key={zone} value={zone}>
              {zone}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
