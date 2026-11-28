---
"@nuvui/org-chart": patch
---

A card shows no words that its name leaves out, which axe-core 4.14 checks for by default, as WCAG's label in name. Its parts have a space between them in the text, which isn't drawn, so the name, the title and the department aren't read as one run of letters. The initials are drawn by the stylesheet, from `data-initials` on the avatar's fallback. The card looks the same.
