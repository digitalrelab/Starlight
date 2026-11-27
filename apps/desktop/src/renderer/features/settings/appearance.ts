import { COLOR_SCHEMES } from "@starlight/ui";
import { useLayoutEffect } from "react";
import { Channel } from "#shared/channels.ts";
import { defineStored, oneOf } from "#renderer/lib/storage.ts";

export const colorScheme = defineStored("color-scheme", oneOf(COLOR_SCHEMES), "system");

export const cursor = defineStored("cursor", oneOf(["default", "pointer"]), "default");

export const INTERFACE_SIZES = ["smaller", "small", "default", "large", "larger"] as const;
export type InterfaceSize = (typeof INTERFACE_SIZES)[number];

const ZOOM_FACTORS: Record<InterfaceSize, number> = {
  smaller: 0.8,
  small: 0.9,
  default: 1,
  large: 1.1,
  larger: 1.2,
};

export const interfaceSize = defineStored("interface-size", oneOf(INTERFACE_SIZES), "default");

export const useInterfaceZoom = () => {
  const factor = ZOOM_FACTORS[interfaceSize.useValue()];
  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--interface-zoom", String(factor));
    window.postMessage({ type: Channel.zoom, factor }, "*");
  }, [factor]);
};
