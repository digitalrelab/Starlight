import type { FileSession, FileSessionStatus } from "@starlight/client";
import { Button } from "@starlight/ui";
import type { ReactNode } from "react";

interface Props {
  readonly status: FileSessionStatus;
  readonly session: Pick<FileSession<unknown>, "keepMine" | "takeTheirs" | "retry">;
}

const Banner = ({ children }: { readonly children: ReactNode }) => (
  <div
    role="alert"
    className="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-surface-overlay py-1 pr-1 pl-3 shadow-overlay"
  >
    {children}
  </div>
);

export const FileSessionBanner = ({ status, session }: Props) => {
  if (status === "conflict") {
    return (
      <Banner>
        <span>This file changed outside Starlight.</span>
        <Button onClick={() => void session.takeTheirs()}>Reload</Button>
        <Button intent="secondary" onClick={session.keepMine}>
          Keep mine
        </Button>
      </Banner>
    );
  }
  if (status === "failed") {
    return (
      <Banner>
        <span>Couldn’t save your changes.</span>
        <Button intent="secondary" onClick={session.retry}>
          Try again
        </Button>
      </Banner>
    );
  }
  return null;
};
