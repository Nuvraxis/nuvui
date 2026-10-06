import { expect, type Page, test } from "@playwright/test";
import { open } from "./helpers";

const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"]`);

// A file made up on the spot, for the pages that take one.
const file = (name: string, mimeType = "text/plain", bytes = 4) => ({
  name,
  mimeType,
  buffer: Buffer.alloc(bytes, "x"),
});

test.describe("label page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/label");
  });

  test("a click on the label goes to its input", async ({ page }) => {
    const example = preview(page, "label/basic");

    await example.locator("label").click();

    await expect(example.getByRole("textbox", { name: "Email" })).toBeFocused();
  });

  test("a label around a checkbox toggles it", async ({ page }) => {
    const example = preview(page, "label/wrapping");

    await example.locator("label").click();

    await expect(
      example.getByRole("checkbox", { name: "Remember this device" }),
    ).toBeChecked();
  });

  test("the playground changes the text and the code together", async ({
    page,
  }) => {
    const playground = page.locator("[data-playground]");

    await playground.getByLabel("children").fill("Work email");

    await expect(
      playground.getByRole("textbox", { name: "Work email" }),
    ).toBeVisible();
    await expect(playground.locator("pre")).toContainText(
      ">Work email</Label>",
    );
  });
});

test.describe("input page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/input");
  });

  test("is taller, with bigger text, on a phone than with a mouse", async ({
    page,
    isMobile,
  }) => {
    const input = preview(page, "input/basic").locator(".nuv-input");

    expect((await input.boundingBox())?.height).toBe(isMobile ? 44 : 40);
    expect(
      await input.evaluate((element) => getComputedStyle(element).fontSize),
    ).toBe(isMobile ? "16px" : "14px");
  });

  test("the invalid example is described by its message", async ({ page }) => {
    const input = preview(page, "input/states").getByRole("textbox", {
      name: "Invalid",
    });

    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription(
      "Enter an email address, like ada@example.com.",
    );
  });

  test("the playground sets the type and the code together", async ({
    page,
  }) => {
    const playground = page.locator("[data-playground]");
    const input = playground.locator(".nuv-input");

    await playground.getByLabel("type").selectOption("email");
    await playground.getByLabel("aria-invalid").check();

    await expect(input).toHaveAttribute("type", "email");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(playground.locator("pre")).toContainText(
      'type="email" placeholder="Type here" aria-invalid',
    );
  });
});

test.describe("textarea page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/textarea");
  });

  test("the auto-resize example grows with its text and stops at its limit", async ({
    page,
  }) => {
    const textarea = preview(page, "textarea/auto-resize").getByRole(
      "textbox",
      {
        name: "Reply",
      },
    );
    const before = (await textarea.boundingBox())?.height ?? 0;

    await textarea.fill(Array.from({ length: 5 }, () => "A line").join("\n"));
    await expect
      .poll(async () => (await textarea.boundingBox())?.height)
      .toBeGreaterThan(before + 40);

    await textarea.fill(Array.from({ length: 30 }, () => "A line").join("\n"));
    // 12rem, set on the example.
    await expect
      .poll(async () => (await textarea.boundingBox())?.height)
      .toBe(192);
  });

  test("the playground turns growing on", async ({ page }) => {
    const playground = page.locator("[data-playground]");

    await playground.getByLabel("autoResize").check();

    await expect(playground.locator(".nuv-textarea")).toHaveClass(
      /nuv-textarea--auto-resize/,
    );
    await expect(playground.locator("pre")).toContainText("autoResize");
  });
});

test.describe("native select page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/native-select");
  });

  test("an option can be picked, and the placeholder option can't be picked again", async ({
    page,
  }) => {
    const select = preview(page, "native-select/basic").getByLabel("Country");

    await select.selectOption("no");

    await expect(select).toHaveValue("no");
    await expect(select.locator("option").first()).toBeDisabled();
  });

  test("the arrow sits inside the box, at its end", async ({ page }) => {
    const example = preview(page, "native-select/basic");
    const box = await example.locator("select").boundingBox();
    const arrow = await example
      .locator(".nuv-native-select__icon")
      .boundingBox();
    if (!box || !arrow) throw new Error("nothing to measure");

    expect(arrow.x).toBeGreaterThan(box.x + box.width / 2);
    expect(arrow.x + arrow.width).toBeLessThan(box.x + box.width);
  });

  test("the playground turns it into a list box", async ({ page }) => {
    const playground = page.locator("[data-playground]");

    await playground.getByLabel("multiple").check();

    await expect(
      playground.getByRole("listbox", { name: "Fruit" }),
    ).toBeVisible();
    await expect(playground.locator(".nuv-native-select__icon")).toBeHidden();
  });
});

