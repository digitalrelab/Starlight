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
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-8">{children}</div>
    </div>
  </>
);
