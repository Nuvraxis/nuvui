---
"@nuvui/scheduler": patch
---

A calendar or timeline on a page built ahead of time no longer makes React throw the page's HTML away when it's opened on another day. The server drew the day it was built, and the browser the day it was opened. Now, with no `date`, `defaultDate` or `today`, the days and the heading are hidden until the browser has the page, even with `timeZone` set. The server still draws them when it's told which day to show.
