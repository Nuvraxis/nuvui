import type { Page } from "./data";

export interface Hit {
  page: string;
  title: string;
  section: string;
  snippet: string;
}

// Words that say nothing about which page is meant.
const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "can",
  "do",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "the",
  "to",
  "use",
  "with",
]);

export const termsOf = (text: string) =>
  [...new Set(text.toLowerCase().match(/[a-z0-9][a-z0-9-]*/g) ?? [])].filter(
    (term) => term.length > 1 && !stopWords.has(term),
  );

// A word's start, without the ending that changes with how it's used, so
// "sortable" finds "sorting" and "sorted". What's left has to be long
// enough to still mean something: "table" stays "table".
export function stemOf(term: string) {
  const stem = term.replace(/(able|ible|ing|ed|es|s)$/, "");
  return stem.length >= 3 ? stem : term;
}

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// A word that starts with the term, and not the term inside another word:
// "table" isn't in "sortable".
const matcher = (term: string) =>
  new RegExp(`(?<![a-z0-9])${escapeRegExp(stemOf(term))}`, "g");

const count = (text: string, pattern: RegExp) =>
  text.match(pattern)?.length ?? 0;

function snippetOf(markdown: string, terms: string[]) {
  // The heading is said beside the snippet already. A snippet is one line,
  // where the marks of a heading below it or a table's rule only get in the
  // way.
  const text = markdown
    .replace(/^## .*\n?/, "")
    .replace(/^#{3,6} /gm, "")
    .replace(/^\|(?:\s*:?-{3,}:?\s*\|)+\s*$/gm, "");
  const flat = text.replace(/\s+/g, " ");
  const lower = flat.toLowerCase();
  // A word can be in the heading or the page's title and not in the text,
  // and then the text is shown from its start.
  const found = terms
    .map((term) => lower.search(matcher(term)))
    .filter((index) => index >= 0);
  const at = found.length > 0 ? Math.min(...found) : 0;
  const start = Math.max(0, at - 80);
  const snippet = flat.slice(start, start + 240).trim();
  return `${start > 0 ? "…" : ""}${snippet}${start + 240 < flat.length ? "…" : ""}`;
}

/**
 * The sections that best answer `query`. A section that has more of the
 * words comes first, and then one where they're in the page's title or the
 * section's heading, which say what it's about better than its text does.
 */
export function search(
  pages: readonly Page[],
  query: string,
  limit: number,
): Hit[] {
  const terms = termsOf(query);
  if (terms.length === 0) return [];
  const patterns = terms.map(matcher);

  const scored: { hit: Hit; matched: number; score: number }[] = [];
  for (const page of pages) {
    const title = `${page.title} ${page.id}`.toLowerCase();
    for (const section of page.sections) {
      const heading = section.heading.toLowerCase();
      const text = section.markdown.toLowerCase();
      let matched = 0;
      let score = 0;
      for (const pattern of patterns) {
        const inText = count(text, pattern);
        const inTitle = count(title, pattern) > 0;
        const inHeading = count(heading, pattern) > 0;
        if (inText === 0 && !inTitle && !inHeading) continue;
        matched += 1;
        score += Math.min(inText, 5) + (inTitle ? 6 : 0) + (inHeading ? 4 : 0);
      }
      if (matched === 0) continue;
      scored.push({
        hit: {
          page: page.id,
          title: page.title,
          section: section.heading,
          snippet: snippetOf(section.markdown, terms),
        },
        matched,
        score,
      });
    }
  }

  return scored
    .sort((a, b) => b.matched - a.matched || b.score - a.score)
    .slice(0, limit)
    .map(({ hit }) => hit);
}
