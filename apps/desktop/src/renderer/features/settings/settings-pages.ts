import {
  DashboardSpeed02Icon,
  Folder01Icon,
  HardDriveIcon,
  PaintBoardIcon,
  Plug01Icon,
  RefreshDotIcon,
} from "@hugeicons-pro/core-stroke-rounded";
import { linkOptions } from "@tanstack/react-router";

export const SETTINGS_SECTIONS = [
  {
    title: "General",
    pages: [
      { label: "Appearance", icon: PaintBoardIcon, link: linkOptions({ to: "/settings/appearance" }) },
      { label: "Files", icon: Folder01Icon, link: linkOptions({ to: "/settings/files" }) },
      { label: "Disk", icon: HardDriveIcon, link: linkOptions({ to: "/settings/disk" }) },
      { label: "Updates", icon: RefreshDotIcon, link: linkOptions({ to: "/settings/updates" }) },
    ],
  },
  {
    title: "AI",
    pages: [
      { label: "Providers", icon: Plug01Icon, link: linkOptions({ to: "/settings/providers" }) },
      { label: "Usage", icon: DashboardSpeed02Icon, link: linkOptions({ to: "/settings/usage" }) },
    ],
  },
] as const;