test.describe("field page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/field");
  });

  test("the label, the hint and the control are tied together", async ({
    page,
  }) => {
    const input = preview(page, "field/basic").getByRole("textbox", {
      name: "Work email",
    });

    await expect(input).toHaveAccessibleDescription("We send receipts here.");
  });

  test("an error marks the control invalid and joins its description", async ({
    page,
  }) => {
    const example = preview(page, "field/error");
    const input = example.getByRole("textbox", { name: "Workspace name" });
    const submit = example.getByRole("button", { name: "Create workspace" });
    await expect(input).not.toHaveAttribute("aria-invalid");

    await submit.click();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription(
      "It becomes part of your address. Use at least 3 lowercase letters, digits or hyphens.",
    );

    await input.fill("my-team");
    await submit.click();
    await expect(input).not.toHaveAttribute("aria-invalid");
    await expect(input).toHaveAccessibleDescription(
      "It becomes part of your address.",
    );
  });

  test("the required mark isn't part of the control's name", async ({
    page,
  }) => {
    const example = preview(page, "field/error");

    await expect(example.locator(".nuv-field__required")).toHaveText("*");
    await expect(
      example.getByRole("textbox", { name: "Workspace name", exact: true }),
    ).toHaveAttribute("required", "");
  });

  test("a click on the label beside a checkbox checks it", async ({ page }) => {
    const example = preview(page, "field/horizontal");
    const checkbox = example.getByRole("checkbox", {
      name: "Email me a weekly summary",
    });
    await expect(checkbox).toBeChecked();

    await example.locator(".nuv-label").first().click();

    await expect(checkbox).not.toBeChecked();
    await expect(checkbox).toHaveAccessibleDescription(
      "It goes out on Monday morning.",
    );
  });

  test("a select, a radio group and a slider each get the field's name", async ({
    page,
  }) => {
    const example = preview(page, "field/controls");

    await expect(example.getByRole("combobox", { name: "Role" })).toBeVisible();
    await expect(
      example.getByRole("radiogroup", { name: "Billing period" }),
    ).toBeVisible();
    await expect(
      example.getByRole("slider", { name: "Storage limit" }),
    ).toHaveAccessibleDescription("In gigabytes, from 0 to 100.");
  });

  test("the playground shows an error as soon as there's a message", async ({
    page,
  }) => {
    const playground = page.locator("[data-playground]");
    const input = playground.locator(".nuv-input");

    await playground.getByLabel("FieldError").fill("Enter an email address.");
    await playground.getByLabel("required").check();

    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAttribute("required", "");
    await expect(playground.locator(".nuv-field__error")).toHaveText(
      "Enter an email address.",
    );
    await expect(playground.locator("pre")).toContainText(
      "<FieldError>Enter an email address.</FieldError>",
    );
  });
});

test.describe("fieldset page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/fieldset");
  });

  test("the legend names the group", async ({ page }) => {
    await expect(
      preview(page, "fieldset/basic").getByRole("group", {
        name: "Shipping address",
      }),
    ).toBeVisible();
    await expect(
      preview(page, "fieldset/radios").getByRole("radiogroup", {
        name: "How should we reach you?",
      }),
    ).toBeVisible();
  });

  test("the playground disables everything inside at once", async ({
    page,
  }) => {
    const playground = page.locator("[data-playground]");

    await playground.getByLabel("disabled").check();

    await expect(
      playground.getByRole("textbox", { name: "Name" }),
    ).toBeDisabled();
    await expect(playground.locator(".nuv-checkbox")).toBeDisabled();
    await expect(
      playground.getByRole("button", { name: "Save" }),
    ).toBeDisabled();
    await expect(playground.locator("pre")).toContainText(
      "<Fieldset disabled>",
    );
  });
});

