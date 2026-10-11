// How long a page is called new, from the day in its `added`.
export const newForDays = 60;

/**
 * Whether a page is new: its frontmatter has `added`, a day written as
 * 2026-10-11, and that day is no more than sixty days gone. The site is
 * built again with every release, so the badge takes itself away and
 * nobody has to remember to.
 */
export function isNew(added: string | undefined, now = new Date()) {
  if (added === undefined) return false;
  const day = new Date(`${added}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(added) || Number.isNaN(day.getTime())) {
    throw new Error(`"added" has to be a day like 2026-10-11, not "${added}".`);
  }
  const days = (now.getTime() - day.getTime()) / 86_400_000;
  return days >= 0 && days <= newForDays;
}
