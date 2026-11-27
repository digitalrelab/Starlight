import { COLOR_SCHEMES, type ColorScheme, ColorSchemeSwatch, Switch } from "@starlight/ui";
import { createFileRoute } from "@tanstack/react-router";
import { colorScheme, cursor } from "../features/settings/appearance.ts";
import { SettingRow } from "../features/settings/setting-row.tsx";
import { SettingsPage } from "../features/settings/settings-page.tsx";
import { SettingsSelect } from "../features/settings/settings-select.tsx";

const COLOR_SCHEME_LABELS: Record<ColorScheme, string> = {
  system: "System",
  light: "Daylight",
  dark: "Starlight",
};

export const Route = createFileRoute("/settings/appearance")({
  component: Appearance,
});

function Appearance() {
  return (
    <SettingsPage title="Appearance">
      <SettingRow label="Theme" description="Choose light or dark, or match your device">
        <SettingsSelect
          id="theme"
          values={COLOR_SCHEMES}
          labels={COLOR_SCHEME_LABELS}
          swatch={(scheme) => <ColorSchemeSwatch scheme={scheme} />}
          value={colorScheme.useValue()}
          onValueChange={colorScheme.set}
        />
      </SettingRow>
      <SettingRow label="Use pointer cursors" description="Show a hand cursor over anything you can click">
        <Switch
          checked={cursor.useValue() === "pointer"}
          onCheckedChange={(checked) => cursor.set(checked ? "pointer" : "default")}
        />
      </SettingRow>
    </SettingsPage>
  );
}
