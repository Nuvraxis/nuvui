import "../../styles/index.scss";
import { emulateMedia } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  type AccordionProps,
  AccordionTrigger,
} from "./accordion";

const single = { type: "single", collapsible: true } as const;

function Example(props: AccordionProps) {
  return (
    <Accordion {...props}>
      <AccordionItem value="shipping">
        <AccordionTrigger>Shipping</AccordionTrigger>
        <AccordionContent>Orders leave within two days.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionTrigger>Returns</AccordionTrigger>
        <AccordionContent>Send it back within 30 days.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="warranty" disabled>
        <AccordionTrigger>Warranty</AccordionTrigger>
        <AccordionContent>Two years.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

const trigger = (name: string) => page.getByRole("button", { name });
const region = (name: string) => page.getByRole("region", { name });

describe("rendering", () => {
  test("starts closed, with each trigger inside a heading", async () => {
    await render(<Example {...single} />);

    await expect
      .element(trigger("Shipping"))
      .toHaveAttribute("aria-expanded", "false");
    await expect.element(region("Shipping")).not.toBeInTheDocument();
    expect(trigger("Shipping").element().parentElement?.tagName).toBe("H3");
  });

  test("headingLevel changes the heading element", async () => {
    await render(
      <Accordion {...single}>
        <AccordionItem value="a">
          <AccordionTrigger headingLevel={2}>Section</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    await expect
      .element(page.getByRole("heading", { level: 2, name: "Section" }))
      .toBeVisible();
  });

  test("a click opens the panel and names it after its trigger", async () => {
    await render(<Example {...single} />);

    await trigger("Shipping").click();

    await expect
      .element(trigger("Shipping"))
      .toHaveAttribute("aria-expanded", "true");
    await expect
      .element(region("Shipping"))
      .toHaveTextContent("Orders leave within two days.");
  });

  test("type=single keeps one panel open at a time", async () => {
    await render(<Example {...single} defaultValue="shipping" />);

    await trigger("Returns").click();

    await expect.element(region("Returns")).toBeVisible();
    await expect.element(region("Shipping")).not.toBeInTheDocument();
  });

  test("without collapsible, the open item can't be closed again", async () => {
    await render(<Example type="single" defaultValue="shipping" />);

    await expect
      .element(trigger("Shipping"))
      .toHaveAttribute("aria-disabled", "true");
    await trigger("Shipping").click({ force: true });

    await expect.element(region("Shipping")).toBeVisible();
  });

  test("type=multiple lets several stay open", async () => {
    await render(<Example type="multiple" />);

    await trigger("Shipping").click();
    await trigger("Returns").click();

    await expect.element(region("Shipping")).toBeVisible();
    await expect.element(region("Returns")).toBeVisible();
  });

  test("a disabled item can't be opened", async () => {
    await render(<Example {...single} />);

    await expect.element(trigger("Warranty")).toBeDisabled();
  });
});

describe("keyboard", () => {
  test("Enter and Space toggle the focused item", async () => {
    await render(<Example {...single} />);

    await userEvent.keyboard("{Tab}");
    await expect.element(trigger("Shipping")).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    await expect.element(region("Shipping")).toBeVisible();

    await userEvent.keyboard(" ");
    await expect.element(region("Shipping")).not.toBeInTheDocument();
  });

  test("arrow keys, Home and End move between triggers, skipping disabled ones", async () => {
    await render(<Example {...single} />);
    await userEvent.keyboard("{Tab}");

    await userEvent.keyboard("{ArrowDown}");
    await expect.element(trigger("Returns")).toHaveFocus();

    // Warranty is disabled, so down from the last enabled one wraps.
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(trigger("Shipping")).toHaveFocus();

    await userEvent.keyboard("{End}");
    await expect.element(trigger("Returns")).toHaveFocus();

    await userEvent.keyboard("{Home}");
    await expect.element(trigger("Shipping")).toHaveFocus();
  });
});

describe("styles", () => {
  test("the chevron turns over when the item is open", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example {...single} />);
    const chevron = trigger("Shipping")
      .element()
      .querySelector(".nuv-accordion__chevron") as Element;

    expect(getComputedStyle(chevron).transform).toBe("none");
    await trigger("Shipping").click();
    expect(getComputedStyle(chevron).transform).not.toBe("none");
  });

  test("slides open when motion is fine", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Example {...single} />);

    await trigger("Shipping").click();

    await expect.element(region("Shipping")).toBeVisible();
    expect(getComputedStyle(region("Shipping").element()).animationName).toBe(
      "nuv-accordion-down",
    );
  });

  test("doesn't animate when reduced motion is on", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example {...single} />);

    await trigger("Shipping").click();

    await expect.element(region("Shipping")).toBeVisible();
    expect(getComputedStyle(region("Shipping").element()).animationName).toBe(
      "none",
    );
  });

  test("triggers are at least 44px tall, with a mouse as well", async () => {
    await render(<Example {...single} />);

    expect(
      trigger("Shipping").element().getBoundingClientRect().height,
    ).toBeGreaterThanOrEqual(44);
  });

  test("shows a focus ring for keyboard focus", async () => {
    await render(<Example {...single} />);

    await userEvent.keyboard("{Tab}");

    expect(getComputedStyle(trigger("Shipping").element()).outlineStyle).toBe(
      "solid",
    );
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe with an item open", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const screen = await renderThemed(
      theme,
      <Example {...single} defaultValue="shipping" />,
    );

    await expect.element(region("Shipping")).toBeVisible();
    await expectNoViolations(screen.container);
  });
});
