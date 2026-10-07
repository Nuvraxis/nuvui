import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { setPageTheme, themes } from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { cleanup, render } from "vitest-browser-react";
import { Toaster, toast } from "./toast";

// The list of toasts lives outside React, so it outlasts a test's render.
// With the Toaster unmounted first, dismiss() empties it at once.
afterEach(async () => {
  await cleanup();
  toast.dismiss();
});

const all = () => [...document.querySelectorAll<HTMLElement>(".nuv-toast")];
const titles = () =>
  all().map((item) => item.querySelector(".nuv-toast__title")?.textContent);
const rect = (element: Element) => element.getBoundingClientRect();
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function first() {
  await expect.poll(() => all().length).toBeGreaterThan(0);
  return all()[0] as HTMLElement;
}

// The animation scales the toast, which would make measurements depend on
// timing.
async function renderStill(node: React.ReactNode = <Toaster />) {
  await emulateMedia({ reducedMotion: "reduce" });
  return render(node);
}

describe("toast()", () => {
  test("shows a toast with the title and returns its id", async () => {
    await renderStill();

    const id = toast("Changes saved");

    expect(id).toMatch(/^nuv-toast-\d+$/);
    await expect.poll(titles).toEqual(["Changes saved"]);
  });

  test("adds a description when given one", async () => {
    await renderStill();

    toast("File deleted", { description: "report.pdf is in the trash." });

    const element = await first();
    expect(element.querySelector(".nuv-toast__description")?.textContent).toBe(
      "report.pdf is in the trash.",
    );
  });

  test("leaves the description out when there isn't one", async () => {
    await renderStill();

    toast("Changes saved");

    expect((await first()).querySelector(".nuv-toast__description")).toBeNull();
  });

  test("turns the intent into a BEM modifier", async () => {
    await renderStill();

    toast("Saved", { intent: "success" });
    toast("Failed", { intent: "danger" });
    toast("Heads up");

    await expect.poll(() => all().length).toBe(3);
    expect(all().map((item) => item.className)).toEqual([
      "nuv-toast nuv-toast--success",
      "nuv-toast nuv-toast--danger",
      "nuv-toast nuv-toast--neutral",
    ]);
  });

  test("the same id replaces the toast instead of adding one", async () => {
    await renderStill();

    toast("Uploading", { id: "upload", duration: Number.POSITIVE_INFINITY });
    await expect.poll(titles).toEqual(["Uploading"]);

    const id = toast("Upload finished", { id: "upload" });

    expect(id).toBe("upload");
    await expect.poll(titles).toEqual(["Upload finished"]);
  });

  test("toasts sent before the Toaster is on the page show once it is", async () => {
    toast("Early");

    await renderStill();

    await expect.poll(titles).toEqual(["Early"]);
  });

  test("toast.dismiss closes one toast by id, or all of them", async () => {
    await renderStill();
    const forever = { duration: Number.POSITIVE_INFINITY };
    const one = toast("One", forever);
    toast("Two", forever);
    toast("Three", forever);
    await expect.poll(titles).toEqual(["One", "Two", "Three"]);

    toast.dismiss(one);
    await expect.poll(titles).toEqual(["Two", "Three"]);

    toast.dismiss();
    await expect.poll(titles).toEqual([]);
  });
});

// The durations in these are long enough that a slow moment in the browser
// can't let a toast come and go between two looks at the page.
const soon = { timeout: 3000 };

