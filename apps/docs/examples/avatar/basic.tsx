import { Avatar, AvatarFallback, AvatarImage } from "@nuvui/react";

// A picture kept in the file, so the example doesn't depend on another site.
const picture =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23314158'/%3E%3Ccircle cx='40' cy='30' r='14' fill='%23e2e8f0'/%3E%3Cpath d='M12 80a28 28 0 0 1 56 0z' fill='%23e2e8f0'/%3E%3C/svg%3E";

export default function Example() {
  return (
    <>
      <Avatar>
        <AvatarImage src={picture} alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="data:image/png;base64,AAAA" alt="Grace Hopper" />
        <AvatarFallback>GH</AvatarFallback>
      </Avatar>
    </>
  );
}
