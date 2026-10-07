import "../../styles/index.scss";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectNoViolations, renderThemed, themes } from "../../../test/themed";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
  type AvatarProps,
} from "./avatar";

// A two by one picture, so that cropping can be seen.
const picture =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100'%3E%3Crect width='200' height='100' fill='%23336'/%3E%3C/svg%3E";
const broken = "data:image/png;base64,AAAA";

function Example({ src = picture, ...props }: AvatarProps & { src?: string }) {
  return (
    <Avatar data-testid="avatar" {...props}>
      <AvatarImage src={src} alt="Ada Lovelace" />
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>
  );
}

const avatar = () => page.getByTestId("avatar").element();
const image = () => page.getByRole("img", { name: "Ada Lovelace" });
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);

describe("rendering", () => {
  test("shows the picture once it has loaded, and not the fallback", async () => {
    await render(<Example />);

    await expect.element(image()).toBeVisible();
    await expect.element(image()).toHaveClass("nuv-avatar__image");
    expect(page.getByText("AL").elements()).toHaveLength(0);
  });

  test("shows the fallback when the picture can't be loaded", async () => {
    await render(<Example src={broken} />);

    await expect.element(page.getByText("AL")).toBeVisible();
    await expect
      .element(page.getByText("AL"))
      .toHaveClass("nuv-avatar__fallback");
    expect(avatar().querySelector("img")).toBeNull();
  });

  test("shows the fallback when there's no picture at all", async () => {
    await render(
      <Avatar>
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );

    await expect.element(page.getByText("AL")).toBeVisible();
  });

  test("delayMs holds the fallback back", async () => {
    await render(
      <Avatar data-testid="avatar">
        <AvatarFallback delayMs={300}>AL</AvatarFallback>
      </Avatar>,
    );

    expect(avatar().textContent).toBe("");
    await expect.element(page.getByText("AL")).toBeVisible();
  });

  test("tells you when the picture loads or fails", async () => {
    const statuses: string[] = [];
    await render(
      <Avatar>
        <AvatarImage
          src={broken}
          alt=""
          onLoadingStatusChange={(status) => statuses.push(status)}
        />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );

    await expect.poll(() => statuses.at(-1)).toBe("error");
  });

  test("every part forwards its ref and keeps a className", async () => {
    const refs = {
      group: createRef<HTMLDivElement>(),
      avatar: createRef<HTMLSpanElement>(),
      image: createRef<HTMLImageElement>(),
      fallback: createRef<HTMLSpanElement>(),
    };
    await render(
      <AvatarGroup ref={refs.group} className="mine">
        <Avatar ref={refs.avatar} className="mine">
          <AvatarImage ref={refs.image} className="mine" src={picture} alt="" />
        </Avatar>
        <Avatar>
          <AvatarFallback ref={refs.fallback} className="mine">
            AL
          </AvatarFallback>
        </Avatar>
      </AvatarGroup>,
    );

    await expect.poll(() => refs.image.current).not.toBeNull();
    expect(refs.group.current?.className).toBe("nuv-avatar-group mine");
    expect(refs.avatar.current?.className).toBe(
      "nuv-avatar nuv-avatar--md mine",
    );
    expect(refs.image.current?.className).toBe("nuv-avatar__image mine");
    expect(refs.fallback.current?.className).toBe("nuv-avatar__fallback mine");
  });
});

