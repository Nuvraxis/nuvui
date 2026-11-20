import type { EditorView } from "@codemirror/view";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useSyncExternalStore,
} from "react";
import type { CodeEditorLabels } from "./labels";
import type { CodeEditorLanguage } from "./languages";

/** A place parts listen for the editor changing, its text or anything else. */
export interface ViewStore {
  subscribe: (listener: () => void) => () => void;
  /** A number that goes up each time something in the editor changes. */
  version: () => number;
  /** Tells the parts that the editor changed. */
  changed: () => void;
}

export function createViewStore(): ViewStore {
  const listeners = new Set<() => void>();
  let version = 0;
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    version: () => version,
    changed() {
      version += 1;
      for (const listener of listeners) listener();
    },
  };
}

export interface CodeEditorContextValue {
  view: EditorView | null;
  store: ViewStore;
  labels: Required<CodeEditorLabels>;
  /** The element the editor is drawn into, when CodeContent is there. */
  setHost: (host: HTMLElement | null) => void;
  /** The code before there's an editor to read it from. */
  initial: string;
  language: CodeEditorLanguage | undefined;
  /** The language can be changed from the toolbar. */
  languageChangeable: boolean;
  setLanguage: (name: string) => void;
  wrap: boolean;
  setWrap: (wrap: boolean) => void;
  lineNumbers: boolean;
  minLines: number;
  maxLines: number | undefined;
  locked: boolean;
  disabled: boolean;
  format: (() => Promise<void>) | undefined;
  /** Where the search panel is drawn while it's open. */
  searchHost: HTMLElement | null;
  /** The id of the words that say how to leave the editor with the keyboard. */
  hintId: string | undefined;
}

export const CodeEditorContext = createContext<CodeEditorContextValue | null>(
  null,
);

export function useCodeEditor(part: string) {
  const context = useContext(CodeEditorContext);
  if (!context) throw new Error(`${part} has to be inside a CodeEditor.`);
  return context;
}

/**
 * Something read from the editor, and read again whenever it changes. The
 * answer is compared as it is, so return a string, a number or a boolean.
 */
export function useViewValue<Value extends string | number | boolean | null>(
  view: EditorView | null,
  store: ViewStore,
  read: (view: EditorView) => Value,
  none: Value,
): Value {
  const reader = useRef(read);
  reader.current = read;
  const snapshot = useCallback(
    () => (view ? reader.current(view) : none),
    [view, none],
  );
  return useSyncExternalStore(store.subscribe, snapshot, () => none);
}