test.describe("input group page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/input-group");
  });

  test("a press on the text beside the input puts the cursor in it", async ({
    page,
  }) => {
    const example = preview(page, "input-group/basic");

    await example.locator(".nuv-input-group__addon").click();

    await expect(
      example.getByRole("textbox", { name: "Website" }),
    ).toBeFocused();
  });

  test("the clear button empties the search and gives it focus", async ({
    page,
  }) => {
    const example = preview(page, "input-group/search");
    const input = example.getByRole("textbox", { name: "Search" });
    await expect(input).toHaveValue("invoices");

    await example.getByRole("button", { name: "Clear search" }).click();

    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
    await expect(example.locator(".nuv-input-group__button")).toHaveCount(0);
  });

  test("the box takes its invalid edge from the input inside", async ({
    page,
  }) => {
    const groups = preview(page, "input-group/units").locator(
      ".nuv-input-group",
    );
    const edge = (index: number) =>
      groups
        .nth(index)
        .evaluate((element) => getComputedStyle(element).borderTopColor);

    await expect(
      preview(page, "input-group/units").getByRole("textbox", {
        name: "Discount",
      }),
    ).toHaveAttribute("aria-invalid", "true");
    expect(await edge(1)).not.toBe(await edge(0));
  });

  test("the playground adds and removes the parts", async ({ page }) => {
    const playground = page.locator("[data-playground]");

    await playground.getByLabel("after").fill(".com");
    await playground.getByLabel("InputGroupButton").uncheck();

    await expect(playground.locator(".nuv-input-group__addon")).toHaveText([
      "https://",
      ".com",
    ]);
    await expect(playground.locator(".nuv-input-group__button")).toHaveCount(0);
  });
});

test.describe("password input page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/password-input");
  });

  test("the button shows the password and hides it again", async ({ page }) => {
    const example = preview(page, "password-input/basic");
    const input = example.getByLabel("Password", { exact: true });
    await input.fill("correct horse");

    await example.getByRole("button", { name: "Show password" }).click();
    await expect(input).toHaveAttribute("type", "text");

    await example.getByRole("button", { name: "Hide password" }).click();
    await expect(input).toHaveAttribute("type", "password");
    await expect(input).toHaveValue("correct horse");
  });

  test("a new password says so to the browser, and is described by its rule", async ({
    page,
  }) => {
    const input = preview(page, "password-input/new-password").locator("input");

    await expect(input).toHaveAttribute("autocomplete", "new-password");
    await expect(input).toHaveAccessibleDescription("At least 12 characters.");
  });

  test("the playground renames the button", async ({ page }) => {
    const playground = page.locator("[data-playground]");

    await playground.getByLabel("showLabel").fill("Reveal");

    await expect(
      playground.getByRole("button", { name: "Reveal" }),
    ).toBeVisible();
    await expect(playground.locator("pre")).toContainText('showLabel="Reveal"');
  });
});

test.describe("one-time code page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/otp-field");
  });

  test("typing fills the boxes one after another", async ({ page }) => {
    const group = preview(page, "otp-field/basic").getByRole("group", {
      name: "Verification code",
    });
    const boxes = group.getByRole("textbox");
    await expect(boxes).toHaveCount(6);

    await boxes.first().focus();
    await page.keyboard.type("1234");

    await expect(boxes.nth(3)).toHaveValue("4");
    await expect(boxes.nth(4)).toBeFocused();
  });

  test("the grouped example draws one dash and names each box", async ({
    page,
  }) => {
    const example = preview(page, "otp-field/grouped");

    await expect(example.locator(".nuv-otp-field__separator")).toHaveCount(1);
    await expect(
      example.getByRole("textbox", { name: "Character 4 of 6" }),
    ).toBeVisible();
    await expect(
      example.getByRole("group", { name: "Code from your authenticator app" }),
    ).toHaveAccessibleDescription("It changes every 30 seconds.");
  });

  test("the last digit submits the form by itself", async ({ page }) => {
    const example = preview(page, "otp-field/auto-submit");
    await expect(example.locator("output")).toHaveText(
      "Nothing submitted yet.",
    );

    await example.getByRole("textbox").first().focus();
    await page.keyboard.type("1234");

    await expect(example.locator("output")).toHaveText(
      "Submitted a 4 digit PIN.",
    );
  });

  test("the playground changes the number of boxes", async ({ page }) => {
    const playground = page.locator("[data-playground]");

    await playground.getByLabel("length").selectOption("4");
    await playground.getByLabel("groupSize").selectOption("2");

    await expect(playground.locator(".nuv-otp-field__input")).toHaveCount(4);
    await expect(playground.locator(".nuv-otp-field__separator")).toHaveCount(
      1,
    );
    await expect(playground.locator("pre")).toContainText(
      "length={4} groupSize={2}",
    );
  });
});

