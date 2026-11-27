import { Dialog } from "@base-ui/react/dialog";
import { ArrowLeft01Icon, ArrowRight01Icon, Cancel01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { cn } from "cn";
import { type KeyboardEventHandler, type ReactNode, useRef } from "react";
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

const Close = () => <Dialog.Close render={<IconButton label="Close" icon={Cancel01Icon} />} />;

const edge =
  "absolute top-1/2 z-10 -translate-y-1/2 bg-surface-raised shadow-lifted opacity-0 transition-opacity group-hover/stage:opacity-100 focus-visible:opacity-100";

interface StageProps {
  readonly onPrevious: (() => void) | undefined;
  readonly onNext: (() => void) | undefined;
  readonly children: ReactNode;
}

const Stage = ({ onPrevious, onNext, children }: StageProps) => (
  <div className="group/stage relative mx-2 mb-2 min-h-0 flex-1 overflow-hidden rounded-lg bg-surface shadow-lifted">
    {children}
    {onPrevious ? (
      <IconButton
        label="Previous"
        icon={ArrowLeft01Icon}
        className={cn(edge, "left-4")}
        onClick={onPrevious}
      />
    ) : null}
    {onNext ? (
      <IconButton label="Next" icon={ArrowRight01Icon} className={cn(edge, "right-4")} onClick={onNext} />
    ) : null}
  </div>
);

export const Theater = { Root, Header, Start, Title, End, Separator, Close, Stage };
