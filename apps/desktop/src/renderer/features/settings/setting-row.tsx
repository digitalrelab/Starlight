import type { ReactNode } from "react";

interface Props {
  readonly label: string;
  readonly description: string;
  readonly children: ReactNode;
}

export const SettingRow = ({ label, description, children }: Props) => (
  <div className="flex items-center justify-between gap-6 px-4 py-3">
    <div className="flex flex-col gap-0.5">
      <span className="font-medium">{label}</span>
      <span className="text-muted">{description}</span>
    </div>
    {children}
  </div>
);
