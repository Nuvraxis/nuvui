---
"@nuvui/org-chart": patch
---

A card's initials are drawn by the stylesheet, from `data-initials` on the avatar's fallback, so the card shows no words that its name leaves out. axe-core 4.14 checks for that by default, as WCAG's label in name.