test.describe("radio group page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/radio-group");
  });

  test("a click on a label picks its option, and only one stays picked", async ({
    page,
  }) => {
    const example = preview(page, "radio-group/basic");
    await expect(example.getByRole("radio", { name: "Team" })).toBeChecked();

    await example.locator("label", { hasText: "Company" }).click();

    await expect(example.getByRole("radio", { name: "Company" })).toBeChecked();
    await expect(example.getByRole("radio", { checked: true })).toHaveCount(1);
  });

  test("the controlled example follows the picked option", async ({ page }) => {
    const example = preview(page, "radio-group/controlled");
    await expect(example.locator("output")).toHaveText("You pay $12 a month.");

    await example.getByRole("radio", { name: "Yearly" }).click();

    await expect(example.locator("output")).toHaveText("You pay $120 a year.");
  });

  test("the playground lays the options out side by side", async ({ page }) => {
    const playground = page.locator("[data-playground]");
    const top = async (name: string) =>
      (await playground.getByRole("radio", { name }).boundingBox())?.y;
    expect(await top("Team")).not.toBe(await top("Free"));

    await playground.getByLabel("orientation").selectOption("horizontal");

    expect(await top("Team")).toBe(await top("Free"));
    await expect(playground.locator("pre")).toContainText(
      'orientation="horizontal"',
    );
  });
});

test.describe("slider page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/slider");
  });

  test("the arrow keys move the handle and the number beside it", async ({
    page,
  }) => {
    const example = preview(page, "slider/basic");
    const handle = example.getByRole("slider", { name: "Volume" });

    await handle.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("End");

    await expect(handle).toHaveAttribute("aria-valuenow", "100");
    await expect(example.locator("output")).toHaveText("100%");
  });

  test("the range has a handle for each end, each moved by itself", async ({
    page,
  }) => {
    const example = preview(page, "slider/range");
    const low = example.getByRole("slider", { name: "Lowest price" });
    const high = example.getByRole("slider", { name: "Highest price" });
    await expect(example.getByRole("group", { name: "Price" })).toBeVisible();

    await low.focus();
    await page.keyboard.press("ArrowRight");
    await expect(low).toHaveAttribute("aria-valuenow", "250");

    await high.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(high).toHaveAttribute("aria-valuenow", "550");
    await expect(example.locator("output")).toHaveText("$250 to $550");
  });

  test("the playground adds a second handle", async ({ page }) => {
    const playground = page.locator("[data-playground]");
    await expect(playground.getByRole("slider")).toHaveCount(1);

    await playground.getByLabel("two handles").check();

    await expect(playground.getByRole("slider")).toHaveCount(2);
    await expect(playground.locator("pre")).toContainText(
      "defaultValue={[25, 75]}",
    );
  });
});

