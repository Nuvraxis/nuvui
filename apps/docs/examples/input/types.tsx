import { Input, Label } from "@nuvui/react";

const field = { display: "grid", gap: 6 };

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 20,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <div style={field}>
        <Label htmlFor="type-email">Email</Label>
        <Input id="type-email" type="email" autoComplete="email" />
      </div>
      <div style={field}>
        <Label htmlFor="type-number">Seats</Label>
        <Input
          id="type-number"
          type="number"
          min={1}
          max={50}
          defaultValue={5}
        />
      </div>
      <div style={field}>
        <Label htmlFor="type-date">Start date</Label>
        <Input id="type-date" type="date" />
      </div>
      <div style={field}>
        <Label htmlFor="type-search">Search</Label>
        <Input id="type-search" type="search" placeholder="Invoices, people" />
      </div>
      <div style={field}>
        <Label htmlFor="type-file">Logo</Label>
        <Input id="type-file" type="file" accept="image/*" />
      </div>
    </div>
  );
}
