export type ZoomStep = "in" | "out" | "reset";

export const INTERFACE_SIZE_SETTING = "interface-size";

export const INTERFACE_SIZES = ["smaller", "small", "default", "large", "larger"] as const;
export type InterfaceSize = (typeof INTERFACE_SIZES)[number];

export const ZOOM_FACTORS: Record<InterfaceSize, number> = {
  smaller: 0.8,
  small: 0.9,
  default: 1,
  large: 1.1,
  larger: 1.2,
};
