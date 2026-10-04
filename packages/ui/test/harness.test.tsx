// Proves the test setup itself: a real browser, real key presses and axe.
// Delete this once Button has its own tests, which cover the same ground.
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axe } from "./axe";

test("renders in a browser, takes keyboard input and passes axe", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <main>
      <button type="button" onClick={onClick}>
        Save
      </button>
    </main>,
  );
  const button = screen.getByRole("button", { name: "Save" });

  await expect.element(button).toBeVisible();

  await userEvent.keyboard("{Tab}");
  await expect.element(button).toHaveFocus();

  await userEvent.keyboard("{Enter}");
  expect(onClick).toHaveBeenCalledOnce();

  expect(await axe(screen.container)).toHaveNoViolations();
});

test("axe checks color contrast, which only works with real layout", async () => {
  const screen = await render(
    <main>
      <p style={{ color: "#bbb", backgroundColor: "#fff" }}>Low contrast</p>
    </main>,
  );

  const results = await axe(screen.container);

  expect(results.violations.map((violation) => violation.id)).toContain(
    "color-contrast",
  );
});
