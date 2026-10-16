import { Compare } from "@nuvui/react";
import { Check } from "lucide-react";
import "./before-after.scss";

// Said in words as well, since the pictures can't be seen by everyone.
const changes = [
  "One list of reports, in place of three menus",
  "The figures that matter first, in large type",
  "The month as a chart, beside them",
];

// Stand-ins for two screenshots, drawn from the theme. Your own go in
// their place, as an img each with its own alt.
function OldScreen() {
  return (
    <div
      role="img"
      aria-label="Acme Reports 2: a long table under three rows of menus"
      className="before-after__screen before-after__screen--old"
    >
      <span className="before-after__menu" />
      <span className="before-after__menu" />
      <span className="before-after__menu" />
      {Array.from({ length: 7 }, (_, row) => (
        <span key={row} className="before-after__row" />
      ))}
    </div>
  );
}

function NewScreen() {
  return (
    <div
      role="img"
      aria-label="Acme Reports 3: three figures in cards, and a bar chart of the month"
      className="before-after__screen before-after__screen--new"
    >
      <span className="before-after__card" />
      <span className="before-after__card" />
      <span className="before-after__card" />
      <span className="before-after__chart">
        {Array.from({ length: 7 }, (_, bar) => (
          <span key={bar} className="before-after__bar" />
        ))}
      </span>
    </div>
  );
}

export default function BeforeAfter() {
  return (
    <section className="before-after" aria-labelledby="before-after-title">
      <div className="before-after__text">
        <p className="before-after__eyebrow">Acme Reports 3.0</p>
        <h2 className="before-after__title" id="before-after-title">
          The same reports, a lot less looking
        </h2>
        <p className="before-after__lead">
          Drag the line across to see what the first screen looked like before
          this release, and what it looks like now.
        </p>
        <ul className="before-after__changes">
          {changes.map((change) => (
            <li key={change} className="before-after__change">
              <Check aria-hidden="true" size={18} />
              {change}
            </li>
          ))}
        </ul>
      </div>
      <Compare
        className="before-after__compare"
        beforeLabel="Version 2"
        afterLabel="Version 3"
        dividerLabel="Version 2 and version 3"
        before={<OldScreen />}
        after={<NewScreen />}
      />
    </section>
  );
}
