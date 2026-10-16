// Pictures drawn for these examples and kept in the file, so they don't
// depend on another site. Use your own photos or screenshots in their place.
const picture = (body: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">${body}</svg>`,
  )}`;

// The same kitchen, before and after. The window is in the same place in
// both, so the eye has something to hold on to as the divider moves.
const pane = `
  <rect x="470" y="110" width="120" height="190" fill="#f8fafc"/>
  <rect x="482" y="122" width="96" height="166" fill="#bfdbfe"/>
  <rect x="528" y="122" width="4" height="166" fill="#f8fafc"/>`;

export const kitchenBefore = picture(`
  <rect width="800" height="500" fill="#d6d3cc"/>
  <rect y="380" width="800" height="120" fill="#9a9a96"/>
  ${pane}
  <rect x="60" y="90" width="300" height="110" fill="#cfc4b0"/>
  <path d="M160 90v110M260 90v110" stroke="#b5a88f" stroke-width="3"/>
  <rect x="40" y="270" width="360" height="16" fill="#e5e2dc"/>
  <rect x="40" y="286" width="360" height="110" fill="#c9b79c"/>
  <path d="M130 286v110M220 286v110M310 286v110" stroke="#ad9a7d" stroke-width="3"/>
  <circle cx="400" cy="40" r="10" fill="#fef9c3"/>
  <path d="M400 0v30" stroke="#57534e" stroke-width="2"/>`);

export const kitchenAfter = picture(`
  <rect width="800" height="500" fill="#efe7dc"/>
  <rect y="380" width="800" height="120" fill="#d6d0c6"/>
  <path d="M0 440h800M200 380v120M400 380v120M600 380v120" stroke="#c4bdb1" stroke-width="2"/>
  ${pane}
  <rect x="620" y="60" width="180" height="330" fill="#8a5a3b"/>
  <path d="M710 60v330M620 220h180" stroke="#6f4630" stroke-width="3"/>
  <rect x="40" y="270" width="380" height="14" fill="#fafaf9"/>
  <rect x="40" y="284" width="380" height="106" fill="#9c6644"/>
  <path d="M135 284v106M230 284v106M325 284v106" stroke="#7c4f34" stroke-width="3"/>
  <path d="M260 0v120" stroke="#1c1917" stroke-width="3"/>
  <path d="M232 150a28 28 0 0 1 56 0z" fill="#1c1917"/>
  <rect x="80" y="226" width="34" height="44" rx="4" fill="#e7e5e4"/>
  <circle cx="97" cy="206" r="26" fill="#4d7c0f"/>
  <circle cx="80" cy="220" r="16" fill="#65a30d"/>`);

// A screen of an app, before a redesign and after it.
export const dashboardBefore = picture(`
  <rect width="800" height="500" fill="#e5e7eb"/>
  <rect width="800" height="56" fill="#9ca3af"/>
  <rect x="24" y="20" width="120" height="16" fill="#f3f4f6"/>
  <rect y="56" width="160" height="444" fill="#d1d5db"/>
  <path d="M24 100h112M24 140h112M24 180h112M24 220h112" stroke="#9ca3af" stroke-width="10"/>
  <rect x="184" y="80" width="592" height="396" fill="#f9fafb"/>
  <path d="M184 128h592M184 176h592M184 224h592M184 272h592M184 320h592M184 368h592M184 416h592" stroke="#d1d5db" stroke-width="2"/>
  <path d="M208 104h120M208 152h160M208 200h140M208 248h170M208 296h120M208 344h150M208 392h130" stroke="#6b7280" stroke-width="8"/>
  <path d="M560 152h80M560 200h60M560 248h90M560 296h70M560 344h80M560 392h50" stroke="#9ca3af" stroke-width="8"/>`);

export const dashboardAfter = picture(`
  <rect width="800" height="500" fill="#f8fafc"/>
  <rect width="180" height="500" fill="#1e293b"/>
  <rect x="24" y="28" width="96" height="16" rx="8" fill="#e2e8f0"/>
  <rect x="16" y="84" width="148" height="32" rx="8" fill="#334155"/>
  <path d="M32 100h80M32 148h96M32 188h72M32 228h88" stroke="#94a3b8" stroke-width="8" stroke-linecap="round"/>
  <rect x="204" y="28" width="572" height="40" rx="10" fill="#ffffff"/>
  <rect x="204" y="88" width="176" height="96" rx="12" fill="#ffffff"/>
  <rect x="402" y="88" width="176" height="96" rx="12" fill="#ffffff"/>
  <rect x="600" y="88" width="176" height="96" rx="12" fill="#ffffff"/>
  <path d="M224 116h64M422 116h80M620 116h56" stroke="#94a3b8" stroke-width="8" stroke-linecap="round"/>
  <path d="M224 152h100M422 152h88M620 152h120" stroke="#0f172a" stroke-width="16" stroke-linecap="round"/>
  <rect x="204" y="204" width="572" height="272" rx="12" fill="#ffffff"/>
  <g fill="#6366f1">
    <rect x="244" y="356" width="40" height="88" rx="6"/>
    <rect x="314" y="316" width="40" height="128" rx="6"/>
    <rect x="384" y="336" width="40" height="108" rx="6"/>
    <rect x="454" y="276" width="40" height="168" rx="6"/>
    <rect x="524" y="296" width="40" height="148" rx="6"/>
    <rect x="594" y="246" width="40" height="198" rx="6"/>
    <rect x="664" y="266" width="40" height="178" rx="6"/>
  </g>`);
