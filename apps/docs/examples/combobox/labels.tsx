"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@nuvui/react";
import { useState } from "react";

const countries = [
  { code: "BR", name: "Brazil" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "DE", name: "Germany" },
  { code: "IN", name: "India" },
  { code: "JP", name: "Japan" },
  { code: "MX", name: "México" },
  { code: "NG", name: "Nigeria" },
  { code: "SE", name: "Sweden" },
];

export default function Example() {
  const [code, setCode] = useState("");
  const country = countries.find((item) => item.code === code);

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label htmlFor="country">Country</label>
      <Combobox value={code} onValueChange={setCode} name="country">
        <ComboboxTrigger id="country">
          <ComboboxValue placeholder="Pick a country">
            {country?.name}
          </ComboboxValue>
        </ComboboxTrigger>
        <ComboboxContent
          aria-label="Country"
          label="Search countries"
          searchPlaceholder="Search"
        >
          <ComboboxEmpty>No country found.</ComboboxEmpty>
          {countries.map((item) => (
            <ComboboxItem key={item.code} value={item.code}>
              {item.name}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
      <output style={{ fontSize: 14 }}>
        {code ? `The form gets "${code}".` : "Nothing picked yet."}
      </output>
    </div>
  );
}
