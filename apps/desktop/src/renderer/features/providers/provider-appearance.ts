import { ClaudeIcon } from "@hugeicons-pro/core-solid-rounded";
import { BotIcon } from "@hugeicons-pro/core-stroke-rounded";
import { ClaudeCodeProvider } from "@starlight/client";
import type { IconProps } from "@starlight/ui";

interface ProviderAppearance {
  readonly icon: IconProps["icon"];
  readonly color: string;
  readonly tile: string;
}

const appearances: Record<string, ProviderAppearance> = {
  [ClaudeCodeProvider]: {
    icon: ClaudeIcon,
    color: "text-accent-orange",
    tile: "bg-(--text-color-accent-orange)/12 text-accent-orange",
  },
};

const fallback: ProviderAppearance = { icon: BotIcon, color: "text-subtle", tile: "bg-neutral text-subtle" };

export const providerAppearance = (id: string) => appearances[id] ?? fallback;
