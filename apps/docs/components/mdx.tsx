import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Changelog } from "@/components/changelog";
import { NotPublished } from "@/components/not-published";
import { AccordionPlayground } from "@/components/playground/accordion";
import { ActionBarPlayground } from "@/components/playground/action-bar";
import { AlertPlayground } from "@/components/playground/alert";
import { AlertDialogPlayground } from "@/components/playground/alert-dialog";
import { AspectRatioPlayground } from "@/components/playground/aspect-ratio";
import { AvatarPlayground } from "@/components/playground/avatar";
import { BadgePlayground } from "@/components/playground/badge";
import { BreadcrumbPlayground } from "@/components/playground/breadcrumb";
import { ButtonPlayground } from "@/components/playground/button";
import { ButtonGroupPlayground } from "@/components/playground/button-group";
import { CardPlayground } from "@/components/playground/card";
import { CheckboxPlayground } from "@/components/playground/checkbox";
import { ChoiceCardPlayground } from "@/components/playground/choice-card";
import { CollapsiblePlayground } from "@/components/playground/collapsible";
import { ComboboxPlayground } from "@/components/playground/combobox";
import { CommandPlayground } from "@/components/playground/command";
import { ContextMenuPlayground } from "@/components/playground/context-menu";
import {
  CalendarPlayground,
  DatePickerPlayground,
  DateRangePickerPlayground,
} from "@/components/playground/date-picker";
import { DialogPlayground } from "@/components/playground/dialog";
import { DropdownMenuPlayground } from "@/components/playground/dropdown-menu";
import { EmptyPlayground } from "@/components/playground/empty";
import { FieldPlayground } from "@/components/playground/field";
import { FieldsetPlayground } from "@/components/playground/fieldset";
import { FileUploadPlayground } from "@/components/playground/file-upload";
import { FormattedNumberPlayground } from "@/components/playground/formatted-number";
import { HoldToConfirmPlayground } from "@/components/playground/hold-to-confirm";
import { HoverCardPlayground } from "@/components/playground/hover-card";
import { InputPlayground } from "@/components/playground/input";
import { InputGroupPlayground } from "@/components/playground/input-group";
import { ItemPlayground } from "@/components/playground/item";
import { KbdPlayground } from "@/components/playground/kbd";
import { LabelPlayground } from "@/components/playground/label";
import { MenubarPlayground } from "@/components/playground/menubar";
import { NativeSelectPlayground } from "@/components/playground/native-select";
import { NavigationMenuPlayground } from "@/components/playground/navigation-menu";
import { NumberFieldPlayground } from "@/components/playground/number-field";
import { OtpFieldPlayground } from "@/components/playground/otp-field";
import { PaginationPlayground } from "@/components/playground/pagination";
import { PasswordInputPlayground } from "@/components/playground/password-input";
import { PopoverPlayground } from "@/components/playground/popover";
import { ProgressPlayground } from "@/components/playground/progress";
import { RadioGroupPlayground } from "@/components/playground/radio-group";
import { RatingPlayground } from "@/components/playground/rating";
import { ScrollAreaPlayground } from "@/components/playground/scroll-area";
import { SelectPlayground } from "@/components/playground/select";
import { SeparatorPlayground } from "@/components/playground/separator";
import { SheetPlayground } from "@/components/playground/sheet";
import { SidebarPlayground } from "@/components/playground/sidebar";
import { SkeletonPlayground } from "@/components/playground/skeleton";
import { SliderPlayground } from "@/components/playground/slider";
import { SpinnerPlayground } from "@/components/playground/spinner";
import { StatPlayground } from "@/components/playground/stat";
import { StepperPlayground } from "@/components/playground/stepper";
import { SwitchPlayground } from "@/components/playground/switch";
import {
  DataTablePlayground,
  TablePlayground,
} from "@/components/playground/table";
import { TableOfContentsPlayground } from "@/components/playground/table-of-contents";
import { TabsPlayground } from "@/components/playground/tabs";
import { TextShimmerPlayground } from "@/components/playground/text-shimmer";
import { TextareaPlayground } from "@/components/playground/textarea";
import { TimelinePlayground } from "@/components/playground/timeline";
import { ToastPlayground } from "@/components/playground/toast";
import { TogglePlayground } from "@/components/playground/toggle";
import { ToggleGroupPlayground } from "@/components/playground/toggle-group";
import { ToolbarPlayground } from "@/components/playground/toolbar";
import { TooltipPlayground } from "@/components/playground/tooltip";
import { TrendPlayground } from "@/components/playground/trend";
import { VisuallyHiddenPlayground } from "@/components/playground/visually-hidden";
import { PresetList } from "@/components/preset-reference";
import { Preview } from "@/components/preview";
import { PropsTable } from "@/components/props-table";
import { ScrollTable } from "@/components/scroll-table";
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
    table: ScrollTable,
    Preview,
    PropsTable,
    NotPublished,
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
    AlertPlayground,
    AlertDialogPlayground,
    AspectRatioPlayground,
    AvatarPlayground,
    BadgePlayground,
    BreadcrumbPlayground,
    ButtonPlayground,
    ButtonGroupPlayground,
    CalendarPlayground,
    CardPlayground,
    CheckboxPlayground,
    ChoiceCardPlayground,
    CollapsiblePlayground,
    ComboboxPlayground,
    CommandPlayground,
    ContextMenuPlayground,
    DataTablePlayground,
    DatePickerPlayground,
    DateRangePickerPlayground,
    DialogPlayground,
    DropdownMenuPlayground,
    EmptyPlayground,
    FormattedNumberPlayground,
    ItemPlayground,
    NumberFieldPlayground,
    RatingPlayground,
    StatPlayground,
    ActionBarPlayground,
    HoldToConfirmPlayground,
    TableOfContentsPlayground,
    TextShimmerPlayground,
    StepperPlayground,
    TimelinePlayground,
    TrendPlayground,
    FieldPlayground,
    FieldsetPlayground,
    FileUploadPlayground,
    HoverCardPlayground,
    InputPlayground,
    InputGroupPlayground,
    KbdPlayground,
    LabelPlayground,
    MenubarPlayground,
    NativeSelectPlayground,
    NavigationMenuPlayground,
    OtpFieldPlayground,
    PaginationPlayground,
    PasswordInputPlayground,
    PopoverPlayground,
    ProgressPlayground,
    RadioGroupPlayground,
    ScrollAreaPlayground,
    SelectPlayground,
    SeparatorPlayground,
    SheetPlayground,
    SidebarPlayground,
    SkeletonPlayground,
    SliderPlayground,
    SpinnerPlayground,
    SwitchPlayground,
    TablePlayground,
    TabsPlayground,
    TextareaPlayground,
    ToastPlayground,
    TogglePlayground,
    ToggleGroupPlayground,
    ToolbarPlayground,
    TooltipPlayground,
    VisuallyHiddenPlayground,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
