"use client";

import { FormattedNumber, type FormattedNumberProps } from "@nuvui/react";
import { useState } from "react";
import {
  CheckboxControl,
  Playground,
  SelectControl,
  TextControl,
} from "./controls";

type Format = NonNullable<FormattedNumberProps["format"]>;

const formats = Object.keys({
  decimal: true,
  percent: true,
  currency: true,
} satisfies Record<Format, true>) as Format[];

const locales = ["en-US", "en-GB", "de-DE", "fr-FR", "es-MX", "ja-JP", "en-IN"];

export function FormattedNumberPlayground() {
  const [text, setText] = useState("1234567.891");
  const [locale, setLocale] = useState("en-US");
  const [format, setFormat] = useState<Format>("decimal");
  const [compact, setCompact] = useState(false);

  // Whatever is typed, the component gets a number.
  const parsed = Number(text);
  const value = Number.isFinite(parsed) ? parsed : 0;

  const props = [
    `value={${value}}`,
    locale !== "en-US" && `locale="${locale}"`,
    format === "percent" && 'format="percent"',
    format === "currency" && 'currency="USD"',
    compact && "compact",
  ].filter(Boolean);
  const code = `<FormattedNumber ${props.join(" ")} />`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <TextControl label="value" value={text} onChange={setText} />
          <SelectControl
            label="locale"
            value={locale}
            options={locales}
            onChange={setLocale}
          />
          <SelectControl
            label="format"
            value={format}
            options={formats}
            onChange={setFormat}
          />
          <CheckboxControl
            label="compact"
            checked={compact}
            onChange={setCompact}
          />
        </>
      }
    >
      <FormattedNumber
        value={value}
        locale={locale}
        format={format === "currency" ? undefined : format}
        currency={format === "currency" ? "USD" : undefined}
        compact={compact}
      />
    </Playground>
  );
}
