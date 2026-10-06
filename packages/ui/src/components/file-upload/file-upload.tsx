"use client";

import { useComposedRefs } from "@radix-ui/react-compose-refs";
import {
  type ChangeEvent,
  type DragEvent,
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cx } from "../../utils/cx";

export interface FileRejection {
  file: File;
  /**
   * `"type"`: `accept` doesn't allow it. `"size"`: it's over `maxSize`.
   * `"count"`: there's no room left for it.
   */
  reason: "type" | "size" | "count";
}

export interface FileUploadOwnProps {
  /** Called with every file that's chosen, each time the list changes. */
  onFilesChange?: (files: File[]) => void;
  /** The largest a file may be, in bytes. */
  maxSize?: number;
  /** The most files that may be chosen. Only applies with `multiple`. */
  maxFiles?: number;
  /**
   * Called with the files that were turned away and the reason for each.
   * Nothing is shown for them, so this is where you tell the person.
   */
  onReject?: (rejections: FileRejection[]) => void;
  /**
   * The text in the drop area.
   * @default "Drop files here, or choose them from your device"
   */
  children?: ReactNode;
  /**
   * Whether to list the chosen files under the drop area, each with a
   * button to take it out again.
   * @default true
   */
  showList?: boolean;
  /**
   * Accessible name of the button that takes a file out, from the file's
   * name. Translate it with the rest of your interface.
   * @default (name) => `Remove ${name}`
   */
  removeLabel?: (name: string) => string;
  /**
   * Writes a file's size, from a number of bytes.
   * @default The size in the visitor's own number format, such as "1.2 MB"
   */
  formatSize?: (bytes: number) => string;
}

export interface FileUploadProps
  extends FileUploadOwnProps,
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      keyof FileUploadOwnProps | "type" | "value" | "defaultValue"
    > {}

const units = ["byte", "kilobyte", "megabyte", "gigabyte"] as const;

function defaultFormatSize(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return new Intl.NumberFormat(undefined, {
    style: "unit",
    unit: units[unit],
    unitDisplay: "short",
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(value);
}

const defaultRemoveLabel = (name: string) => `Remove ${name}`;

// The same test a browser's file picker applies. A drop doesn't go through
// the picker, so it has to be made here.
function accepts(file: File, accept: string | undefined): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return accept
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.startsWith(".")) return name.endsWith(rule);
      if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
      return type === rule;
    });
}

