"use client";

import { type ModelInfo, ModelViewer } from "@nuvui/3d";
import {
  Button,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  FileUpload,
  Label,
  NativeSelect,
  NumberField,
  Slider,
} from "@nuvui/react";
import { useState } from "react";
import "./print-order.scss";

// The prices are made-up example data, for a print shop that charges by
// the material a part takes and a fee for each order.
const materials = [
  { id: "pla", name: "PLA", perCm3: 0.12, note: "Rigid, for parts indoors" },
  { id: "petg", name: "PETG", perCm3: 0.16, note: "Tougher, takes some heat" },
  {
    id: "nylon",
    name: "Nylon",
    perCm3: 0.38,
    note: "Strong and a little flexible",
  },
];
const setupFee = 4;

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const millimeters = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

export default function PrintOrder() {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [material, setMaterial] = useState("pla");
  const [scale, setScale] = useState(100);
  const [quantity, setQuantity] = useState<number | null>(1);

  const chosen = materials.find((item) => item.id === material) ?? materials[0];
  const factor = scale / 100;
  // An STL's units are millimeters. The volume grows with the cube of
  // the scale.
  const cm3 = info ? (info.volume * factor ** 3) / 1000 : 0;
  const each = cm3 * (chosen?.perCm3 ?? 0);
  const total = info ? each * (quantity ?? 0) + setupFee : 0;

  return (
    <div className="print-order">
      <header className="print-order__head">
        <h1 className="print-order__title">Order a 3D print</h1>
        <p className="print-order__lead">
          Upload an STL to see it before it's printed, and get a price from how
          much material it takes.
        </p>
      </header>

      <div className="print-order__body">
        <div className="print-order__model">
          <Label htmlFor="print-order-file">Your part</Label>
          <FileUpload
            id="print-order-file"
            accept=".stl"
            onFilesChange={(files) => {
              setFile(files[0] ?? null);
              setInfo(null);
            }}
          >
            Drop an STL file here, or choose one. Until then, here's our
            bracket.
          </FileUpload>
          <ModelViewer
            className="print-order__viewer"
            label={file ? file.name : "L-shaped bracket"}
            src={file ?? "/models/bracket.stl"}
            onLoad={setInfo}
            onError={() => setInfo(null)}
          />
          {info && (
            <p className="print-order__size">
              {info.size
                .map((side) => millimeters.format(side * factor))
                .join(" × ")}{" "}
              mm at {scale}%
            </p>
          )}
        </div>

        <form
          className="print-order__form"
          aria-labelledby="print-order-options"
          onSubmit={(event) => event.preventDefault()}
        >
          <h2 id="print-order-options" className="print-order__heading">
            Print
          </h2>

          <Field>
            <FieldLabel>Material</FieldLabel>
            <FieldControl>
              <NativeSelect
                value={material}
                onChange={(event) => setMaterial(event.target.value)}
              >
                {materials.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}, {money.format(item.perCm3)} a cm³
                  </option>
                ))}
              </NativeSelect>
            </FieldControl>
            <FieldDescription>{chosen?.note}</FieldDescription>
          </Field>

          <div className="print-order__scale">
            <Label id="print-order-scale-label">Scale: {scale}%</Label>
            <Slider
              aria-labelledby="print-order-scale-label"
              min={25}
              max={200}
              step={5}
              value={[scale]}
              onValueChange={([value]) => setScale(value ?? 100)}
              getValueLabel={(value) => `${value}%`}
            />
          </div>

          <Field>
            <FieldLabel>Quantity</FieldLabel>
            <FieldControl>
              <NumberField
                min={1}
                max={500}
                value={quantity}
                onValueChange={setQuantity}
              />
            </FieldControl>
          </Field>

          <dl className="print-order__estimate">
            <div className="print-order__line">
              <dt>Material for each</dt>
              <dd>{info ? `${millimeters.format(cm3)} cm³` : "Not yet"}</dd>
            </div>
            <div className="print-order__line">
              <dt>Each</dt>
              <dd>{info ? money.format(each) : "Not yet"}</dd>
            </div>
            <div className="print-order__line">
              <dt>Setting up</dt>
              <dd>{money.format(setupFee)}</dd>
            </div>
            <div className="print-order__line print-order__line--total">
              <dt>Estimate</dt>
              <dd aria-live="polite">
                {info ? money.format(total) : "Not yet"}
              </dd>
            </div>
          </dl>

          <Button type="submit" size="lg" disabled={!info || !quantity}>
            Order {quantity ?? 0} {quantity === 1 ? "print" : "prints"}
          </Button>
        </form>
      </div>
    </div>
  );
}
