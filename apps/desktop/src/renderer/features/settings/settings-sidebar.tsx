import {
  ArrowLeft01Icon,
  HardDriveIcon,
  PaintBoardIcon,
  Plug01Icon,
  RefreshDotIcon,
} from "@hugeicons-pro/core-stroke-rounded";
import { IconButton, NavItem, NavSection } from "@starlight/ui";
import { Link } from "@tanstack/react-router";

export const SettingsSidebar = () => (
  <>
    <NavItem icon={ArrowLeft01Icon} render={<Link to="/" />}>
      Back to app
    </NavItem>
    <NavSection title="General">
      <NavItem icon={PaintBoardIcon} render={<Link to="/settings/appearance" />}>
        Appearance
      </NavItem>
      <NavItem icon={HardDriveIcon} render={<Link to="/settings/disk" />}>
        Disk
      </NavItem>
      <NavItem icon={RefreshDotIcon} render={<Link to="/settings/updates" />}>
        Updates
      </NavItem>
    </NavSection>
    <NavSection title="AI">
      <NavItem icon={Plug01Icon} render={<Link to="/settings/connections" />}>
        Connections
      </NavItem>
    </NavSection>
  </>
);

export const SettingsSidebarFooter = () => (
  <IconButton icon={ArrowLeft01Icon} label="Back to app" render={<Link to="/" />} />
);
