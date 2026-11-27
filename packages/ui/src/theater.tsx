import { Dialog } from "@base-ui/react";
import { Cancel01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { cn } from "cn";
import { type KeyboardEventHandler, type ReactNode, useRef } from "react";
import { Card } from "./card.tsx";
import { IconButton } from "./icon-button.tsx";

interface RootProps {
  readonly onClose: () => void;
  readonly onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  readonly children: ReactNode;
}

const Root = ({ onClose, onKeyDown, children }: RootProps) => {
  const popupRef = useRef<HTMLDivElement>(null);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Popup
          ref={popupRef}
          initialFocus={popupRef}
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-overlay flex flex-col bg-surface-sunken outline-none"
        >
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

interface SlotProps {
  readonly className?: string;
  readonly children: ReactNode;
}

const Header = ({ className, children }: SlotProps) => (
  <header
    className={cn(
      "grid shrink-0 grid-cols-[minmax(max-content,1fr)_minmax(0,auto)_minmax(max-content,1fr)] items-center gap-2 pr-2",
      className,
    )}
  >
    {children}
  </header>
);

const Start = ({ className, children }: SlotProps) => (
  <div className={cn("flex items-center gap-1", className)}>{children}</div>
);

const Title = ({ children }: { readonly children: ReactNode }) => (
  <Dialog.Title className="flex min-w-0 items-center justify-center gap-2 font-medium text-default">
    {children}
  </Dialog.Title>
);

const End = ({ className, children }: SlotProps) => (
  <div className={cn("flex items-center justify-end gap-1", className)}>{children}</div>
);

const Separator = () => <span aria-hidden className="mx-1 h-5 border-l border-default" />;

const Close = () => (
  <Dialog.Close render={<IconButton label="Close" icon={Cancel01Icon} shortcut={["Escape"]} />} />
);

const Body = ({ aside, children }: { readonly aside?: ReactNode; readonly children: ReactNode }) => (
  <div className="flex min-h-0 flex-1">
    {children}
    {aside ? <div className="mr-2 mb-2 flex w-72 shrink-0 flex-col">{aside}</div> : null}
  </div>
);

const Stage = ({ children }: { readonly children: ReactNode }) => (
  <Card className="relative mx-2 mb-2 min-h-0 flex-1 overflow-hidden">{children}</Card>
);

export const Theater = { Root, Header, Start, Title, End, Separator, Close, Body, Stage };
