import type { ReactNode } from "react";

export const NavSection = ({ title, children }: { readonly title: string; readonly children: ReactNode }) => (
  <section className="flex flex-col gap-px">
    <h2 className="flex h-control items-center px-2 text-xs font-medium text-subtle">{title}</h2>
    {children}
  </section>
);
