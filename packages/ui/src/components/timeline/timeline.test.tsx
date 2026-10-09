import "../../styles/index.scss";
import { contrast } from "@nuvui/tooling/test/contrast";
import {
  expectNoViolations,
  renderThemed,
  themeAttributes,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Timeline,
  TimelineContent,
  TimelineDescription,
  TimelineItem,
  TimelineMarker,
  type TimelineMarkerProps,
  TimelineTime,
  TimelineTitle,
} from "./timeline";

const intents = ["neutral", "primary", "success", "warning", "danger"] as const;

const events = [
  { id: "paid", title: "Invoice paid", intent: "success" },
  { id: "sent", title: "Invoice sent", intent: "primary" },
  { id: "made", title: "Invoice created", intent: "neutral" },
] satisfies {
  id: string;
  title: string;
  intent: TimelineMarkerProps["intent"];
}[];

function Example() {
  return (
    <Timeline data-testid="timeline" aria-label="Invoice history">
      {events.map((event) => (
        <TimelineItem key={event.id} data-testid={event.id}>
          <TimelineMarker
            data-testid={`${event.id}-marker`}
            intent={event.intent}
          />
          <TimelineContent data-testid={`${event.id}-content`}>
            <TimelineTitle>{event.title}</TimelineTitle>
            <TimelineDescription>By Ada Osei</TimelineDescription>
            <TimelineTime dateTime="2026-10-01T09:30:00Z">
              1 October, 09:30
            </TimelineTime>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}

const part = (id: string) => page.getByTestId(id).element();
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);
const line = (id: string) => getComputedStyle(part(id), "::before");

describe("rendering", () => {
  test("is a named list with one item for each event, in order", async () => {
    await render(<Example />);

    const list = page.getByRole("list", { name: "Invoice history" });
    await expect.element(list).toBeVisible();
    expect(part("timeline").tagName).toBe("OL");
    await expect.element(page.getByRole("listitem").first()).toBeVisible();
    expect(page.getByRole("listitem").elements()).toHaveLength(3);
    expect(
      page
        .getByRole("listitem")
        .elements()
        .map((item) => item.querySelector(".nuv-timeline__title")?.textContent),
    ).toEqual(["Invoice paid", "Invoice sent", "Invoice created"]);
  });

  test("the marker is hidden from screen readers and has its intent's class", async () => {
    await render(<Example />);

    expect(part("paid-marker").getAttribute("aria-hidden")).toBe("true");
    expect(part("paid-marker").className).toBe(
      "nuv-timeline__marker nuv-timeline__marker--success",
    );
    expect(part("made-marker").className).toBe(
      "nuv-timeline__marker nuv-timeline__marker--neutral",
    );
  });

  test("the time is a time element with the exact time in it", async () => {
    await render(<Example />);
    const time = part("paid").querySelector("time");

    expect(time?.className).toBe("nuv-timeline__time");
    expect(time?.dateTime).toBe("2026-10-01T09:30:00Z");
    expect(time?.textContent).toBe("1 October, 09:30");
  });

  test("every part forwards its ref, a className and other props", async () => {
    const refs = {
      timeline: createRef<HTMLOListElement>(),
      item: createRef<HTMLLIElement>(),
      marker: createRef<HTMLSpanElement>(),
      content: createRef<HTMLDivElement>(),
      title: createRef<HTMLParagraphElement>(),
      description: createRef<HTMLParagraphElement>(),
      time: createRef<HTMLTimeElement>(),
    };
    await render(
      <Timeline ref={refs.timeline} className="mine" id="timeline">
        <TimelineItem ref={refs.item} className="mine" id="item">
          <TimelineMarker ref={refs.marker} className="mine" id="marker" />
          <TimelineContent ref={refs.content} className="mine" id="content">
            <TimelineTitle ref={refs.title} className="mine" id="title" />
            <TimelineDescription
              ref={refs.description}
              className="mine"
              id="description"
            />
            <TimelineTime ref={refs.time} className="mine" id="time" />
          </TimelineContent>
        </TimelineItem>
      </Timeline>,
    );

    for (const [name, ref] of Object.entries(refs)) {
      expect(ref.current?.id, name).toBe(name);
      expect(ref.current?.classList.contains("mine"), name).toBe(true);
    }
  });
});

describe("layout", () => {
  test("the list has no numbers and no indent", async () => {
    await render(<Example />);

    expect(style(part("timeline")).listStyleType).toBe("none");
    expect(style(part("timeline")).paddingInlineStart).toBe("0px");
    expect(style(part("timeline")).marginTop).toBe("0px");
  });

  test("the marker is a 24 pixel circle with the text beside it", async () => {
    await render(<Example />);
    const marker = rect(part("paid-marker"));
    const content = rect(part("paid-content"));

    expect(marker.width).toBe(24);
    expect(marker.height).toBe(24);
    expect(
      Number.parseFloat(style(part("paid-marker")).borderTopLeftRadius),
    ).toBeGreaterThanOrEqual(12);
    expect(content.left).toBeGreaterThan(marker.right);
  });

  test("the first line of text is level with the middle of the marker", async () => {
    await render(<Example />);
    const marker = rect(part("paid-marker"));
    const title = rect(
      part("paid").querySelector(".nuv-timeline__title") as Element,
    );

    expect(
      Math.abs(marker.top + marker.height / 2 - (title.top + title.height / 2)),
    ).toBeLessThanOrEqual(1);
  });

  test("a line runs from under each marker to the next, and none after the last", async () => {
    await render(<Example />);
    const marker = rect(part("paid-marker"));
    const item = rect(part("paid"));

    expect(line("paid").content).toBe('""');
    expect(line("paid").borderInlineStartWidth).toBe("1px");
    expect(line("paid").borderInlineStartStyle).toBe("solid");
    // Under the middle of the marker.
    expect(
      Math.abs(
        Number.parseFloat(line("paid").left) -
          (marker.left - item.left + marker.width / 2),
      ),
    ).toBeLessThanOrEqual(1);
    // From under the marker to the end of the item, a little short of each.
    expect(Number.parseFloat(line("paid").top)).toBeGreaterThan(marker.height);
    expect(Number.parseFloat(line("paid").height)).toBeGreaterThan(10);
    expect(line("made").content).toBe("none");
  });

  test("there's room between two events and none after the last", async () => {
    await render(<Example />);

    expect(
      rect(part("sent")).top - rect(part("paid-content")).bottom,
    ).toBeGreaterThanOrEqual(20);
    expect(style(part("made")).paddingBottom).toBe("0px");
  });

  test("an icon sits in the middle of its marker", async () => {
    await render(
      <Timeline>
        <TimelineItem>
          <TimelineMarker data-testid="marker" intent="success">
            <svg data-testid="icon" width="12" height="12" />
          </TimelineMarker>
          <TimelineContent>
            <TimelineTitle>Deployed</TimelineTitle>
          </TimelineContent>
        </TimelineItem>
      </Timeline>,
    );
    const marker = rect(part("marker"));
    const icon = rect(part("icon"));

    expect(
      Math.abs(marker.left + marker.width / 2 - (icon.left + icon.width / 2)),
    ).toBeLessThanOrEqual(0.5);
    expect(
      Math.abs(marker.top + marker.height / 2 - (icon.top + icon.height / 2)),
    ).toBeLessThanOrEqual(0.5);
  });

  test("long text wraps inside a narrow timeline", async () => {
    await render(
      <div style={{ width: 160 }}>
        <Timeline data-testid="timeline">
          <TimelineItem>
            <TimelineMarker />
            <TimelineContent>
              <TimelineTitle>
                Averyveryverylongwordthatwillnotfitonalineofitsown
              </TimelineTitle>
            </TimelineContent>
          </TimelineItem>
        </Timeline>
      </div>,
    );

    expect(part("timeline").scrollWidth).toBeLessThanOrEqual(
      part("timeline").clientWidth,
    );
  });
});

describe("styles", () => {
  test("every intent has a marker of its own", async () => {
    await render(
      <Timeline>
        {intents.map((intent) => (
          <TimelineItem key={intent}>
            <TimelineMarker data-testid={intent} intent={intent} />
            <TimelineContent>
              <TimelineTitle>{intent}</TimelineTitle>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>,
    );
    const fills = intents.map((intent) => style(part(intent)).backgroundColor);

    expect(new Set(fills).size).toBe(intents.length);
  });

  test("component variables change the look", async () => {
    await render(
      <div
        style={
          {
            "--nuv-timeline-fg": "rgb(1, 2, 3)",
            "--nuv-timeline-muted-fg": "rgb(150, 160, 170)",
            "--nuv-timeline-marker-size": "40px",
            "--nuv-timeline-marker-bg": "rgb(10, 20, 30)",
            "--nuv-timeline-marker-fg": "rgb(200, 210, 220)",
            "--nuv-timeline-marker-border": "rgb(40, 50, 60)",
            "--nuv-timeline-marker-radius": "3px",
            "--nuv-timeline-line": "rgb(70, 80, 90)",
            "--nuv-timeline-line-width": "4px",
            "--nuv-timeline-gap": "30px",
            "--nuv-timeline-space": "50px",
          } as never
        }
      >
        <Example />
      </div>,
    );
    const marker = style(part("paid-marker"));

    expect(style(part("timeline")).color).toBe("rgb(1, 2, 3)");
    expect(style(part("paid").querySelector("time") as Element).color).toBe(
      "rgb(150, 160, 170)",
    );
    expect(rect(part("paid-marker")).width).toBe(40);
    expect(marker.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(marker.color).toBe("rgb(200, 210, 220)");
    expect(marker.borderTopColor).toBe("rgb(40, 50, 60)");
    expect(marker.borderTopLeftRadius).toBe("3px");
    expect(line("paid").borderInlineStartColor).toBe("rgb(70, 80, 90)");
    expect(line("paid").borderInlineStartWidth).toBe("4px");
    expect(style(part("paid")).columnGap).toBe("30px");
    expect(style(part("paid")).paddingBottom).toBe("50px");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, with a marker of every intent", async () => {
    const screen = await renderThemed(
      theme,
      <Timeline aria-label="Every kind of event">
        {intents.map((intent) => (
          <TimelineItem key={intent}>
            <TimelineMarker intent={intent}>
              <svg aria-hidden="true" width="12" height="12" />
            </TimelineMarker>
            <TimelineContent>
              <TimelineTitle>{`An event that is ${intent}`}</TimelineTitle>
              <TimelineDescription>What happened.</TimelineDescription>
              <TimelineTime dateTime="2026-10-01">1 October</TimelineTime>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>,
    );

    await expectNoViolations(screen.container);
  });

  test("an icon in a marker reaches 3:1 against the marker", async () => {
    await render(
      <div {...themeAttributes(theme)}>
        <Timeline>
          {intents.map((intent) => (
            <TimelineItem key={intent}>
              <TimelineMarker data-testid={intent} intent={intent} />
              <TimelineContent>
                <TimelineTitle>{intent}</TimelineTitle>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </div>,
    );

    for (const intent of intents) {
      const look = style(part(intent));
      expect(
        contrast(look.color, look.backgroundColor),
        intent,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  test("the ring of a plain marker reaches 3:1 against the page", async () => {
    await render(
      <div
        data-testid="page"
        {...themeAttributes(theme)}
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <Timeline>
          <TimelineItem>
            <TimelineMarker data-testid="marker" />
            <TimelineContent>
              <TimelineTitle>Created</TimelineTitle>
            </TimelineContent>
          </TimelineItem>
        </Timeline>
      </div>,
    );

    expect(
      contrast(
        style(part("marker")).borderTopColor,
        style(part("page")).backgroundColor,
      ),
    ).toBeGreaterThanOrEqual(3);
  });
});
