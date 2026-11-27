import { cn } from "cn";
import type { ReactNode } from "react";
import { Card, type CardProps } from "./card.tsx";

interface RootProps extends Pick<CardProps, "surface"> {
  readonly className?: string;
  readonly children: ReactNode;
}

const Root = ({ surface, className, children }: RootProps) => (
  <Card
    render={<dl />}
    surface={surface}
    className={cn("flex shrink-0 flex-col gap-3 p-3 select-text", className)}
  >
    {children}
  </Card>
);

const Row = ({ label, children }: { readonly label: string; readonly children: ReactNode }) => (
  <div className="flex gap-4">
    <dt className="w-[clamp(96px,36cqw,168px)] shrink-0 text-subtle">{label}</dt>
    <dd className="flex min-w-0 flex-1 flex-col">{children}</dd>
  </div>
);

export const Details = { Root, Row };