const same = (a: File, b: File) =>
  a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  function FileUpload(
    {
      onFilesChange,
      maxSize,
      maxFiles,
      onReject,
      children = "Drop files here, or choose them from your device",
      showList = true,
      removeLabel = defaultRemoveLabel,
      formatSize = defaultFormatSize,
      className,
      accept,
      multiple = false,
      disabled = false,
      onChange,
      "aria-describedby": describedBy,
      ...props
    },
    ref,
  ) {
    const inputRef = useRef<HTMLInputElement>(null);
    const promptId = useId();
    const [files, setFiles] = useState<File[]>([]);
    const [dragging, setDragging] = useState(false);
    // Set while this component fires a change event of its own, so the
    // handler below can tell it from one the browser fired.
    const own = useRef(false);

    // A form's reset empties the input without a change event.
    useEffect(() => {
      const form = inputRef.current?.form;
      if (!form) return;
      const clear = () => {
        setFiles([]);
        onFilesChange?.([]);
      };
      form.addEventListener("reset", clear);
      return () => form.removeEventListener("reset", clear);
    }, [onFilesChange]);

    // Sorts files that just arrived into kept and turned away. With
    // `multiple` they join the ones already there. Without it, the first
    // one that passes takes the place of what was chosen before.
    function sort(incoming: File[]) {
      const kept = multiple ? [...files] : [];
      const limit = multiple ? (maxFiles ?? Number.POSITIVE_INFINITY) : 1;
      const rejected: FileRejection[] = [];

      for (const file of incoming) {
        if (!accepts(file, accept)) {
          rejected.push({ file, reason: "type" });
        } else if (maxSize !== undefined && file.size > maxSize) {
          rejected.push({ file, reason: "size" });
        } else if (kept.some((other) => same(other, file))) {
          // Chosen twice. Once is enough, and it's nobody's mistake.
        } else if (kept.length >= limit) {
          rejected.push({ file, reason: "count" });
        } else {
          kept.push(file);
        }
      }

      // Everything was turned away: what was chosen before stays.
      if (!multiple && kept.length === 0) kept.push(...files);
      return { kept, rejected };
    }

    // The input holds the files, so a form submits them and a form library
    // reads them the way it would from any file input.
    function write(next: File[]) {
      const input = inputRef.current;
      if (!input) return;
      const transfer = new DataTransfer();
      for (const file of next) transfer.items.add(file);
      input.files = transfer.files;
    }

    function announce() {
      own.current = true;
      inputRef.current?.dispatchEvent(new Event("change", { bubbles: true }));
      own.current = false;
    }

    function commit(next: File[], rejected: FileRejection[]) {
      setFiles(next);
      onFilesChange?.(next);
      if (rejected.length > 0) onReject?.(rejected);
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      if (!own.current) {
        const { kept, rejected } = sort([...(event.target.files ?? [])]);
        write(kept);
        commit(kept, rejected);
      }
      onChange?.(event);
    }

    function handleDrop(event: DragEvent<HTMLDivElement>) {
      // Without this the browser opens the file in place of the page.
      event.preventDefault();
      setDragging(false);
      if (disabled) return;

      const { kept, rejected } = sort([...event.dataTransfer.files]);
      write(kept);
      commit(kept, rejected);
      announce();
    }

    function remove(file: File) {
      const next = files.filter((other) => other !== file);
      write(next);
      commit(next, []);
      announce();
      // The button that had focus is gone with its row.
      inputRef.current?.focus();
    }

    return (
      <div
        className={cx("nuv-file-upload", className)}
        data-disabled={disabled ? "" : undefined}
      >
        {/* biome-ignore lint/a11y/noStaticElementInteractions: the input inside is what takes focus and opens the picker. These only add dropping onto the area around it. */}
        <div
          className="nuv-file-upload__dropzone"
          data-dragging={dragging ? "" : undefined}
          onDragEnter={() => setDragging(!disabled)}
          onDragOver={(event) => {
            // A drop is only allowed where dragover was cancelled.
            event.preventDefault();
            setDragging(!disabled);
          }}
          onDragLeave={(event) => {
            // Moving onto a child fires this too, with the child as the
            // place being entered.
            if (event.currentTarget.contains(event.relatedTarget as Node)) {
              return;
            }
            setDragging(false);
          }}
          onDrop={handleDrop}
        >
          <svg
            aria-hidden="true"
            className="nuv-file-upload__icon"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
          </svg>
          <span id={promptId} className="nuv-file-upload__prompt">
            {children}
          </span>
          {/* Laid over the whole area and see-through, so a click anywhere
              opens the picker and the keyboard reaches a real file input. */}
          <input
            ref={useComposedRefs(ref, inputRef)}
            type="file"
            className="nuv-file-upload__input"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            aria-describedby={cx(describedBy, promptId)}
            onChange={handleChange}
            {...props}
          />
        </div>
        {showList && files.length > 0 ? (
          <ul className="nuv-file-upload__list">
            {files.map((file) => (
              <li
                key={`${file.name}:${file.size}:${file.lastModified}`}
                className="nuv-file-upload__item"
              >
                <span className="nuv-file-upload__name">{file.name}</span>
                <span className="nuv-file-upload__size">
                  {formatSize(file.size)}
                </span>
                <button
                  type="button"
                  className="nuv-file-upload__remove"
                  aria-label={removeLabel(file.name)}
                  disabled={disabled}
                  onClick={() => remove(file)}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M3.5 3.5l9 9m0-9l-9 9" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  },
);
