import type { Chat, ModelChoice } from "@starlight/client";
import { useModelChoice } from "#renderer/features/providers/model-choice.ts";
import { ModelPicker } from "#renderer/features/providers/model-picker.tsx";
import { NoProvider } from "#renderer/features/providers/no-provider.tsx";
import { Composer } from "./composer.tsx";

interface Props {
  readonly chat?: Chat;
  readonly placeholder: string;
  readonly disabled?: boolean;
  readonly onSubmit: (text: string, model: ModelChoice) => Promise<unknown>;
}

export const ModelComposer = ({ chat, placeholder, disabled = false, onSubmit }: Props) => {
  const { providers, choice, choose } = useModelChoice(chat);
  return choice ? (
    <Composer
      placeholder={placeholder}
      autoFocus
      disabled={disabled}
      actions={<ModelPicker providers={providers} choice={choice} onChoose={choose} />}
      onSubmit={(text) => onSubmit(text, choice)}
    />
  ) : (
    <NoProvider />
  );
};
