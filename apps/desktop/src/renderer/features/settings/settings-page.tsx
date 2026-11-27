import type { ReactNode } from "react";
import { PageHeader } from "../shell/page-header.tsx";

interface Props {
  readonly title: string;
  readonly children: ReactNode;
}

export const SettingsPage = ({ title, children }: Props) => (
  <>
    <PageHeader>
      <span className="font-medium">{title}</span>
    </PageHeader>
    <div className="overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-6 py-8">
        <div className="divide-y divide-default rounded-lg bg-surface-raised shadow-lifted">{children}</div>
      </div>
    </div>
  </>
);
