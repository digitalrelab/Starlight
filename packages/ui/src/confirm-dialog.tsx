import type { IconSvgElement } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { AlertDialog } from "@base-ui/react";
import { cn } from "cn";
import { HoldButton } from "./hold-button.tsx";
import { Icon } from "./icon.tsx";
import { scaleMotion } from "./popup.ts";

const row =
  "flex h-11 w-full shrink-0 items-center gap-3 rounded-md px-dialog-row text-left outline-none highlighted:wash-neutral-subtle-hovered focus-visible:ring-2 focus-visible:ring-selected focus-visible:ring-inset";

const timing = "duration-200 data-[ending-style]:duration-150 data-[ending-style]:ease-in";

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly action: string;
  readonly subject: string;
  readonly message: string;
  readonly icon: IconSvgElement;
  readonly onConfirm: () => void;
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  action,
  subject,
  message,
  icon,
  onConfirm,
}: ConfirmDialogProps) => (
  <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
    <AlertDialog.Portal>
      <AlertDialog.Backdrop
        className={cn(
          "fixed inset-0 z-overlay bg-blanket transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
          timing,
        )}
      />
      <AlertDialog.Viewport className="fixed inset-0 z-overlay flex flex-col items-center p-4 before:max-h-[clamp(0rem,12vh_-_1rem,7rem)] before:grow after:grow">
        <AlertDialog.Popup
          className={cn(
            "flex w-120 max-w-full flex-col overflow-hidden rounded-xl bg-surface-overlay shadow-overlay outline-none",
            scaleMotion,
            timing,
          )}
        >
          <AlertDialog.Title className="sr-only">{action}</AlertDialog.Title>
          <div className="flex px-dialog pt-4">
            <span className="inline-flex h-6 max-w-full items-center truncate rounded-full bg-neutral px-2 text-sm text-default">
              {subject}
            </span>
          </div>
          <AlertDialog.Description className="flex min-h-14 items-center px-dialog text-lg">
            {message}
          </AlertDialog.Description>
          <div className="flex flex-col gap-0.5 px-[calc(var(--spacing-dialog)-var(--spacing-dialog-row))] pb-2">
            <AlertDialog.Close autoFocus className={row}>
              <Icon icon={ArrowLeft01Icon} className="text-subtle" />
              Cancel
            </AlertDialog.Close>
            <HoldButton
              className={cn(row, "text-danger")}
              onConfirm={() => {
                onOpenChange(false);
                onConfirm();
              }}
            >
              <Icon icon={icon} />
              {`Hold to ${action.charAt(0).toLowerCase()}${action.slice(1)}`}
            </HoldButton>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Viewport>
    </AlertDialog.Portal>
  </AlertDialog.Root>
);
