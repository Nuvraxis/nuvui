import {
  Avatar,
  AvatarFallback,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@nuvui/react";

const people = [
  { initials: "AO", name: "Ada Osei", role: "Owner", variant: "plain" },
  {
    initials: "GL",
    name: "Grace Lindqvist",
    role: "Admin",
    variant: "outline",
  },
  { initials: "TM", name: "Tomás Marín", role: "Member", variant: "muted" },
] as const;

export default function Example() {
  return (
    <ItemGroup
      aria-label="The three variants"
      style={{ inlineSize: "100%", maxInlineSize: "24rem", gap: "0.5rem" }}
    >
      {people.map((person) => (
        <Item key={person.name} variant={person.variant} size="sm">
          <ItemMedia>
            <Avatar size="sm">
              <AvatarFallback>{person.initials}</AvatarFallback>
            </Avatar>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{person.name}</ItemTitle>
            <ItemDescription>
              {person.role}, as variant="{person.variant}"
            </ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  );
}
