import { PanelRightIcon } from "@hugeicons-pro/core-stroke-rounded";
import { IconButton } from "@starlight/ui";
import { useStored } from "#renderer/lib/storage.ts";
import { inspectorPreference } from "./inspector-preference.ts";

export const INSPECTOR_KEY = "i";

export const toggleInspector = () =>
  inspectorPreference.set(inspectorPreference.get() === "open" ? "closed" : "open");

export const InspectorToggle = () => (
  <IconButton
    label="Details"
    icon={PanelRightIcon}
    shortcut={[INSPECTOR_KEY]}
    aria-pressed={useStored(inspectorPreference) === "open"}
    onClick={toggleInspector}
  />
);
