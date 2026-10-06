import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Changelog } from "@/components/changelog";
import { AccordionPlayground } from "@/components/playground/accordion";
import { ButtonPlayground } from "@/components/playground/button";
import { ButtonGroupPlayground } from "@/components/playground/button-group";
import { CheckboxPlayground } from "@/components/playground/checkbox";
import { DialogPlayground } from "@/components/playground/dialog";
import { DropdownMenuPlayground } from "@/components/playground/dropdown-menu";
import { FieldPlayground } from "@/components/playground/field";
import { FieldsetPlayground } from "@/components/playground/fieldset";
import { FileUploadPlayground } from "@/components/playground/file-upload";
import { InputPlayground } from "@/components/playground/input";
import { InputGroupPlayground } from "@/components/playground/input-group";
import { LabelPlayground } from "@/components/playground/label";
import { NativeSelectPlayground } from "@/components/playground/native-select";
import { OtpFieldPlayground } from "@/components/playground/otp-field";
import { PasswordInputPlayground } from "@/components/playground/password-input";
import { PopoverPlayground } from "@/components/playground/popover";
import { RadioGroupPlayground } from "@/components/playground/radio-group";
import { SelectPlayground } from "@/components/playground/select";
import { SliderPlayground } from "@/components/playground/slider";
import { SwitchPlayground } from "@/components/playground/switch";
import { TabsPlayground } from "@/components/playground/tabs";
import { TextareaPlayground } from "@/components/playground/textarea";
import { ToastPlayground } from "@/components/playground/toast";
import { TogglePlayground } from "@/components/playground/toggle";
import { ToggleGroupPlayground } from "@/components/playground/toggle-group";
import { TooltipPlayground } from "@/components/playground/tooltip";
import { PresetList } from "@/components/preset-reference";
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
    PresetList,
    TailwindTheme,
    ScssMixins,
    ScssBreakpoints,
    Changelog,
    AccordionPlayground,
    ButtonGroupPlayground,
    FieldPlayground,
    FieldsetPlayground,
    FileUploadPlayground,
    InputPlayground,
    InputGroupPlayground,
    LabelPlayground,
    NativeSelectPlayground,
    OtpFieldPlayground,
    PasswordInputPlayground,
    RadioGroupPlayground,
    SliderPlayground,
    TextareaPlayground,
    TogglePlayground,
    ToggleGroupPlayground,
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
