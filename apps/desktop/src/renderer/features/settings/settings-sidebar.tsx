import { ArrowLeft01Icon, PaintBoardIcon } from "@hugeicons-pro/core-stroke-rounded";
import { NavItem, NavSection } from "@starlight/ui";
import { Link } from "@tanstack/react-router";

export const SettingsSidebar = () => (
  <>
    <NavItem icon={ArrowLeft01Icon} render={<Link to="/" />}>
      Back to app
    </NavItem>
    <NavSection title="Settings">
      <NavItem icon={PaintBoardIcon} render={<Link to="/settings/appearance" />}>
        Appearance
      </NavItem>
    </NavSection>
  </>
);
