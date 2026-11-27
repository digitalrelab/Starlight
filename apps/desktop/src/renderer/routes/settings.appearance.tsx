import { COLOR_SCHEMES, type ColorScheme, ColorSchemeSwatch, Item, Switch } from "@starlight/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  colorScheme,
  cursor,
  INTERFACE_SIZES,
  type InterfaceSize,
  interfaceSize,
} from "#renderer/features/settings/appearance.ts";
import { SettingsPage } from "#renderer/features/settings/settings-page.tsx";
import { SettingsSelect } from "#renderer/features/settings/settings-select.tsx";

const COLOR_SCHEME_LABELS: Record<ColorScheme, string> = {
  system: "System",
  light: "Daylight",
  dark: "Starlight",
};

const INTERFACE_SIZE_LABELS: Record<InterfaceSize, string> = {
  smaller: "Smaller",
  small: "Small",
  default: "Default",
  large: "Large",
  larger: "Larger",
};

export const Route = createFileRoute("/settings/appearance")({
  component: Appearance,
});

function Appearance() {
  return (
    <SettingsPage title="Appearance">
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
            value={colorScheme.useValue()}
            onValueChange={colorScheme.set}
          />
        </Item.Root>
        <Item.Root>
          <Item.Content>
            <Item.Title htmlFor="interface-size">Interface size</Item.Title>
            <Item.Description>Adjust the size of everything in the app</Item.Description>
          </Item.Content>
          <SettingsSelect
            id="interface-size"
            values={INTERFACE_SIZES}
            labels={INTERFACE_SIZE_LABELS}
            value={interfaceSize.useValue()}
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
            checked={cursor.useValue() === "pointer"}
            onCheckedChange={(checked) => cursor.set(checked ? "pointer" : "default")}
          />
        </Item.Root>
      </Item.List>
    </SettingsPage>
  );
}