test.describe("toggle page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/toggle");
  });

  test("a press turns it on and another turns it off", async ({ page }) => {
    const toggle = preview(page, "toggle/basic").getByRole("button", {
      name: "Show archived",
    });

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    await toggle.focus();
    await page.keyboard.press("Space");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  test("an icon-only toggle is square and has a name", async ({
    page,
    isMobile,
  }) => {
    const box = await preview(page, "toggle/icons")
      .getByRole("button", { name: "Italic" })
      .boundingBox();
    const side = isMobile ? 44 : 40;

    expect(box?.width).toBe(side);
    expect(box?.height).toBe(side);
  });

  test("the playground sets the variant and the code together", async ({
    page,
  }) => {
    const playground = page.locator("[data-playground]");

    await playground.getByLabel("variant").selectOption("outline");
    await playground.getByLabel("pressed").check();

    await expect(playground.locator(".nuv-toggle")).toHaveClass(
      /nuv-toggle--outline/,
    );
    await expect(playground.locator(".nuv-toggle")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(playground.locator("pre")).toHaveText(
      '<Toggle variant="outline" pressed>Pin to top</Toggle>',
    );
  });
});

test.describe("toggle group page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/toggle-group");
  });

  test("picking one lets go of the other", async ({ page }) => {
    const example = preview(page, "toggle-group/basic");

    await example.getByRole("radio", { name: "Board" }).click();

    await expect(example.getByRole("radio", { name: "Board" })).toBeChecked();
    await expect(
      example.getByRole("radio", { name: "List" }),
    ).not.toBeChecked();
  });

  test("with type multiple, several stay pressed", async ({ page }) => {
    const example = preview(page, "toggle-group/multiple");

    await example.getByRole("button", { name: "Italic" }).click();

    await expect(example.locator('[aria-pressed="true"]')).toHaveCount(2);
  });

  test("the example that always keeps one picked ignores a second press", async ({
    page,
  }) => {
    const left = preview(page, "toggle-group/required").getByRole("radio", {
      name: "Left",
    });

    await left.click();

    await expect(left).toBeChecked();
  });

  test("the playground switches between one value and several", async ({
    page,
  }) => {
    const playground = page.locator("[data-playground]");
    await expect(playground.getByRole("radiogroup")).toBeVisible();

    await playground.getByLabel("type").selectOption("multiple");

    await expect(playground.getByRole("toolbar")).toBeVisible();
    await expect(playground.locator("pre")).toContainText('type="multiple"');
  });
});

test.describe("button group page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/button-group");
  });

  test("the buttons are joined, with round corners only at the ends", async ({
    page,
  }) => {
    const example = preview(page, "button-group/basic");
    const radius = (name: string) =>
      example
        .getByRole("button", { name })
        .evaluate((element) => getComputedStyle(element).borderRadius);

    await expect(
      example.getByRole("group", { name: "Message actions" }),
    ).toBeVisible();
    expect(await radius("Reply")).toBe("6px 0px 0px 6px");
    expect(await radius("Forward")).toBe("0px");
    expect(await radius("Archive")).toBe("0px 6px 6px 0px");
  });

  test("the arrow beside the main action opens its menu", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const example = preview(page, "button-group/split");

    await example.getByRole("button", { name: "More ways to publish" }).click();

    await expect(
      page.getByRole("menuitem", { name: "Save as a draft" }),
    ).toBeVisible();
  });

  test("an input and a button are one height and share an edge", async ({
    page,
  }) => {
    const example = preview(page, "button-group/with-input");
    const input = await example.getByRole("textbox").boundingBox();
    const button = await example.locator(".nuv-button").boundingBox();
    if (!input || !button) throw new Error("nothing to measure");

    expect(input.height).toBe(button.height);
    expect(button.x).toBeCloseTo(input.x + input.width - 1, 0);
  });

  test("the playground stacks the buttons", async ({ page }) => {
    const playground = page.locator("[data-playground]");

    await playground.getByLabel("orientation").selectOption("vertical");

    await expect(playground.locator(".nuv-button-group")).toHaveClass(
      /nuv-button-group--vertical/,
    );
    await expect(playground.locator("pre")).toContainText(
      'orientation="vertical"',
    );
  });
});