describe("closing", () => {
  test("goes away on its own after its duration", async () => {
    await renderStill();

    toast("Brief", { duration: 600 });

    await expect.poll(titles).toEqual(["Brief"]);
    await expect.poll(titles, soon).toEqual([]);
  });

  test("uses the Toaster's duration when it has none of its own", async () => {
    await renderStill(<Toaster duration={600} />);

    toast("Brief");

    await expect.poll(titles).toEqual(["Brief"]);
    await expect.poll(titles, soon).toEqual([]);
  });

  test("duration: Infinity keeps it until it's dismissed", async () => {
    await renderStill(<Toaster duration={100} />);

    toast("Sticky", { duration: Number.POSITIVE_INFINITY });
    await first();
    await wait(500);

    expect(titles()).toEqual(["Sticky"]);
  });

  test("the timer waits while the pointer is on a toast", async () => {
    await renderStill();
    toast("Read me", { duration: 1000 });
    const element = await first();

    await userEvent.hover(element);
    await wait(1500);
    expect(titles()).toEqual(["Read me"]);

    await userEvent.unhover(element);
    await expect.poll(titles, soon).toEqual([]);
  });

  test("the close button closes it and has an accessible name", async () => {
    await renderStill();
    toast("Changes saved", { duration: Number.POSITIVE_INFINITY });
    await first();

    await page.getByRole("button", { name: "Close" }).click();

    await expect.poll(titles).toEqual([]);
  });

  test("the close button takes a translated label", async () => {
    await renderStill(<Toaster closeLabel="Schließen" />);
    toast("Gespeichert");
    await first();

    await expect
      .element(page.getByRole("button", { name: "Schließen" }))
      .toBeVisible();
  });

  test("the action runs its handler and closes the toast", async () => {
    const onClick = vi.fn();
    await renderStill();
    toast("File deleted", {
      duration: Number.POSITIVE_INFINITY,
      action: { label: "Undo", altText: "Undo with Ctrl+Z", onClick },
    });
    await first();

    await page.getByRole("button", { name: "Undo" }).click();

    expect(onClick).toHaveBeenCalledOnce();
    await expect.poll(titles).toEqual([]);
  });

  test("still closes after its exit animation", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Toaster />);
    toast("Changes saved", { duration: Number.POSITIVE_INFINITY });
    expect(getComputedStyle(await first()).animationName).toBe("nuv-toast-in");

    toast.dismiss();

    await expect.poll(titles).toEqual([]);
  });

  test("a swipe to the right dismisses it", async () => {
    await setViewport("desktop");
    await renderStill(
      <>
        <Toaster position="bottom-start" />
        <span
          data-testid="far"
          style={{ position: "fixed", inset: "auto 0 0 auto", padding: 20 }}
        />
      </>,
    );
    toast("Swipe me", { duration: Number.POSITIVE_INFINITY });
    const element = await first();

    await userEvent.dragAndDrop(
      page.elementLocator(
        element.querySelector(".nuv-toast__title") as Element,
      ),
      page.getByTestId("far"),
      // In steps, because Radix follows the pointer while it's still over
      // the toast. One jump to the far side would never register.
      { steps: 10 },
    );

    await expect.poll(titles).toEqual([]);
  });
});

