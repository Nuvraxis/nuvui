import {
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@nuvui/react";

export default function Example() {
  return (
    <Item variant="outline" style={{ maxInlineSize: "32rem" }}>
      <ItemMedia variant="icon">
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
          <rect x="3" y="7" width="10" height="7" rx="1.5" />
          <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
        </svg>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Two-step sign-in</ItemTitle>
        <ItemDescription>
          Ask for a code from your phone as well as your password.
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button intent="secondary" size="sm">
          Set up
        </Button>
      </ItemActions>
    </Item>
  );
}
