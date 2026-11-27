import { ScrollArea } from "@starlight/ui";
import type { ReactNode } from "react";
import { PageHeader } from "#renderer/features/shell/page-header.tsx";

interface Props {
  readonly title: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}

export const SettingsPage = ({ title, actions, children }: Props) => (
  <>
    <PageHeader actions={actions}>
      <span className="font-medium">{title}</span>
    </PageHeader>
    <ScrollArea className="flex-1" contentClassName="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-8">
      {children}
    </ScrollArea>
  </>
);
