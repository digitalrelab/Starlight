import { ArrowLeft01Icon, PaintBoardIcon } from "@hugeicons-pro/core-stroke-rounded";
import { Icon, NavItem, NavSection } from "@starlight/ui";
import { Link } from "@tanstack/react-router";

export const SettingsSidebar = () => (
  <>
    <NavItem render={<Link to="/" />}>
      <Icon icon={ArrowLeft01Icon} />
      Back to app
    </NavItem>
    <NavSection title="Settings">
      <NavItem render={<Link to="/settings/appearance" />}>
        <Icon icon={PaintBoardIcon} />
        Appearance
      </NavItem>
    </NavSection>
  </>
);
