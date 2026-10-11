---
"@nuvui/react": minor
---

A new component.

- `ListView`, with `ListViewItem`, is a list whose rows can be selected and can each hold buttons and links: people to message, requests to approve. The arrow keys move between rows and Tab goes into the row it's at, so a long list with buttons in every row is one stop for Tab. One row or several can be selected, a letter goes to the next row that starts with it, and `onAction` is called when Enter is pressed on a row.
