"use client";

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from "@nuvui/react";
import { useEffect, useState } from "react";

const orders = [
  "10248 · Acme Corporation",
  "10249 · Blue Harbor Logistics",
  "10250 · Cedar & Stone",
  "10251 · Delta Freight",
  "10252 · Evergreen Health",
];

// Stands in for a request to your server.
function searchOrders(text: string): Promise<string[]> {
  const matches = orders.filter((order) =>
    order.toLowerCase().includes(text.toLowerCase()),
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
    searchOrders(search).then((matches) => {
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
    <Command
      label="Search orders"
      // The server has already done the filtering.
      shouldFilter={false}
      style={{
        inlineSize: "100%",
        maxInlineSize: 420,
        border: "1px solid var(--color-border)",
      }}
    >
      <CommandInput
        placeholder="Order number or customer"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {loading ? <CommandLoading label="Loading orders" /> : null}
        <CommandEmpty>No order found.</CommandEmpty>
        {loading
          ? null
          : results.map((order) => (
              <CommandItem key={order}>{order}</CommandItem>
            ))}
      </CommandList>
    </Command>
  );
}
