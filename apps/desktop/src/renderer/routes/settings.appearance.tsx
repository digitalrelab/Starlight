import { COLOR_SCHEMES, type ColorScheme, ColorSchemeSwatch, Item, Switch } from "@starlight/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  CHAT_FONTS,
  type ChatFont,
  chatFont,
  chatTextSize,
  colorScheme,
  cursor,
  interfaceSize,
  SIZES,
  type Size,
} from "#renderer/features/settings/appearance.ts";
import { ChatPreview } from "#renderer/features/settings/chat-preview.tsx";
import { SettingsPage } from "#renderer/features/settings/settings-page.tsx";
import { SettingsSelect } from "#renderer/features/settings/settings-select.tsx";
import { useStored } from "#renderer/lib/storage.ts";

const COLOR_SCHEME_LABELS: Record<ColorScheme, string> = {
  system: "System",
  light: "Daylight",
  dark: "Starlight",
};

const SIZE_LABELS: Record<Size, string> = {
  smaller: "Smaller",
  small: "Small",
  default: "Default",
  large: "Large",
  larger: "Larger",
};

const CHAT_FONT_LABELS: Record<ChatFont, string> = {
  mono: "Mono",
  sans: "Sans",
  serif: "Serif",
};

export const Route = createFileRoute("/settings/appearance")({
  component: Appearance,
});

function Appearance() {
  return (
    <SettingsPage title="Appearance">
      <Item.Group title="General">
        <Item.List>
          <Item.Root>
            <Item.Content>
              <Item.Title htmlFor="theme">Theme</Item.Title>
              <Item.Description>Choose light or dark, or match your device</Item.Description>
            </Item.Content>
            <SettingsSelect
              id="theme"
              values={COLOR_SCHEMES}
              labels={COLOR_SCHEME_LABELS}
              swatch={(scheme) => <ColorSchemeSwatch scheme={scheme} />}
              value={useStored(colorScheme)}
              onValueChange={colorScheme.set}
            />
          </Item.Root>
          <Item.Root>
            <Item.Content>
              <Item.Title htmlFor="interface-size">Size</Item.Title>
              <Item.Description>Adjust the size of everything in the app</Item.Description>
            </Item.Content>
            <SettingsSelect
              id="interface-size"
              values={SIZES}
              labels={SIZE_LABELS}
              value={useStored(interfaceSize)}
              onValueChange={interfaceSize.set}
            />
          </Item.Root>
          <Item.Root>
            <Item.Content>
              <Item.Title htmlFor="pointer-cursors">Use pointer cursors</Item.Title>
              <Item.Description>Show a hand cursor over anything you can click</Item.Description>
            </Item.Content>
            <Switch
              id="pointer-cursors"
              checked={useStored(cursor) === "pointer"}
              onCheckedChange={(checked) => cursor.set(checked ? "pointer" : "default")}
            />
          </Item.Root>
        </Item.List>
      </Item.Group>
      <Item.Group title="Chat">
        <Item.List>
          <Item.Root>
            <Item.Content>
              <Item.Title htmlFor="chat-font">Font</Item.Title>
              <Item.Description>Choose the typeface for messages and the composer</Item.Description>
            </Item.Content>
            <SettingsSelect
              id="chat-font"
              values={CHAT_FONTS}
              labels={CHAT_FONT_LABELS}
              value={useStored(chatFont)}
              onValueChange={chatFont.set}
            />
          </Item.Root>
          <Item.Root>
            <Item.Content>
              <Item.Title htmlFor="chat-text-size">Text size</Item.Title>
              <Item.Description>Adjust the size of messages and the composer</Item.Description>
            </Item.Content>
            <SettingsSelect
              id="chat-text-size"
              values={SIZES}
              labels={SIZE_LABELS}
              value={useStored(chatTextSize)}
              onValueChange={chatTextSize.set}
            />
          </Item.Root>
          <ChatPreview />
        </Item.List>
      </Item.Group>
    </SettingsPage>
  );
}
