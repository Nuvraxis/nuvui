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
// "table" isn't in "sortable". A word that ends in "e" loses it before an
// ending, so "theme" finds "theming" and "change" finds "changed", and
// "theme" still doesn't find "them".
function matcher(term: string) {
  const stem = stemOf(term);
  const start =
    stem.length >= 4 && stem.endsWith("e")
      ? `${escapeRegExp(stem.slice(0, -1))}(?:e|ing|ed|able|ible)`
      : escapeRegExp(stem);
  return new RegExp(`(?<![a-z0-9])${start}`, "g");
}

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
 * The sections that best answer `query`. Each word counts by how few
 * sections have it, and for more in the page's title or the section's
 * heading, which say what it's about better than its text does. A section
 * is ranked by that, times how much of the question it has.
 */
export function search(
  pages: readonly Page[],
  query: string,
  limit: number,
): Hit[] {
  const terms = termsOf(query);
  if (terms.length === 0) return [];
  const patterns = terms.map(matcher);

  const sections = pages.flatMap((page) => {
    const title = `${page.title} ${page.id}`.toLowerCase();
    return page.sections.map((section) => ({
      page,
      section,
      title,
      heading: section.heading.toLowerCase(),
      text: section.markdown.toLowerCase(),
    }));
  });
  // A word in few sections says more about which one is meant than a word
  // in many: "sort" more than "table", and "table" more than "make". Without
  // this, a section with three common words beat the one about the question.
  // Squared, so a rare word stands out further. A word in every section
  // still counts for something, so it's found.
  const weights = patterns.map((pattern) => {
    const having = sections.filter(
      ({ title, heading, text }) =>
        count(title, pattern) + count(heading, pattern) + count(text, pattern) >
        0,
    ).length;
    return Math.log(1 + sections.length / Math.max(having, 1)) ** 2;
  });

  const scored: { hit: Hit; matched: number; score: number }[] = [];
  for (const { page, section, title, heading, text } of sections) {
    let matched = 0;
    let score = 0;
    patterns.forEach((pattern, index) => {
      const inText = count(text, pattern);
      const inTitle = count(title, pattern) > 0;
      const inHeading = count(heading, pattern) > 0;
      if (inText === 0 && !inTitle && !inHeading) return;
      const weight = weights[index] ?? 0;
      matched += weight;
      score +=
        weight *
        (Math.min(inText, 5) + (inTitle ? 6 : 0) + (inHeading ? 4 : 0));
    });
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

  return scored
    .sort((a, b) => b.matched * b.score - a.matched * a.score)
    .slice(0, limit)
    .map(({ hit }) => hit);
}
