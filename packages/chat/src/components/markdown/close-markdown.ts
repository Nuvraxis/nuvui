// A line that opens or closes a fenced block of code: up to three spaces,
// three or more backticks or tildes, and whatever follows.
const fence = /^ {0,3}(`{3,}|~{3,})(.*)$/;

// A paragraph with the code in its lines taken out, and how many
// backticks open a piece of code that isn't closed, if one is. Code in a
// line opens with any number of backticks and closes with the same number.
function withoutCode(text: string): { outside: string; open: number } {
  let outside = "";
  let at = 0;
  while (at < text.length) {
    if (text[at] !== "`") {
      outside += text[at];
      at += 1;
      continue;
    }
    let length = 1;
    while (text[at + length] === "`") length += 1;
    let close = -1;
    let look = at + length;
    while (look < text.length && close === -1) {
      if (text[look] !== "`") {
        look += 1;
        continue;
      }
      let run = 1;
      while (text[look + run] === "`") run += 1;
      if (run === length) close = look;
      else look += run;
    }
    if (close === -1) return { outside, open: length };
    at = close + length;
  }
  return { outside, open: 0 };
}

/**
 * Markdown that's still arriving, with what's open at its end closed, so
 * that it's drawn as what it's about to be and not as loose marks: a
 * block of code as a block of code, bold as bold. Text that's whole comes
 * back as it was.
 *
 * It closes fenced code, code in a line, `**bold**` and `~~struck~~`,
 * and shows a link whose address is still arriving as its text. Italics
 * are left alone: a single `*` or `_` is too often a bullet, a product
 * of two numbers or part of a name.
 */
export function closeMarkdown(text: string): string {
  let open: string | null = null;
  // Where the line after the last block of code that's whole begins.
  let after = 0;
  let at = 0;
  for (const line of text.split("\n")) {
    at += line.length + 1;
    const found = fence.exec(line);
    if (!found) continue;
    const marker = found[1] as string;
    const rest = found[2] ?? "";
    if (open === null) {
      // Backticks with another backtick after them on the line are code
      // in a line, and no fence.
      if (marker.startsWith("`") && rest.includes("`")) continue;
      open = marker;
    } else if (
      marker[0] === open[0] &&
      marker.length >= open.length &&
      rest.trim() === ""
    ) {
      open = null;
      after = Math.min(at, text.length);
    }
  }
  // Inside a block of code nothing else is markdown, so that's all.
  if (open !== null) return `${text}${text.endsWith("\n") ? "" : "\n"}${open}`;

  // Marks in a line don't reach past a blank line or a block of code, so
  // only the last paragraph can have one open.
  const rest = text.slice(after);
  const cut = rest.lastIndexOf("\n\n");
  const head =
    text.slice(0, after) + (cut === -1 ? "" : rest.slice(0, cut + 2));
  let tail = cut === -1 ? rest : rest.slice(cut + 2);

  // A link or a picture whose address is still arriving: its text.
  tail = tail.replace(/!?\[([^\]\n]*)\]\([^)\n]*$/, "$1");

  // Code in a line that's whole is left out of the counting below: a
  // mark inside it is only a character.
  const { outside, open: backticks } = withoutCode(tail);
  if (backticks > 0) {
    const marks = "`".repeat(backticks);
    // Just opened, with nothing in it yet, the marks are dropped.
    return (
      head +
      (tail.endsWith(marks) && !tail.slice(0, -backticks).endsWith("`")
        ? tail.slice(0, -backticks)
        : tail + marks)
    );
  }

  // The one opened last is closed first, so they don't cross.
  const unclosed = ["**", "~~"]
    .filter((mark) => (outside.split(mark).length - 1) % 2 === 1)
    .sort((a, b) => tail.lastIndexOf(b) - tail.lastIndexOf(a));
  for (const mark of unclosed) {
    // A mark that closes has to come straight after a word, so the
    // space the text may end with goes.
    const written = tail.trimEnd();
    tail = written.endsWith(mark) ? written.slice(0, -2) : written + mark;
  }
  return head + tail;
}
