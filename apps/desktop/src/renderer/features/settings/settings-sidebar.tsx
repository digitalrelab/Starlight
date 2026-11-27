import { ArrowLeft01Icon, PaintBoardIcon, Plug01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { NavItem, NavSection } from "@starlight/ui";
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
    </NavSection>
    <NavSection title="AI">
      <NavItem icon={Plug01Icon} render={<Link to="/settings/connections" />}>
        Connections
      </NavItem>
    </NavSection>
  </>
);
