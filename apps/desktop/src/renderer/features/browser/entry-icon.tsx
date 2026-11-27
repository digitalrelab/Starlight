import { File01Icon, FolderIcon } from "@hugeicons-pro/core-stroke-rounded";
import type { Entry } from "@starlight/client";
import { cn, Icon, type IconProps } from "@starlight/ui";

interface Props extends Omit<IconProps, "icon"> {
  readonly entry: Entry;
}

export const EntryIcon = ({ entry, className, ...props }: Props) => {
  const isDir = entry.kind === "directory";
  return (
    <Icon
      icon={isDir ? FolderIcon : File01Icon}
      className={cn(isDir ? "text-accent" : "text-muted", className)}
      {...props}
    />
  );
};
