import { ArrowLeft01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { IconButton, NavItem, NavSection } from "@starlight/ui";
import { Link } from "@tanstack/react-router";
import { SETTINGS_SECTIONS } from "./settings-pages.ts";

export const SettingsSidebar = () => (
  <>
    <NavItem icon={ArrowLeft01Icon} render={<Link to="/" />}>
      Back to app
    </NavItem>
    {SETTINGS_SECTIONS.map(({ title, pages }) => (
      <NavSection key={title} title={title}>
        {pages.map(({ label, icon, link }) => (
          <NavItem key={label} icon={icon} render={<Link {...link} />}>
            {label}
          </NavItem>
        ))}
      </NavSection>
    ))}
  </>
);

export const SettingsSidebarFooter = () => (
  <IconButton icon={ArrowLeft01Icon} label="Back to app" render={<Link to="/" />} />
);
