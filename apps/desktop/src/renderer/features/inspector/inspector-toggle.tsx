import { SidebarRight01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { IconButton } from "@starlight/ui";
import { useEffect } from "react";
import { useStored } from "#renderer/lib/storage.ts";
import { INSPECTOR_SHORTCUT, inspectorPreference } from "./inspector-preference.ts";

export const toggleInspector = () =>
  inspectorPreference.set(inspectorPreference.get() === "open" ? "closed" : "open");

export const InspectorToggle = () => (
  <IconButton
    label={useStored(inspectorPreference) === "open" ? "Hide details" : "Show details"}
    icon={SidebarRight01Icon}
    shortcut={INSPECTOR_SHORTCUT}
    onClick={toggleInspector}
  />
);

export const useInspectorShortcut = () =>
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !event.metaKey || event.key.toLowerCase() !== "i") return;
      event.preventDefault();
      toggleInspector();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