test.describe("file upload page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/file-upload");
  });

  test("a chosen file is listed and can be taken out again", async ({
    page,
  }) => {
    const example = preview(page, "file-upload/basic");
    const input = example.getByLabel("Signed contract");

    await input.setInputFiles(file("contract.pdf", "application/pdf", 2048));
    await expect(example.locator(".nuv-file-upload__name")).toHaveText(
      "contract.pdf",
    );

    await example.getByRole("button", { name: "Remove contract.pdf" }).click();
    await expect(example.locator(".nuv-file-upload__item")).toHaveCount(0);
    await expect(input).toBeFocused();
  });

  test("the input covers the drop area and is described by its text", async ({
    page,
  }) => {
    const example = preview(page, "file-upload/basic");
    const zone = await example
      .locator(".nuv-file-upload__dropzone")
      .boundingBox();
    const input = await example.locator("input").boundingBox();

    expect(input?.width).toBe(zone ? zone.width - 2 : 0);
    await expect(example.locator("input")).toHaveAccessibleDescription(
      "Drop files here, or choose them from your device",
    );
  });

  test("a file that's too big is turned away, and the field says why", async ({
    page,
  }) => {
    const example = preview(page, "file-upload/limits");
    const input = example.getByLabel("Product photos");

    await input.setInputFiles([
      file("front.png", "image/png"),
      file("huge.png", "image/png", 3 * 1024 * 1024),
    ]);

    await expect(example.locator(".nuv-file-upload__name")).toHaveText([
      "front.png",
    ]);
    await expect(example.locator(".nuv-field__error")).toHaveText(
      "huge.png is over 2 MB.",
    );
    await expect(input).toHaveAttribute("aria-invalid", "true");
  });

  test("the playground hides the list", async ({ page }) => {
    const playground = page.locator("[data-playground]");
    const input = playground.getByLabel("Attachments");
    await input.setInputFiles(file("a.txt"));
    await expect(playground.locator(".nuv-file-upload__item")).toHaveCount(1);

    await playground.getByLabel("showList").uncheck();

    await expect(playground.locator(".nuv-file-upload__list")).toHaveCount(0);
    await expect(playground.locator("pre")).toContainText("showList={false}");
  });
});

test.describe("forms guide", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/forms");
  });

  test("the browser stops an empty form and sends a filled one", async ({
    page,
  }) => {
    const example = preview(page, "forms/native");
    const email = example.getByRole("textbox", { name: "Email" });
    const send = example.getByRole("button", { name: "Send invite" });

    await send.click();
    await expect(example.locator("output")).toHaveText("");
    expect(
      await email.evaluate((input: HTMLInputElement) => input.validity.valid),
    ).toBe(false);

    await email.fill("ada@example.com");
    await example.getByLabel("Team").selectOption("design");
    await send.click();
    await expect(example.locator("output")).toHaveText(
      "Sent: ada@example.com, design.",
    );
  });

  test("React Hook Form's errors reach each field, and focus goes to the first", async ({
    page,
  }) => {
    const example = preview(page, "forms/react-hook-form");
    const name = example.getByRole("textbox", { name: "Full name" });
    const email = example.getByRole("textbox", { name: "Email" });

    await example.getByRole("button", { name: "Send invite" }).click();

    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toHaveAccessibleDescription("Enter their name.");
    // What the table on the page says a screen reader is told.
    await expect(email).toHaveAttribute("required", "");
    await expect(email).toHaveAccessibleDescription(
      "The invite goes to this address. Enter their email address.",
    );
    await expect(
      example.getByRole("combobox", { name: "Role" }),
    ).toHaveAttribute("aria-invalid", "true");
    await expect(
      example.getByRole("checkbox", { name: "They've agreed to be contacted" }),
    ).toHaveAccessibleDescription("Confirm that they've agreed.");
    await expect(example.locator(".nuv-field__error")).toHaveCount(4);
  });

  test("a filled form goes through, and the errors are gone", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const example = preview(page, "forms/react-hook-form");
    const send = example.getByRole("button", { name: "Send invite" });
    await send.click();
    await expect(example.locator(".nuv-field__error")).toHaveCount(4);

    await example
      .getByRole("textbox", { name: "Full name" })
      .fill("Ada Lovelace");
    await example
      .getByRole("textbox", { name: "Email" })
      .fill("ada@example.com");
    await example.getByRole("combobox", { name: "Role" }).click();
    await page.getByRole("option", { name: "Editor" }).click();
    await example.getByRole("checkbox").click();
    await send.click();

    await expect(example.locator("output")).toHaveText(
      "Invite sent to ada@example.com.",
    );
    await expect(example.locator(".nuv-field__error")).toHaveCount(0);
    await expect(example.locator("[aria-invalid]")).toHaveCount(0);
  });
});
