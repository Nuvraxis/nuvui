import { useEffect, useState } from "react";

/**
 * Keeps `aria-activedescendant` right on a cmdk search field and its list.
 *
 * The attribute is how a screen reader learns which option the arrow keys
 * are on, since focus itself stays in the field. cmdk 1.1.1 works it out
 * before the list has been drawn again, so it's empty when the list opens
 * and after typing, and after a character is erased it names an option that
 * is no longer the one highlighted. Only an arrow key puts it right.
 *
 * cmdk does mark the highlighted option correctly. This watches for that
 * mark to move and points the attribute at it. The ref it returns goes on
 * the cmdk root.
 */
export function useActiveOption(): (root: HTMLElement | null) => void {
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!root) return;

    const sync = () => {
      const id =
        root.querySelector('[cmdk-item][aria-selected="true"]')?.id || null;
      for (const element of root.querySelectorAll(
        "[cmdk-input], [cmdk-list]",
      )) {
        // Writing the same value again would call this again, without end.
        if (element.getAttribute("aria-activedescendant") === id) continue;
        if (id) element.setAttribute("aria-activedescendant", id);
        else element.removeAttribute("aria-activedescendant");
      }
    };
    sync();

    // The attribute itself is watched too, because cmdk writes its own
    // value over this one whenever that value changes.
    const observer = new MutationObserver(sync);
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-selected", "aria-activedescendant"],
    });
    return () => observer.disconnect();
  }, [root]);

  return setRoot;
}
