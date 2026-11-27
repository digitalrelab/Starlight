import type { IconSvgElement } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { Dialog } from "@base-ui/react";
import { cn } from "cn";
import { useRef } from "react";
import { dialogBackdrop, dialogPopup, dialogRow, dialogRows, dialogViewport } from "./dialog.ts";
import { Icon } from "./icon.tsx";

export interface NameDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly action: string;
  readonly subject: string;
  readonly icon: IconSvgElement;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly error: string | null;
  readonly pending: boolean;
  readonly onSubmit: () => void;
}

const selectStem = (input: HTMLInputElement) => {
  const dot = input.value.lastIndexOf(".");
  input.setSelectionRange(0, dot > 0 ? dot : input.value.length);
};

export const NameDialog = ({
  open,
  onOpenChange,
  action,
  subject,
  icon,
  value,
  onValueChange,
  error,
  pending,
  onSubmit,
}: NameDialogProps) => {
  const input = useRef<HTMLInputElement>(null);
  const submittable = value.trim() !== "" && !pending;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={dialogBackdrop} />
        <Dialog.Viewport className={dialogViewport}>
          <Dialog.Popup initialFocus={input} className={cn(dialogPopup, "w-120")}>
            <Dialog.Title className="sr-only">{action}</Dialog.Title>
            <div className="flex px-dialog pt-4">
              <span className="inline-flex h-6 max-w-full items-center truncate rounded-full bg-neutral px-2 text-sm text-default">
                {subject}
              </span>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (submittable) onSubmit();
              }}
            >
              <input
                ref={input}
                aria-label="Name"
                aria-invalid={error !== null}
                value={value}
                spellCheck={false}
                autoComplete="off"
                onFocus={(event) => selectStem(event.currentTarget)}
                onChange={(event) => onValueChange(event.currentTarget.value)}
                className="h-14 w-full bg-transparent px-dialog text-lg outline-none"
              />
              {error ? <p className="-mt-2 px-dialog pb-2 text-sm text-danger">{error}</p> : null}
              <div className={dialogRows}>
                <Dialog.Close type="button" className={dialogRow}>
                  <Icon icon={ArrowLeft01Icon} className="text-subtle" />
                  Cancel
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={!submittable}
                  className={cn(dialogRow, "disabled:text-subtle")}
                >
                  <Icon icon={icon} />
                  {action}
                </button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
