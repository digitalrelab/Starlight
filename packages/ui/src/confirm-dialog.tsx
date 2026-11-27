import type { IconSvgElement } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { AlertDialog } from "@base-ui/react";
import { cn } from "cn";
import { dialogBackdrop, dialogPopup, dialogRow, dialogRows, dialogViewport } from "./dialog.ts";
import { DialogSubject } from "./dialog-subject.tsx";
import { HoldButton } from "./hold-button.tsx";
import { Icon } from "./icon.tsx";

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
      <AlertDialog.Backdrop className={dialogBackdrop} />
      <AlertDialog.Viewport className={dialogViewport}>
        <AlertDialog.Popup className={cn(dialogPopup, "w-120")}>
          <AlertDialog.Title className="sr-only">{action}</AlertDialog.Title>
          <DialogSubject>{subject}</DialogSubject>
          <AlertDialog.Description className="flex min-h-14 items-center px-dialog text-lg">
            {message}
          </AlertDialog.Description>
          <div className={dialogRows}>
            <AlertDialog.Close autoFocus className={dialogRow}>
              <Icon icon={ArrowLeft01Icon} className="text-subtle" />
              Cancel
            </AlertDialog.Close>
            <HoldButton
              className={cn(dialogRow, "text-danger")}
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
