import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@nuvui/react";

export default function Example() {
  return (
    <Menubar aria-label="Document">
      <MenubarMenu>
        <MenubarTrigger>Share</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Copy link</MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>Export as</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>PDF</MenubarItem>
              <MenubarItem>Word document</MenubarItem>
              <MenubarItem>Plain text</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
