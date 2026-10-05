"use client";

import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { type ReactNode, useId } from "react";
import { codeHighlight } from "@/lib/code-themes";

interface PlaygroundProps {
  /** The component, rendered with the current settings. */
  children: ReactNode;
  controls: ReactNode;
  /** The JSX that would produce what's on screen. */
  code: string;
}

export function Playground({ children, controls, code }: PlaygroundProps) {
  return (
    <div className="not-prose my-6" data-playground>
      <div
        className="flex min-h-40 items-center justify-center rounded-t-xl border border-b-0 p-6"
        style={{
          backgroundColor: "var(--color-background)",
          color: "var(--color-foreground)",
        }}
      >
        {children}
      </div>
      <fieldset className="grid grid-cols-1 gap-4 border border-b-0 p-4 text-sm sm:grid-cols-2">
        <legend className="sr-only">Props</legend>
        {controls}
      </fieldset>
      <DynamicCodeBlock
        lang="tsx"
        code={code}
        options={codeHighlight}
        codeblock={{ className: "my-0 rounded-t-none" }}
      />
    </div>
  );
}

const fieldClass =
  "h-11 w-full rounded-md border bg-fd-background px-3 text-fd-foreground";

interface SelectControlProps<Value extends string> {
  label: string;
  value: Value;
  options: readonly Value[];
  onChange: (value: Value) => void;
}

export function SelectControl<Value extends string>({
  label,
  value,
  options,
  onChange,
}: SelectControlProps<Value>) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <select
        id={id}
        className={fieldClass}
        value={value}
        onChange={(event) => onChange(event.target.value as Value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

interface TextControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function TextControl({ label, value, onChange }: TextControlProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <input
        id={id}
        type="text"
        className={fieldClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

interface CheckboxControlProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckboxControl({
  label,
  checked,
  onChange,
}: CheckboxControlProps) {
  const id = useId();
  return (
    <div className="flex min-h-11 items-center gap-2">
      <input
        id={id}
        type="checkbox"
        className="size-5"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
    </div>
  );
}
