import { BotIcon, ClaudeIcon } from "@hugeicons-pro/core-stroke-rounded";
import { ClaudeCodeProvider } from "@starlight/client";
import type { IconProps } from "@starlight/ui";

interface ProviderAppearance {
  readonly icon: IconProps["icon"];
  readonly tile: string;
}

const appearances: Record<string, ProviderAppearance> = {
  [ClaudeCodeProvider]: { icon: ClaudeIcon, tile: "bg-(--text-color-accent-orange)/12 text-accent-orange" },
};

const fallback: ProviderAppearance = { icon: BotIcon, tile: "bg-neutral text-subtle" };

export const providerAppearance = (id: string) => appearances[id] ?? fallback;