describe("limit", () => {
  const forever = { duration: Number.POSITIVE_INFINITY };

  function send(...names: string[]) {
    return names.map((name) => toast(name, forever));
  }

  test("shows three at once and holds the rest back", async () => {
    await renderStill();

    send("One", "Two", "Three", "Four", "Five");

    await expect.poll(titles).toEqual(["One", "Two", "Three"]);
    // Not in the page at all, so a screen reader hasn't heard them either.
    expect(document.body.textContent).not.toContain("Four");
  });

  test("the next in line shows when one closes", async () => {
    await renderStill();
    const [one, two] = send("One", "Two", "Three", "Four", "Five");
    await expect.poll(titles).toEqual(["One", "Two", "Three"]);

    toast.dismiss(one);
    await expect.poll(titles).toEqual(["Two", "Three", "Four"]);

    toast.dismiss(two);
    await expect.poll(titles).toEqual(["Three", "Four", "Five"]);
  });

  test("the close button makes room as well", async () => {
    await renderStill();
    send("One", "Two", "Three", "Four");
    await expect.poll(titles).toEqual(["One", "Two", "Three"]);

    await page.getByRole("button", { name: "Close" }).first().click();

    await expect.poll(titles).toEqual(["Two", "Three", "Four"]);
  });

  test("a waiting toast's time starts when it shows", async () => {
    await renderStill();
    const [one] = send("One", "Two", "Three");
    toast("Four", { duration: 800 });
    await expect.poll(titles).toEqual(["One", "Two", "Three"]);
    // Longer than Four would have lasted had its clock been running.
    await wait(1200);

    toast.dismiss(one);

    await expect.poll(titles).toEqual(["Two", "Three", "Four"]);
    await expect.poll(titles, soon).toEqual(["Two", "Three"]);
  });

  test("a waiting toast can be dismissed before it shows", async () => {
    await renderStill();
    const [one, , , four] = send("One", "Two", "Three", "Four", "Five");
    await expect.poll(titles).toEqual(["One", "Two", "Three"]);

    toast.dismiss(four);
    toast.dismiss(one);

    await expect.poll(titles).toEqual(["Two", "Three", "Five"]);
  });

  test("a waiting toast can be changed before it shows", async () => {
    await renderStill();
    const [one, , , four] = send("One", "Two", "Three", "Four");
    await expect.poll(titles).toEqual(["One", "Two", "Three"]);

    toast("Four, updated", { ...forever, id: four });
    toast.dismiss(one);

    await expect.poll(titles).toEqual(["Two", "Three", "Four, updated"]);
  });

  test("toast.dismiss() with no id clears the ones waiting too", async () => {
    await renderStill();
    send("One", "Two", "Three", "Four", "Five");
    await expect.poll(titles).toEqual(["One", "Two", "Three"]);

    toast.dismiss();

    await expect.poll(titles).toEqual([]);
    await wait(300);
    expect(titles()).toEqual([]);
  });

  test("limit changes how many show", async () => {
    await renderStill(<Toaster limit={1} />);
    const [one] = send("One", "Two");
    await expect.poll(titles).toEqual(["One"]);

    toast.dismiss(one);

    await expect.poll(titles).toEqual(["Two"]);
  });

  test("the one coming in doesn't wait for the one going out", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    // Slowed down, so the exit animation can't be over before the first look.
    const root = document.documentElement;
    root.style.setProperty("--nuv-duration-fast", "600ms");

    try {
      await render(<Toaster limit={1} />);
      const [one] = send("One", "Two");
      await expect.poll(titles).toEqual(["One"]);

      toast.dismiss(one);

      await expect.poll(titles).toEqual(["One", "Two"]);
      await expect.poll(titles, soon).toEqual(["Two"]);
    } finally {
      root.style.removeProperty("--nuv-duration-fast");
    }
  });
});

describe("keyboard", () => {
  test("F8 moves focus to the list, and Tab goes on into the toast", async () => {
    await renderStill();
    toast("Changes saved", { duration: Number.POSITIVE_INFINITY });
    const element = await first();

    await userEvent.keyboard("{F8}");
    expect(document.activeElement).toBe(document.querySelector(".nuv-toaster"));
    await expect
      .element(page.getByRole("region", { name: "Notifications (F8)" }))
      .toBeInTheDocument();

    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(element);
    expect(getComputedStyle(element).outlineStyle).toBe("solid");

    await userEvent.keyboard("{Tab}");
    await expect
      .element(page.getByRole("button", { name: "Close" }))
      .toHaveFocus();
  });

  test("Escape closes the toast that has focus", async () => {
    await renderStill();
    toast("Changes saved", { duration: Number.POSITIVE_INFINITY });
    await first();
    await userEvent.keyboard("{F8}");
    await userEvent.keyboard("{Tab}");

    await userEvent.keyboard("{Escape}");

    await expect.poll(titles).toEqual([]);
  });

  test("the timer waits while focus is inside the list", async () => {
    await renderStill();
    toast("Read me", { duration: 1000 });
    await first();

    await userEvent.keyboard("{F8}");
    await wait(1500);

    expect(titles()).toEqual(["Read me"]);
  });
});

