import { cn } from "cn";
import type { ComponentProps } from "react";

export interface RenameInputProps extends Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onBlur" | "onKeyDown" | "onFocus"
> {
  readonly value: string;
  readonly onRename: (next: string) => void;
  readonly onClose?: () => void;
}

export const RenameInput = ({
  value,
  onRename,
  onClose,
  autoFocus,
  className,
  ...props
}: RenameInputProps) => (
  <input
    autoFocus={autoFocus}
    defaultValue={value}
    onFocus={autoFocus ? (event) => event.currentTarget.select() : undefined}
    onBlur={(event) => {
      onClose?.();
      const next = event.currentTarget.value.trim();
      if (next === "") event.currentTarget.value = value;
      else if (next !== value) onRename(next);
    }}
    onKeyDown={(event) => {
      if (event.key === "Escape") event.currentTarget.value = value;
      if (event.key === "Enter" || event.key === "Escape") event.currentTarget.blur();
    }}
    className={cn("h-8 w-full rounded-md bg-neutral px-2 text-base outline-none focus-ring", className)}
    {...props}
  />
);
