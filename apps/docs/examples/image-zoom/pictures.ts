// A picture drawn for these examples and kept in the file, so it doesn't
// depend on another site. Use your own photos or scans in its place.
const picture = (body: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">${body}</svg>`,
  )}`;

// The labels are drawn small on purpose: at the size the page shows the
// plan, they're what someone zooms in to read.
const room = (x: number, y: number, name: string, size: string) => `
  <text x="${x}" y="${y}" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#1e293b" text-anchor="middle">${name}</text>
  <text x="${x}" y="${y + 16}" font-family="system-ui, sans-serif" font-size="11" fill="#64748b" text-anchor="middle">${size}</text>`;

export const floorPlan = picture(`
  <rect width="800" height="500" fill="#f8fafc"/>
  <g fill="none" stroke="#334155" stroke-width="8" stroke-linejoin="square">
    <rect x="60" y="50" width="680" height="400"/>
    <path d="M330 50v150M330 260v190M330 250h140M530 250h210M530 50v130M60 300h130M250 300h80"/>
  </g>
  <g fill="none" stroke="#94a3b8" stroke-width="2">
    <path d="M190 300a60 60 0 0 1 60 -60M470 250a60 60 0 0 1 60 -60M330 200a60 60 0 0 1 60 60"/>
  </g>
  <g fill="#bfdbfe">
    <rect x="120" y="46" width="120" height="8"/>
    <rect x="560" y="46" width="120" height="8"/>
    <rect x="736" y="300" width="8" height="100"/>
    <rect x="400" y="446" width="140" height="8"/>
  </g>
  <g fill="#e2e8f0" stroke="#94a3b8" stroke-width="2">
    <rect x="90" y="330" width="90" height="90" rx="4"/>
    <rect x="560" y="300" width="150" height="60" rx="6"/>
    <rect x="400" y="70" width="110" height="40"/>
    <circle cx="640" cy="130" r="34"/>
  </g>
  ${room(195, 170, "Living room", "5.4 × 4.1 m, 22.1 m²")}
  ${room(430, 160, "Kitchen", "3.6 × 3.2 m, 11.5 m²")}
  ${room(635, 205, "Dining", "3.4 × 2.6 m, 8.8 m²")}
  ${room(195, 400, "Bathroom", "2.6 × 2.4 m, 6.2 m²")}
  ${room(430, 360, "Hall", "2.4 × 3.0 m, 7.2 m²")}
  ${room(635, 410, "Bedroom", "3.4 × 3.0 m, 10.2 m²")}
  <text x="740" y="482" font-family="system-ui, sans-serif" font-size="10" fill="#64748b" text-anchor="end">Flat 4B, first floor. Scale 1:100</text>`);