describe("screen readers", () => {
  const announced = (politeness: string) =>
    document.querySelector(`[role="status"][aria-live="${politeness}"]`)
      ?.textContent;

  test("a danger toast is announced at once", async () => {
    await renderStill();

    toast("Couldn't save", { intent: "danger" });

    await expect.poll(() => announced("assertive")).toContain("Couldn't save");
  });

  test("other toasts wait their turn", async () => {
    await renderStill();

    toast("Changes saved", { intent: "success" });

    await expect.poll(() => announced("polite")).toContain("Changes saved");
    expect(announced("assertive")).toBeUndefined();
  });

  test("the announcement starts with the Toaster's toastLabel", async () => {
    await renderStill(<Toaster toastLabel="Hinweis" />);

    toast("Gespeichert");

    await expect.poll(() => announced("polite")).toContain("Hinweis");
  });
});

describe("layout", () => {
  test("on a phone, toasts span the bottom of the screen", async () => {
    await setViewport("phone");
    const screen = await renderStill();
    toast("Changes saved");
    const element = rect(await first());

    expect(element.left).toBe(16);
    expect(element.width).toBe(window.innerWidth - 32);
    expect(window.innerHeight - element.bottom).toBe(16);
    expect(screen.container.ownerDocument.documentElement.scrollWidth).toBe(
      window.innerWidth,
    );
  });

  test("on a desktop, they're a column in the bottom end corner", async () => {
    await setViewport("desktop");
    await renderStill();
    toast("Changes saved");
    const element = rect(await first());

    expect(element.width).toBe(352);
    expect(window.innerWidth - element.right).toBe(16);
    expect(window.innerHeight - element.bottom).toBe(16);
  });

  test("position moves the column", async () => {
    await setViewport("desktop");
    await renderStill(<Toaster position="top-start" />);
    toast("Changes saved");
    const corner = rect(await first());

    expect(corner.left).toBe(16);
    expect(corner.top).toBe(16);
    await cleanup();
    toast.dismiss();

    await render(<Toaster position="top-center" />);
    toast("Changes saved");
    const middle = rect(await first());

    expect(middle.left).toBeCloseTo((window.innerWidth - middle.width) / 2, 0);
  });

  test("on a phone, a top position puts them at the top", async () => {
    await setViewport("phone");
    await renderStill(<Toaster position="top-end" />);
    toast("Changes saved");
    const element = rect(await first());

    expect(element.top).toBe(16);
    expect(element.width).toBe(window.innerWidth - 32);
  });

  test("the newest toast is the one nearest the edge", async () => {
    const forever = { duration: Number.POSITIVE_INFINITY };
    const top = (title: string) =>
      rect(all().find((item) => item.textContent?.includes(title)) as Element)
        .top;

    await renderStill();
    toast("Older", forever);
    toast("Newer", forever);
    await expect.poll(() => all().length).toBe(2);
    expect(top("Newer")).toBeGreaterThan(top("Older"));
    await cleanup();
    toast.dismiss();

    await render(<Toaster position="top-end" />);
    toast("Older", forever);
    toast("Newer", forever);
    await expect.poll(() => all().length).toBe(2);
    expect(top("Newer")).toBeLessThan(top("Older"));
  });

  test("the empty list doesn't get in the way of the page under it", async () => {
    await renderStill(
      <>
        <button
          type="button"
          style={{ position: "fixed", insetBlockEnd: 0, insetInlineEnd: 0 }}
        >
          Under
        </button>
        <Toaster />
      </>,
    );
    const button = page.getByRole("button", { name: "Under" }).element();
    const { left, top, width, height } = rect(button);

    expect(document.elementFromPoint(left + width / 2, top + height / 2)).toBe(
      button,
    );
  });

  test("the buttons are 32px with a mouse", async () => {
    await renderStill();
    toast("File deleted", {
      duration: Number.POSITIVE_INFINITY,
      action: { label: "Undo", altText: "Undo with Ctrl+Z", onClick() {} },
    });
    await first();
    const size = (name: string) => {
      const { width, height } = rect(
        page.getByRole("button", { name }).element(),
      );
      return [width >= 44, height];
    };

    expect(size("Close")).toEqual([false, 32]);
    expect(size("Undo")[1]).toBe(32);
  });

  test("titles line up whether or not the toast has a colored edge", async () => {
    await renderStill();
    const forever = { duration: Number.POSITIVE_INFINITY };
    toast("Plain", forever);
    toast("Good", { ...forever, intent: "success" });
    toast("Bad", { ...forever, intent: "danger" });
    await expect.poll(() => all().length).toBe(3);

    const lefts = all().map(
      (item) => rect(item.querySelector(".nuv-toast__title") as Element).left,
    );
    expect(new Set(lefts).size).toBe(1);
  });

  test("they still line up with a thicker edge and a thicker border", async () => {
    document.documentElement.style.setProperty(
      "--nuv-toast-accent-width",
      "9px",
    );
    document.documentElement.style.setProperty("--nuv-border-width", "2px");
    try {
      await renderStill();
      const forever = { duration: Number.POSITIVE_INFINITY };
      toast("Plain", forever);
      toast("Good", { ...forever, intent: "success" });
      await expect.poll(() => all().length).toBe(2);

      const [plain, good] = all();
      const edge = (item: Element | undefined) =>
        getComputedStyle(item as Element).borderLeftWidth;
      const title = (item: Element | undefined) =>
        rect(item?.querySelector(".nuv-toast__title") as Element).left;

      expect(edge(plain)).toBe("2px");
      expect(edge(good)).toBe("9px");
      expect(title(plain)).toBe(title(good));
    } finally {
      document.documentElement.style.removeProperty("--nuv-toast-accent-width");
      document.documentElement.style.removeProperty("--nuv-border-width");
    }
  });

  test("a long title wraps inside the toast", async () => {
    await setViewport("phone");
    await renderStill();
    toast(
      "The file you asked for couldn't be saved because the disk is full and nothing can be written to it",
    );
    const element = await first();

    expect(rect(element).width).toBe(window.innerWidth - 32);
    expect(rect(element).height).toBeGreaterThan(60);
  });
});

