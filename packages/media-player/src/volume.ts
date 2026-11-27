import { VolumeHighIcon, VolumeLowIcon, VolumeMute02Icon } from "@hugeicons-pro/core-stroke-rounded";

export const volumeIcon = (level: number) => {
  if (level === 0) return VolumeMute02Icon;
  return level < 0.5 ? VolumeLowIcon : VolumeHighIcon;
};
