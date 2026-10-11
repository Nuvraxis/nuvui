"use client";

import {
  Barcode,
  type BarcodeType,
  barcodeTypes,
  QRCode,
  type QRCodeErrorCorrection,
} from "@nuvui/barcodes";
import { useState } from "react";
import {
  CheckboxControl,
  Playground,
  SelectControl,
  TextControl,
} from "./controls";

// A value each kind takes, put in the field when the kind is chosen.
const samples: Record<BarcodeType, string> = {
  code128: "ORD-2026-001042",
  "gs1-128": "0109501101530003",
  code39: "PART-4410",
  "code39-mod43": "PART-4410",
  ean13: "590123412345",
  ean8: "9638507",
  upca: "12345678901",
  upce: "01234565",
  itf: "123456",
  itf14: "1234567890123",
  msi: "1234",
  "msi-mod10": "1234",
  "msi-mod11": "1234",
  "msi-mod1010": "1234",
  "msi-mod1110": "1234",
  codabar: "A40156B",
  pharmacode: "1234",
};

export function BarcodePlayground() {
  const [type, setType] = useState<BarcodeType>("code128");
  const [value, setValue] = useState(samples.code128);
  const [showText, setShowText] = useState(true);

  const code = `<Barcode${type === "code128" ? "" : ` type="${type}"`} value=${JSON.stringify(
    value,
  )}${showText ? "" : " showText={false}"} />`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="type"
            value={type}
            options={barcodeTypes}
            onChange={(next) => {
              setType(next);
              setValue(samples[next]);
            }}
          />
          <TextControl label="value" value={value} onChange={setValue} />
          <CheckboxControl
            label="showText"
            checked={showText}
            onChange={setShowText}
          />
        </>
      }
    >
      <Barcode
        type={type}
        value={value}
        showText={showText}
        aria-label={`A barcode holding ${value}`}
      />
    </Playground>
  );
}

const levels = ["L", "M", "Q", "H"] as const;

export function QRCodePlayground() {
  const [value, setValue] = useState("https://nuvui.nuvraxis.com/docs");
  const [level, setLevel] = useState<QRCodeErrorCorrection>("M");
  const [quiet, setQuiet] = useState(true);

  const code = `<QRCode value=${JSON.stringify(value)}${
    level === "M" ? "" : ` errorCorrection="${level}"`
  }${quiet ? "" : " quietZone={0}"} />`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <TextControl label="value" value={value} onChange={setValue} />
          <SelectControl
            label="errorCorrection"
            value={level}
            options={levels}
            onChange={setLevel}
          />
          <CheckboxControl
            label="quietZone"
            checked={quiet}
            onChange={setQuiet}
          />
        </>
      }
    >
      <QRCode
        value={value}
        errorCorrection={level}
        quietZone={quiet ? 4 : 0}
        aria-label={`A QR code holding ${value}`}
      />
    </Playground>
  );
}
