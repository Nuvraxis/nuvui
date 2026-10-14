import { expect, type Page, test } from "@playwright/test";
import { open } from "./helpers";

// The policy on the Content Security Policy page, served with the docs'
// pages in place of none. The scripts are let through: the docs are static
// files, and Next.js writes its own scripts into each page, which a static
// site can't give a nonce. 'report-sample' blocks nothing more: without it
// a browser leaves out the start of what it blocked, and the test can't tell
// the site's own styles from a package's.
const policy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'report-sample'",
  "style-src-attr 'unsafe-inline'",
  "img-src 'self' blob:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
].join("; ");

async function servePolicy(page: Page, value: string) {
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() !== "document") {
      await route.fallback();
      return;
    }
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: { ...response.headers(), "content-security-policy": value },
    });
  });
}

// What the browser blocks, from the moment the page starts.
async function recordViolations(page: Page) {
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { violations: string[] }).violations = seen;
    document.addEventListener("securitypolicyviolation", (event) => {
      // A browser that gives no sample still sends the event from the
      // blocked element.
      const sample =
        event.sample ||
        (event.target instanceof Element
          ? (event.target.textContent ?? "").trim().slice(0, 40)
          : "");
      seen.push(`${event.effectiveDirective} ${event.blockedURI} ${sample}`);
    });
  });
}

const violations = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { violations: string[] }).violations,
  );

// Each of these sets styles on the element, which a page from a server
// sends as `style` attributes: the components the page's table names.
// Each is measured with no policy and with the page's, and has to come out
// the same.
const measured: [string, () => unknown][] = [
  [
    "/docs/components/progress",
    () => {
      const bar = document.querySelector(".nuv-progress__indicator");
      if (!bar?.parentElement) return null;
      return Math.round(
        (bar.getBoundingClientRect().width /
          bar.parentElement.getBoundingClientRect().width) *
          100,
      );
    },
  ],
  [
    "/docs/components/slider",
    () => {
      const range = document.querySelector(".nuv-slider__range");
      const thumb = document.querySelector(".nuv-slider__thumb");
      return [
        Math.round(range?.getBoundingClientRect().width ?? -1),
        Math.round(thumb?.getBoundingClientRect().left ?? -1),
      ];
    },
  ],
  [
    "/docs/components/scroll-area",
    () => {
      const box = document.querySelector(".nuv-scroll-area__viewport");
      return box ? getComputedStyle(box).overflowY : null;
    },
  ],
  [
    "/docs/charts/bar",
    () => {
      const chart = document.querySelector(".nuv-chart");
      const name = /--chart-[a-z-]+/.exec(chart?.getAttribute("style") ?? "");
      return chart && name
        ? getComputedStyle(chart).getPropertyValue(name[0]).trim()
        : null;
    },
  ],
  [
    "/docs/components/rating",
    () => {
      const fill = document.querySelector(".nuv-rating__fill");
      return fill
        ? getComputedStyle(fill).getPropertyValue("--nuv-rating-part")
        : null;
    },
  ],
  [
    "/docs/components/aspect-ratio",
    () => {
      const box = document.querySelector(".nuv-aspect-ratio");
      return box ? Math.round(box.getBoundingClientRect().height) : null;
    },
  ],
  [
    "/docs/components/color-picker",
    () => {
      const swatch = document.querySelector(
        ".nuv-color-picker__trigger-swatch",
      );
      return swatch ? getComputedStyle(swatch).backgroundColor : null;
    },
  ],
  [
    "/docs/table/expanding",
    () => {
      const toggle = document.querySelector(".nuv-data-table__expand");
      return toggle
        ? getComputedStyle(toggle).getPropertyValue("--nuv-data-table-depth")
        : null;
    },
  ],
  [
    // The React Hook Form example puts a Select and a Checkbox in a form.
    // Radix keeps a copy of each in it, to be sent with the form and not
    // seen, and only inside a form.
    "/docs/forms",
    () => {
      const select = document.querySelector("form select[aria-hidden]");
      const box = document.querySelector(
        "form input[type=checkbox][aria-hidden]",
      );
      return select && box
        ? [
            Math.round(select.getBoundingClientRect().width),
            getComputedStyle(box).opacity,
          ]
        : null;
    },
  ],
];

test.describe("under the Content Security Policy the docs give", () => {
  for (const [url, measure] of measured) {
    test(`${url} draws as it does with no policy`, async ({
      browser,
      baseURL,
    }) => {
      // Two pages of their own, so the policy is on one and not the other.
      const free = await browser.newPage({ baseURL });
      await open(free, url);
      const expected = await free.evaluate(measure);
      await free.close();
      // A measure that finds nothing would pass whatever the policy did.
      expect(expected).not.toBeNull();

      const strict = await browser.newPage({ baseURL });
      await servePolicy(strict, policy);
      await open(strict, url);
      expect(await strict.evaluate(measure)).toEqual(expected);
      await strict.close();
    });
  }

  test("nothing the packages draw is blocked", async ({ page }) => {
    await servePolicy(page, policy);
    await recordViolations(page);

    for (const [url] of measured) {
      await open(page, url);
      const blocked = (await violations(page)).filter(
        (violation) =>
          // The docs site's own, from the theme it switches without
          // transitions, and Radix's scroll area in its sidebar. The one in
          // the ScrollArea example is the same: a static site has no nonce
          // to give it. The AspectRatio example's picture is written into
          // the example as a data: address; AspectRatio only frames it.
          !/^(style-src-elem inline (\*,\*::before|\[data-radix-scroll-area-viewport\])|img-src data)/.test(
            violation,
          ),
      );
      expect(blocked, url).toEqual([]);
    }
  });

  test("without style attributes, a progress bar is empty, which is why the page allows them", async ({
    page,
  }) => {
    await servePolicy(
      page,
      policy.replace("style-src-attr 'unsafe-inline'", "style-src-attr 'none'"),
    );
    // The width is in the page the server sent. Firefox leaves a blocked
    // attribute out of the page it builds, so it's read from the HTML.
    const html = await (
      await page.request.get("/docs/components/progress")
    ).text();
    const sent = /<[^>]*nuv-progress__indicator[^>]*>/.exec(html)?.[0] ?? "";
    expect(sent).toMatch(/inline-size:\s*[1-9]/);

    await open(page, "/docs/components/progress");
    const bar = page.locator(".nuv-progress__indicator").first();
    expect((await bar.boundingBox())?.width ?? 0).toBeLessThan(1);
  });
});
