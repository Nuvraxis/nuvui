import { Avatar, AvatarFallback } from "@nuvui/react";

export default function Example() {
  return (
    <>
      <Avatar size="sm">
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar size="md">
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar size="lg" shape="square">
        <AvatarFallback>NT</AvatarFallback>
      </Avatar>
    </>
  );
}
