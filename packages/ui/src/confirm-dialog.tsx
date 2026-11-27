import { AlertDialog } from "@base-ui/react";
import { Button } from "./button.tsx";

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly onConfirm: () => void;
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: ConfirmDialogProps) => (
  <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
    <AlertDialog.Portal>
      <AlertDialog.Backdrop className="fixed inset-0 z-overlay bg-black/30 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
      <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-overlay flex w-[min(24rem,calc(100vw-2rem))] -translate-1/2 flex-col gap-2 rounded-xl bg-surface-overlay p-5 shadow-overlay outline-none transition-[opacity,scale] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
        <AlertDialog.Title className="font-medium">{title}</AlertDialog.Title>
        <AlertDialog.Description className="text-subtle">{description}</AlertDialog.Description>
        <div className="mt-3 flex justify-end gap-2">
          <AlertDialog.Close render={<Button intent="secondary" />}>Cancel</AlertDialog.Close>
          <Button intent="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </AlertDialog.Popup>
    </AlertDialog.Portal>
  </AlertDialog.Root>
);
