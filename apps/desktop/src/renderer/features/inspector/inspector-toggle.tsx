import { PanelRightIcon } from "@hugeicons-pro/core-stroke-rounded";
import { IconButton } from "@starlight/ui";
import { defineStored, oneOf, useStored } from "#renderer/lib/storage.ts";

export const inspectorPreference = defineStored("inspector", oneOf(["open", "closed"]), "closed");

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
