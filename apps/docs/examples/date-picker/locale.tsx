"use client";

import { DatePicker } from "@nuvui/date-picker";
import { de } from "@nuvui/date-picker/locale";
import { Label } from "@nuvui/react";

export default function Example() {
  return (
    <div
      lang="de"
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 280,
      }}
    >
      <Label htmlFor="picker-termin">Termin</Label>
      <DatePicker
        id="picker-termin"
        locale={de}
        placeholder="TT.MM.JJJJ"
        calendarLabel="Datum wählen"
        title="Datum wählen"
        closeLabel="Schließen"
        invalidMessage="Geben Sie ein gültiges Datum ein."
      />
    </div>
  );
}
