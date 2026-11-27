import { cn } from "cn";

export type Shortcut = ReadonlyArray<string>;

const SYMBOLS: Readonly<Record<string, string>> = {
  Alt: "⌥",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  Control: "⌃",
  Enter: "↵",
  Escape: "esc",
  Meta: "⌘",
  Shift: "⇧",
  Space: "space",
};

interface Props {
  readonly shortcut: Shortcut;
  readonly className?: string;
}

export const Kbd = ({ shortcut, className }: Props) => (
  <kbd className={cn("inline-flex gap-0.5 font-sans", className)}>
    {shortcut.map((key) => (
      <span key={key} className="min-w-4 rounded-sm bg-neutral px-1 text-center text-xs text-subtle">
        {SYMBOLS[key] ?? key.toUpperCase()}
      </span>
    ))}
  </kbd>
);