describe("layout", () => {
  test.each([
    ["sm", 32],
    ["md", 40],
    ["lg", 56],
  ] as const)("size %s is %ipx each way", async (size, pixels) => {
    await render(<Example size={size} />);

    expect(rect(avatar()).width).toBe(pixels);
    expect(rect(avatar()).height).toBe(pixels);
  });

  test("is a circle by default, and a rounded square when asked", async () => {
    const screen = await render(<Example />);
    expect(
      Number.parseFloat(style(avatar()).borderTopLeftRadius),
    ).toBeGreaterThan(20);
    await screen.unmount();

    await render(<Example shape="square" />);
    expect(avatar().classList.contains("nuv-avatar--square")).toBe(true);
    expect(style(avatar()).borderTopLeftRadius).toBe("6px");
  });

  test("a picture that isn't square fills the avatar and is cropped", async () => {
    await render(<Example />);
    await expect.element(image()).toBeVisible();

    expect(rect(image().element()).width).toBe(40);
    expect(rect(image().element()).height).toBe(40);
    expect(style(image().element()).objectFit).toBe("cover");
    expect(style(avatar()).overflow).toBe("hidden");
  });

  test("doesn't shrink in a row that's short of room", async () => {
    await render(
      <div style={{ display: "flex", width: 60 }}>
        <Example />
        <span>{"a long name ".repeat(6)}</span>
      </div>,
    );

    expect(rect(avatar()).width).toBe(40);
  });

  test("avatars in a group overlap, each with a ring", async () => {
    await render(
      <AvatarGroup>
        {["AL", "GH", "KJ"].map((initials) => (
          <Avatar key={initials} data-testid={initials}>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        ))}
      </AvatarGroup>,
    );
    const box = (id: string) => rect(page.getByTestId(id).element());

    expect(box("GH").left).toBe(box("AL").right - 8);
    expect(box("KJ").left).toBe(box("GH").right - 8);
    expect(style(page.getByTestId("AL").element()).boxShadow).not.toBe("none");
  });

  test("a group overlaps the other way in a right-to-left layout", async () => {
    await render(
      <AvatarGroup dir="rtl">
        {["AL", "GH"].map((initials) => (
          <Avatar key={initials} data-testid={initials}>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        ))}
      </AvatarGroup>,
    );
    const box = (id: string) => rect(page.getByTestId(id).element());

    expect(box("GH").right).toBe(box("AL").left + 8);
  });
});

describe("styles", () => {
  test("the fallback's letters are in capitals and centered", async () => {
    await render(
      <Avatar>
        <AvatarFallback>al</AvatarFallback>
      </Avatar>,
    );
    const fallback = style(page.getByText("al").element());

    expect(fallback.textTransform).toBe("uppercase");
    expect(fallback.justifyContent).toBe("center");
    expect(fallback.alignItems).toBe("center");
  });

  test("component variables change the look", async () => {
    await render(
      <AvatarGroup
        style={
          {
            "--nuv-avatar-size": "48px",
            "--nuv-avatar-radius": "4px",
            "--nuv-avatar-bg": "rgb(10, 20, 30)",
            "--nuv-avatar-fg": "rgb(200, 210, 220)",
            "--nuv-avatar-font-size": "20px",
            "--nuv-avatar-group-overlap": "-20px",
            "--nuv-avatar-group-ring": "rgb(1, 2, 3)",
            "--nuv-avatar-group-ring-width": "4px",
          } as never
        }
      >
        <Avatar data-testid="first">
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <Avatar data-testid="second">
          <AvatarFallback>GH</AvatarFallback>
        </Avatar>
      </AvatarGroup>,
    );
    const first = page.getByTestId("first").element();
    const fallback = style(page.getByText("AL").element());

    expect(rect(first).width).toBe(48);
    expect(style(first).borderTopLeftRadius).toBe("4px");
    expect(style(first).fontSize).toBe("20px");
    expect(style(first).boxShadow).toBe("rgb(1, 2, 3) 0px 0px 0px 4px");
    expect(fallback.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(fallback.color).toBe("rgb(200, 210, 220)");
    expect(rect(page.getByTestId("second").element()).left).toBe(
      rect(first).right - 20,
    );
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, with a picture and with initials", async () => {
    const screen = await renderThemed(
      theme,
      <AvatarGroup>
        <Example />
        <Avatar>
          <AvatarFallback>GH</AvatarFallback>
        </Avatar>
      </AvatarGroup>,
    );
    await expect.element(image()).toBeVisible();

    await expectNoViolations(screen.container);
  });
});
