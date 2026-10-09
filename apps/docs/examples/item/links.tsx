import {
  Badge,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@nuvui/react";

const pages = [
  {
    href: "#profile",
    title: "Profile",
    text: "Your name, your picture and your time zone.",
  },
  {
    href: "#billing",
    title: "Billing",
    text: "Cards, invoices and the plan.",
    badge: "Past due",
  },
  {
    href: "#members",
    title: "Members",
    text: "Who's on the team, and what each can do.",
  },
];

function Arrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3.5l4.5 4.5L6 12.5" />
    </svg>
  );
}

export default function Example() {
  return (
    <ItemGroup
      variant="outline"
      aria-label="Settings"
      style={{ inlineSize: "100%", maxInlineSize: "28rem" }}
    >
      {pages.map((page) => (
        <Item key={page.href} asChild>
          <a href={page.href}>
            <ItemContent>
              <ItemTitle>{page.title}</ItemTitle>
              <ItemDescription>{page.text}</ItemDescription>
            </ItemContent>
            <ItemActions>
              {page.badge ? <Badge intent="danger">{page.badge}</Badge> : null}
              <Arrow />
            </ItemActions>
          </a>
        </Item>
      ))}
    </ItemGroup>
  );
}
