import { Avatar, AvatarFallback, AvatarGroup } from "@nuvui/react";

const people = [
  ["AL", "Ada Lovelace"],
  ["GH", "Grace Hopper"],
  ["KJ", "Katherine Johnson"],
] as const;

export default function Example() {
  return (
    <AvatarGroup role="group" aria-label="Assigned to">
      {people.map(([initials, name]) => (
        <Avatar key={initials} role="img" aria-label={name}>
          <AvatarFallback aria-hidden="true">{initials}</AvatarFallback>
        </Avatar>
      ))}
      <Avatar role="img" aria-label="and 4 more">
        <AvatarFallback aria-hidden="true">+4</AvatarFallback>
      </Avatar>
    </AvatarGroup>
  );
}
