"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxLoading,
  ComboboxTrigger,
  ComboboxValue,
} from "@nuvui/react";
import { useEffect, useState } from "react";

const customers = [
  "Acme Corporation",
  "Blue Harbor Logistics",
  "Cedar & Stone",
  "Delta Freight",
  "Evergreen Health",
  "Fjord Analytics",
  "Globex",
  "Harbor Light Media",
];

// Stands in for a request to your server.
function searchCustomers(text: string): Promise<string[]> {
  const matches = customers.filter((name) =>
    name.toLowerCase().includes(text.toLowerCase()),
  );
  return new Promise((resolve) => setTimeout(() => resolve(matches), 600));
}

export default function Example() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    setLoading(true);
    searchCustomers(search).then((matches) => {
      // An answer to an older search can arrive after a newer one.
      if (!current) return;
      setResults(matches);
      setLoading(false);
    });
    return () => {
      current = false;
    };
  }, [search]);

  return (
    <Combobox>
      <ComboboxTrigger aria-label="Customer">
        <ComboboxValue placeholder="Pick a customer" />
      </ComboboxTrigger>
      <ComboboxContent
        label="Search customers"
        searchPlaceholder="Search"
        search={search}
        onSearchChange={setSearch}
        // The server has already done the filtering.
        shouldFilter={false}
      >
        {loading ? <ComboboxLoading label="Loading customers" /> : null}
        <ComboboxEmpty>No customer found.</ComboboxEmpty>
        {loading
          ? null
          : results.map((name) => (
              <ComboboxItem key={name} value={name}>
                {name}
              </ComboboxItem>
            ))}
      </ComboboxContent>
    </Combobox>
  );
}
