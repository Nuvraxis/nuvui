---
"@nuvui/chat": patch
---

`createShikiHighlighter` colors the first code in a language to the end of each line on a slow machine. Shiki stops a line after half a second, and the first code in a language spends most of that building its patterns, so on a slow phone a line could be left part colored. The first time now gets five seconds.