describe("Toaster", () => {
  test("forwards its ref and keeps a className", async () => {
    const ref = createRef<HTMLOListElement>();
    await renderStill(<Toaster ref={ref} className="mine" />);

    expect(ref.current?.className).toBe(
      "nuv-toaster nuv-toaster--bottom nuv-toaster--end mine",
    );
  });

  test("takes a translated label for the list", async () => {
    await renderStill(<Toaster label="Hinweise ({hotkey})" />);

    await expect
      .element(page.getByRole("region", { name: "Hinweise (F8)" }))
      .toBeInTheDocument();
  });

  test("doesn't animate when reduced motion is on", async () => {
    await renderStill();
    toast("Changes saved");

    expect(getComputedStyle(await first()).animationName).toBe("none");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe with every kind of toast showing", async () => {
    setPageTheme(theme);
    await setViewport("desktop");
    await renderStill(
      <>
        <main>Page</main>
        <Toaster />
      </>,
    );
    const forever = { duration: Number.POSITIVE_INFINITY };
    toast("Changes saved", { ...forever, intent: "success" });
    toast("Couldn't save", {
      ...forever,
      intent: "danger",
      description: "Check your connection and try again.",
    });
    toast("File deleted", {
      ...forever,
      description: "report.pdf is in the trash.",
      action: { label: "Undo", altText: "Undo with Ctrl+Z", onClick() {} },
    });
    await expect.poll(() => all().length).toBe(3);
    // Radix puts a copy of each new toast in a live region for a second.
    // Wait for those to go, so the page is checked as it settles.
    await expect
      .poll(() => document.querySelectorAll('[aria-live="polite"]').length, {
        timeout: 3000,
      })
      .toBe(0);

    const results = await axe(document.body);

    expect(results).toHaveNoViolations();
    const checked = results.passes.find((rule) => rule.id === "color-contrast");
    // Three titles, two descriptions and the action.
    expect(checked?.nodes.length).toBeGreaterThanOrEqual(6);
  });
});
