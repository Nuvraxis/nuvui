import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Changelog } from "@/components/changelog";
import { IconGrid } from "@/components/icon-grid";
import { NotPublished } from "@/components/not-published";
import { AccordionPlayground } from "@/components/playground/accordion";
import { ActionBarPlayground } from "@/components/playground/action-bar";
import { AlertPlayground } from "@/components/playground/alert";
import { AlertDialogPlayground } from "@/components/playground/alert-dialog";
import { AnimatedNumberPlayground } from "@/components/playground/animated-number";
import { AspectRatioPlayground } from "@/components/playground/aspect-ratio";
import { AudioPlayerPlayground } from "@/components/playground/audio-player";
import { AvatarPlayground } from "@/components/playground/avatar";
import { BadgePlayground } from "@/components/playground/badge";
import {
  BarcodePlayground,
  QRCodePlayground,
} from "@/components/playground/barcodes";
import { BreadcrumbPlayground } from "@/components/playground/breadcrumb";
import { ButtonPlayground } from "@/components/playground/button";
import { ButtonGroupPlayground } from "@/components/playground/button-group";
import { CardPlayground } from "@/components/playground/card";
import { CarouselPlayground } from "@/components/playground/carousel";
import {
  MessagePlayground,
  PromptInputPlayground,
} from "@/components/playground/chat";
import { CheckboxPlayground } from "@/components/playground/checkbox";
import { ChoiceCardPlayground } from "@/components/playground/choice-card";
import { CollapsiblePlayground } from "@/components/playground/collapsible";
import { ColorPickerPlayground } from "@/components/playground/color-picker";
import { ComboboxPlayground } from "@/components/playground/combobox";
import { CommandPlayground } from "@/components/playground/command";
import { ComparePlayground } from "@/components/playground/compare";
import { ConfettiPlayground } from "@/components/playground/confetti";
import { ContextMenuPlayground } from "@/components/playground/context-menu";
import {
  CalendarPlayground,
  DatePickerPlayground,
  DateRangePickerPlayground,
} from "@/components/playground/date-picker";
import { DialogPlayground } from "@/components/playground/dialog";
import { DropdownMenuPlayground } from "@/components/playground/dropdown-menu";
import { RichTextEditorPlayground } from "@/components/playground/editor";
import { EmojiPickerPlayground } from "@/components/playground/emoji";
import { EmojiReactionPlayground } from "@/components/playground/emoji-reaction";
import { EmptyPlayground } from "@/components/playground/empty";
import { FieldPlayground } from "@/components/playground/field";
import { FieldsetPlayground } from "@/components/playground/fieldset";
import { FileUploadPlayground } from "@/components/playground/file-upload";
import { FlowPlayground } from "@/components/playground/flow";
import { FormattedNumberPlayground } from "@/components/playground/formatted-number";
import { HoldToConfirmPlayground } from "@/components/playground/hold-to-confirm";
import { HoloCardPlayground } from "@/components/playground/holo-card";
import { HoverCardPlayground } from "@/components/playground/hover-card";
import { InputPlayground } from "@/components/playground/input";
import { InputGroupPlayground } from "@/components/playground/input-group";
import { ItemPlayground } from "@/components/playground/item";
import { KanbanPlayground } from "@/components/playground/kanban";
import { KbdPlayground } from "@/components/playground/kbd";
import { LabelPlayground } from "@/components/playground/label";
import { ListViewPlayground } from "@/components/playground/list-view";
import { MapViewPlayground } from "@/components/playground/map";
import { MenubarPlayground } from "@/components/playground/menubar";
import { NativeSelectPlayground } from "@/components/playground/native-select";
import { NavbarPlayground } from "@/components/playground/navbar";
import { NavigationMenuPlayground } from "@/components/playground/navigation-menu";
import { NumberFieldPlayground } from "@/components/playground/number-field";
import { OtpFieldPlayground } from "@/components/playground/otp-field";
import { PaginationPlayground } from "@/components/playground/pagination";
import { PasswordInputPlayground } from "@/components/playground/password-input";
import { PopoverPlayground } from "@/components/playground/popover";
import { ProgressPlayground } from "@/components/playground/progress";
import { RadioGroupPlayground } from "@/components/playground/radio-group";
import { RatingPlayground } from "@/components/playground/rating";
import { ResizablePlayground } from "@/components/playground/resizable";
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
import { TextRevealPlayground } from "@/components/playground/text-reveal";
import { TextShimmerPlayground } from "@/components/playground/text-shimmer";
import { TextareaPlayground } from "@/components/playground/textarea";
import { TimelinePlayground } from "@/components/playground/timeline";
import { ToastPlayground } from "@/components/playground/toast";
import { TogglePlayground } from "@/components/playground/toggle";
import { ToggleGroupPlayground } from "@/components/playground/toggle-group";
import { ToolbarPlayground } from "@/components/playground/toolbar";
import { TooltipPlayground } from "@/components/playground/tooltip";
import { TreePlayground } from "@/components/playground/tree";
import { TrendPlayground } from "@/components/playground/trend";
import { VideoPlayerPlayground } from "@/components/playground/video-player";
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
    IconGrid,
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
    AnimatedNumberPlayground,
    AspectRatioPlayground,
    AudioPlayerPlayground,
    AvatarPlayground,
    BadgePlayground,
    BreadcrumbPlayground,
    ButtonPlayground,
    ButtonGroupPlayground,
    CalendarPlayground,
    CardPlayground,
    BarcodePlayground,
    QRCodePlayground,
    CarouselPlayground,
    MessagePlayground,
    PromptInputPlayground,
    CheckboxPlayground,
    ChoiceCardPlayground,
    CollapsiblePlayground,
    ComboboxPlayground,
    CommandPlayground,
    ComparePlayground,
    ConfettiPlayground,
    ContextMenuPlayground,
    DataTablePlayground,
    DatePickerPlayground,
    DateRangePickerPlayground,
    DialogPlayground,
    DropdownMenuPlayground,
    EmojiPickerPlayground,
    EmojiReactionPlayground,
    MapViewPlayground,
    EmptyPlayground,
    FormattedNumberPlayground,
    ItemPlayground,
    NavbarPlayground,
    NumberFieldPlayground,
    RatingPlayground,
    ResizablePlayground,
    StatPlayground,
    ActionBarPlayground,
    HoldToConfirmPlayground,
    HoloCardPlayground,
    TableOfContentsPlayground,
    TextRevealPlayground,
    TextShimmerPlayground,
    TreePlayground,
    ListViewPlayground,
    ColorPickerPlayground,
    StepperPlayground,
    TimelinePlayground,
    TrendPlayground,
    FieldPlayground,
    FieldsetPlayground,
    FileUploadPlayground,
    HoverCardPlayground,
    InputPlayground,
    InputGroupPlayground,
    KanbanPlayground,
    FlowPlayground,
    RichTextEditorPlayground,
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
    VideoPlayerPlayground,
    VisuallyHiddenPlayground,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
