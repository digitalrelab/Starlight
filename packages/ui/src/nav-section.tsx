import type { ReactNode } from "react";

export const NavSection = ({ title, children }: { readonly title: string; readonly children: ReactNode }) => (
  <section className="flex flex-col gap-px">
    <h2 className="flex h-7 items-center px-2 text-[11px] font-medium text-muted">{title}</h2>
    {children}
  </section>
);
