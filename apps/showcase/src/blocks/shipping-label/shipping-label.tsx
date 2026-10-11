"use client";

import { Barcode, QRCode, saveCode } from "@nuvui/barcodes";
import { Button } from "@nuvui/react";
import { useRef, useState } from "react";
import "./shipping-label.scss";

// A made-up parcel, between made-up people at made-up addresses.
const parcel = {
  id: "7781",
  tracking: "NV7781204563",
  service: "Express, next working day",
  weight: "2.4 kg",
  pieces: "1 of 1",
  from: [
    "Northwind Supply",
    "14 Canal Street",
    "Leeds LS1 4AB",
    "United Kingdom",
  ],
  to: [
    "Ada Lovelace",
    "Contoso Labs",
    "221 Harbour Road",
    "Bristol BS1 5TT",
    "United Kingdom",
  ],
};
const page = `https://example.com/track/${parcel.tracking}`;

export default function ShippingLabel() {
  const barcode = useRef<SVGSVGElement>(null);
  const [said, setSaid] = useState("");

  async function save(format: "svg" | "png") {
    if (!barcode.current) return;
    const name = `parcel-${parcel.id}`;
    await saveCode(barcode.current, { name, format });
    setSaid(`Saved the barcode as ${name}.${format}.`);
  }

  return (
    <main className="shipping-label">
      <header className="shipping-label__head">
        <div className="shipping-label__about">
          <h1 className="shipping-label__title">Parcel {parcel.id}</h1>
          <p className="shipping-label__text">
            Ready to print. The barcode is the tracking number.
          </p>
        </div>
        <div className="shipping-label__actions">
          <Button intent="secondary" onClick={() => save("svg")}>
            Save barcode as SVG
          </Button>
          <Button intent="secondary" onClick={() => save("png")}>
            Save barcode as PNG
          </Button>
        </div>
      </header>
      <p className="shipping-label__said" role="status">
        {said}
      </p>

      <article className="shipping-label__label" aria-label="Label">
        <div className="shipping-label__row">
          <section className="shipping-label__party">
            <h2 className="shipping-label__heading">From</h2>
            <address className="shipping-label__address">
              {parcel.from.map((line) => (
                <span key={line} className="shipping-label__line">
                  {line}
                </span>
              ))}
            </address>
          </section>
          <dl className="shipping-label__facts">
            <div className="shipping-label__fact">
              <dt className="shipping-label__heading">Service</dt>
              <dd className="shipping-label__value">{parcel.service}</dd>
            </div>
            <div className="shipping-label__fact">
              <dt className="shipping-label__heading">Weight</dt>
              <dd className="shipping-label__value">{parcel.weight}</dd>
            </div>
            <div className="shipping-label__fact">
              <dt className="shipping-label__heading">Piece</dt>
              <dd className="shipping-label__value">{parcel.pieces}</dd>
            </div>
          </dl>
        </div>

        <section className="shipping-label__party shipping-label__party--to">
          <h2 className="shipping-label__heading">To</h2>
          <address className="shipping-label__address shipping-label__address--to">
            {parcel.to.map((line) => (
              <span key={line} className="shipping-label__line">
                {line}
              </span>
            ))}
          </address>
        </section>

        <div className="shipping-label__codes">
          <Barcode
            ref={barcode}
            value={parcel.tracking}
            height={72}
            aria-label={`Tracking number ${parcel.tracking}`}
          />
          <div className="shipping-label__track">
            <QRCode
              value={page}
              size={96}
              quietZone={2}
              aria-label="Tracking page for this parcel"
            />
            {/* The code is never the only way to the page. */}
            <a className="shipping-label__link" href={page}>
              Track this parcel
            </a>
          </div>
        </div>
      </article>
    </main>
  );
}
