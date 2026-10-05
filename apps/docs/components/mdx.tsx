import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Changelog } from "@/components/changelog";
import { AccordionPlayground } from "@/components/playground/accordion";
import { ButtonPlayground } from "@/components/playground/button";
import { CheckboxPlayground } from "@/components/playground/checkbox";
import { DialogPlayground } from "@/components/playground/dialog";
import { DropdownMenuPlayground } from "@/components/playground/dropdown-menu";
import { PopoverPlayground } from "@/components/playground/popover";
import { SelectPlayground } from "@/components/playground/select";
import { SwitchPlayground } from "@/components/playground/switch";
import { TabsPlayground } from "@/components/playground/tabs";
import { ToastPlayground } from "@/components/playground/toast";
import { TooltipPlayground } from "@/components/playground/tooltip";
import { Preview } from "@/components/preview";
import { PropsTable } from "@/components/props-table";
import { ScssBreakpoints, ScssMixins } from "@/components/scss-reference";
import { BemClasses, CssVariables } from "@/components/style-reference";
import { TailwindTheme } from "@/components/tailwind-theme";
import { TokenEditor } from "@/components/token-editor";
import {
  ColorScales,
  SemanticColors,
  TokenList,
} from "@/components/token-reference";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Preview,
    PropsTable,
    CssVariables,
    BemClasses,
    TokenEditor,
    SemanticColors,
    ColorScales,
    TokenList,
    TailwindTheme,
    ScssMixins,
    ScssBreakpoints,
    Changelog,
    AccordionPlayground,
    ButtonPlayground,
    CheckboxPlayground,
    DialogPlayground,
    DropdownMenuPlayground,
    PopoverPlayground,
    SelectPlayground,
    SwitchPlayground,
    TabsPlayground,
    ToastPlayground,
    TooltipPlayground,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
