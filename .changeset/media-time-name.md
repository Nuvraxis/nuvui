---
"@nuvui/media": patch
---

`MediaTime`'s button is named by the time it shows and then what a press does, such as "0:42 / 3:10, Show the time left", where it was named by the second part alone. The words on it are now in its name, which WCAG's label in name asks for and axe-core 4.14 checks by default, so a person using voice control can say what they see. The labels `showRemaining` and `showElapsed` keep their text and are read after the time.
