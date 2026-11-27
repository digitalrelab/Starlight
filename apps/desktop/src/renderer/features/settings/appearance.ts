import { COLOR_SCHEMES } from "@starlight/ui";
import { useEffect, useLayoutEffect } from "react";
import { Channel } from "#shared/channels.ts";
import type { ZoomStep } from "#shared/zoom.ts";
import { defineStored, oneOf, useStored } from "#renderer/lib/storage.ts";

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

const stepped = (size: InterfaceSize, step: ZoomStep) => {
  if (step === "reset") return "default";
  return INTERFACE_SIZES[INTERFACE_SIZES.indexOf(size) + (step === "in" ? 1 : -1)] ?? size;
};

export const useInterfaceZoom = () => {
  const factor = ZOOM_FACTORS[useStored(interfaceSize)];
  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--interface-zoom", String(factor));
    window.postMessage({ type: Channel.zoom, factor }, "*");
  }, [factor]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || event.data?.type !== Channel.zoomStep) return;
      interfaceSize.set(stepped(interfaceSize.get(), event.data.step));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
};
