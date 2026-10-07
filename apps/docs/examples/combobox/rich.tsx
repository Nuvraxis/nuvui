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

const people = [
  { id: "u_1", name: "Ada Okafor", email: "ada@example.com", team: "design" },
  { id: "u_2", name: "José Álvarez", email: "jose@example.com", team: "api" },
  { id: "u_3", name: "Mei Tanaka", email: "mei@example.com", team: "design" },
  { id: "u_4", name: "Priya Nair", email: "priya@example.com", team: "web" },
];

export default function Example() {
  const [id, setId] = useState("u_2");
  const person = people.find((item) => item.id === id);

  return (
    <Combobox value={id} onValueChange={setId}>
      <ComboboxTrigger aria-label="Owner">
        <ComboboxValue placeholder="Pick an owner">
          {person?.name}
        </ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent label="Search people" searchPlaceholder="Name or team">
        <ComboboxEmpty>Nobody found.</ComboboxEmpty>
        {people.map((item) => (
          <ComboboxItem
            key={item.id}
            value={item.id}
            textValue={item.name}
            keywords={[item.email, item.team]}
          >
            <span style={{ display: "grid" }}>
              <span>{item.name}</span>
              <span style={{ fontSize: 12 }}>{item.email}</span>
            </span>
          </ComboboxItem>
        ))}
      </ComboboxContent>
    </Combobox>
  );
}
