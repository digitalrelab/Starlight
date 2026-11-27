import { ArrowLeft01Icon, PaintBoardIcon } from "@hugeicons-pro/core-stroke-rounded";
import { Icon, NavItem, NavSection } from "@starlight/ui";
import { Link } from "@tanstack/react-router";

export const SettingsSidebar = () => (
  <>
    <NavItem render={<Link to="/" />}>
      <Icon icon={ArrowLeft01Icon} className="shrink-0" />
      Back to app
    </NavItem>
    <NavSection title="Settings">
      <NavItem render={<Link to="/settings/appearance" />}>
        <Icon icon={PaintBoardIcon} className="shrink-0" />
        Appearance
      </NavItem>
    </NavSection>
  </>
);
