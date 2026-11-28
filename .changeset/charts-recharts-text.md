---
"@nuvui/charts": patch
---

Axis text and labels take the theme's colors again with Recharts 3.11, which writes every text's fill in a style attribute. Before this, a chart drawn with Recharts 3.11 had gray axis text in every theme, too faint to read in the dark ones.
